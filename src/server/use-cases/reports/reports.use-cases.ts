import type { Account, Budget, BudgetPeriod, Transaction, User } from '@/lib/types';
import { formatDateShort, toDateString, toDateTime } from '@/lib/utils';
import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { transactions } from '@/server/db/schema';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { resolvePeriodBudgets } from '@/server/use-cases/budget-periods/period-budgets.logic';
import { addSyntheticActivePeriod } from '@/server/use-cases/budget-periods/synthetic-active-period.logic';
import { calculateEnvelopePeriodTotals } from '@/server/use-cases/budgets/budget.logic';
import { getBudgetsByGroupUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { parsePeriodDates } from '@/server/use-cases/shared/period.logic';

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

function liveBudgetsByUserId(budgets: Budget[]): Map<string, Budget[]> {
  const map = new Map<string, Budget[]>();
  for (const budget of budgets) {
    const list = map.get(budget.user_id);
    if (list) list.push(budget);
    else map.set(budget.user_id, [budget]);
  }
  return map;
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

/** Leftover vs allocation: sum of period envelope spent (same as the cards). */
export function calculatePeriodSummariesUseCase(
  periods: BudgetPeriod[],
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[] = []
): ReportPeriodSummary[] {
  const now = new Date();
  const liveByUser = liveBudgetsByUserId(budgets);
  const summaries: ReportPeriodSummary[] = [];

  for (const period of periods) {
    const [start, end] = parsePeriodDates(period, now);
    const periodBudgets = resolvePeriodBudgets(period, liveByUser.get(period.user_id) ?? []);
    const totals = calculateEnvelopePeriodTotals(
      periodBudgets,
      transactions,
      start,
      end,
      accounts,
      period.user_id
    );
    summaries.push({
      id: period.id,
      name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
      startDate: toDateString(period.start_date),
      endDate: toDateString(period.end_date ?? now),
      spendableSpent: totals.spent,
      allocated: totals.allocated,
      remaining: totals.remaining,
      userId: period.user_id,
      isOpen: period.end_date == null,
    });
  }

  summaries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return summaries;
}
