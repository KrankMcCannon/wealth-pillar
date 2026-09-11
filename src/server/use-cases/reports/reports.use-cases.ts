import type { Account, Budget, BudgetPeriod, Transaction, User } from '@/lib/types';
import { formatDateShort, toDateString, toDateTime } from '@/lib/utils';
import { roundMoney } from '@/lib/utils/money';
import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { transactions } from '@/server/db/schema';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import {
  allocatedFromBudgets,
  resolvePeriodBudgets,
} from '@/server/use-cases/budget-periods/period-budgets.logic';
import { addSyntheticActivePeriod } from '@/server/use-cases/budget-periods/synthetic-active-period.logic';
import { getBudgetsByGroupUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { parsePeriodDates } from '@/server/use-cases/shared/period.logic';
import {
  accountsToMap,
  computeTransactionImpact,
} from '@/server/use-cases/shared/transaction-impact.logic';

/** Spent vs allocation: live envelope spend (income/expense and categorized transfers). */
export interface ReportPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  spendableSpent: number;
  allocated: number;
  remaining: number;
  userId: string;
  /** True when the period has no end date (open / synthetic “Present”). */
  isOpen: boolean;
}

interface PeriodSlot {
  period: BudgetPeriod;
  startMs: number;
  endMs: number;
  spent: number;
  allocated: number;
  categoryKeys: Set<string>;
}

function categoryKeysFromBudgets(budgets: Budget[]): Set<string> {
  const cats = new Set<string>();
  for (const budget of budgets) {
    if (budget.amount <= 0) continue;
    for (const key of budget.categories) cats.add(key);
  }
  return cats;
}

function liveBudgetsByUserId(budgets: Budget[]): Map<string, Budget[]> {
  const map = new Map<string, Budget[]>();
  for (const budget of budgets) {
    const list = map.get(budget.user_id);
    if (list) list.push(budget);
    else map.set(budget.user_id, [budget]);
  }
  return map;
}

function slotContaining(slots: PeriodSlot[], t: number): PeriodSlot | undefined {
  for (const candidate of slots) {
    if (t >= candidate.startMs && t <= candidate.endMs) return candidate;
  }
  return undefined;
}

export interface UserAccountFlow {
  accountType: string;
  balance: number;
  earned: number;
  spent: number;
  net: number;
}

export interface UserFlowSummary {
  userId: string;
  totalEarned: number;
  totalSpent: number;
  netFlow: number;
  accounts: UserAccountFlow[];
}

export interface AccountTypeSummary {
  accountType: string;
  totalBalance: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
}

/**
 * Resolve the "year to date" window start anchored to budget periods.
 *
 * Returns the earliest start_date among budget periods that straddle 1 Jan of the
 * current year (start <= 1 Jan <= end), so the YTD window aligns to the budget
 * boundary instead of the calendar 1 Jan. Returns null when no period straddles it.
 */
export function resolveYtdBudgetStart(
  periods: BudgetPeriod[],
  now: Date = new Date()
): Date | null {
  const yearStartMs = new Date(now.getFullYear(), 0, 1).getTime();
  let earliest: number | null = null;

  for (const period of periods) {
    const start = toDateTime(period.start_date)?.toJSDate().getTime();
    const end = (period.end_date ? toDateTime(period.end_date) : toDateTime(now))
      ?.toJSDate()
      .getTime();
    if (start == null || end == null) continue;
    if (start <= yearStartMs && end >= yearStartMs) {
      if (earliest == null || start < earliest) earliest = start;
    }
  }

  return earliest != null ? new Date(earliest) : null;
}

/**
 * Get processed budget periods for a user including synthetic active one
 */
export async function getProcessedUserPeriodsUseCase(user: User): Promise<BudgetPeriod[]> {
  const userPeriods = await BudgetPeriodsRepository.findByUser(user.id);

  const hasActive = userPeriods.some((p) => p.is_active && !p.end_date);

  if (!hasActive) {
    addSyntheticActivePeriod(user, userPeriods);
  }

  return userPeriods;
}

/**
 * Users, accounts, categories, budgets, and periods — no transactions.
 * Resolve reporting windows from this context before fetching txs.
 */
export async function getReportsContextUseCase(groupId: string, groupUserIds?: string[]) {
  if (!groupId) throw new Error('Reports: groupId is required');

  const [users, allAccounts, allCategories, budgets] = await Promise.all([
    UsersRepository.findByGroupId(groupId),
    AccountsRepository.findByGroup(groupId),
    CategoriesRepository.findByGroup(groupId),
    getBudgetsByGroupUseCase(groupId),
  ]);

  const normalizedAccounts: Account[] = (allAccounts || []).map((a: Account) => ({
    ...a,
    balance: Number(a.balance),
  })) as Account[];

  const filteredUsers =
    groupUserIds && groupUserIds.length > 0
      ? users.filter((u) => groupUserIds.includes(u.id))
      : users;

  const periodArrays = await Promise.all(
    filteredUsers.map((u) => getProcessedUserPeriodsUseCase(u))
  );
  const allPeriods: BudgetPeriod[] = periodArrays.flat();

  return {
    accounts: normalizedAccounts,
    periods: allPeriods,
    categories: allCategories || [],
    users: filteredUsers,
    budgets,
  };
}

export async function getReportsTransactionsUseCase(
  groupId: string,
  window: { startDate: Date; endDate: Date }
): Promise<{ transactions: Transaction[]; hasMore: boolean }> {
  const { data: allTransactions, hasMore } = await TransactionsRepository.getByGroup(groupId, {
    startDate: window.startDate,
    endDate: window.endDate,
    limit: REPORTS_TRANSACTIONS_LIMIT,
    countTotal: false,
  });

  const normalizedTransactions: Transaction[] = (allTransactions || []).map(
    (t: typeof transactions.$inferSelect) => ({
      ...t,
      amount: Number(t.amount),
    })
  ) as Transaction[];

  return { transactions: normalizedTransactions, hasMore };
}

/** One pass over txs: leftover vs allocation. Reserve flow lives on the reports window. */
export function calculatePeriodSummariesUseCase(
  periods: BudgetPeriod[],
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[] = []
): ReportPeriodSummary[] {
  const now = new Date();
  const liveByUser = liveBudgetsByUserId(budgets);
  const accountMap = accountsToMap(accounts);
  const slotsByUser = new Map<string, PeriodSlot[]>();

  for (const period of periods) {
    const [start, end] = parsePeriodDates(period, now);
    const periodBudgets = resolvePeriodBudgets(period, liveByUser.get(period.user_id) ?? []);
    const slot: PeriodSlot = {
      period,
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      spent: 0,
      allocated: allocatedFromBudgets(periodBudgets),
      categoryKeys: categoryKeysFromBudgets(periodBudgets),
    };
    const list = slotsByUser.get(period.user_id);
    if (list) list.push(slot);
    else slotsByUser.set(period.user_id, [slot]);
  }

  for (const tx of transactions) {
    const impact = computeTransactionImpact(tx, accountMap);
    const t = toDateTime(tx.date)?.toMillis();
    if (t == null) continue;

    for (const leg of impact.budgetLegs) {
      const slot = slotContaining(slotsByUser.get(leg.userId) ?? [], t);
      if (!slot || !slot.categoryKeys.has(tx.category)) continue;
      slot.spent += leg.signed;
    }
  }

  const summaries: ReportPeriodSummary[] = [];
  for (const slots of slotsByUser.values()) {
    for (const slot of slots) {
      const spent = roundMoney(Math.max(0, slot.spent));
      const period = slot.period;
      const allocated = slot.allocated;
      summaries.push({
        id: period.id,
        name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
        startDate: toDateString(period.start_date),
        endDate: toDateString(period.end_date ?? now),
        spendableSpent: spent,
        allocated,
        remaining: roundMoney(allocated - spent),
        userId: period.user_id,
        isOpen: period.end_date == null,
      });
    }
  }

  summaries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return summaries;
}
