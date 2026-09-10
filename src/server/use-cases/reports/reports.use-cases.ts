import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { transactions } from '@/server/db/schema';
import { toDateTime, formatDateShort, toDateString } from '@/lib/utils';
import { roundMoney } from '@/lib/utils/money';
import { isReserveAccount } from '@/lib/utils/account-classification';
import type { Transaction, Account, Budget, BudgetPeriod, User } from '@/lib/types';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { addSyntheticActivePeriod } from '@/server/use-cases/budget-periods/synthetic-active-period.logic';
import { getBudgetsByGroupUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';
import { parsePeriodDates } from '@/server/use-cases/shared/period.logic';
import { classifyTransferSavingsDelta } from '@/server/use-cases/shared/savings.logic';

/**
 * Spent vs allocation: live budget spend (income nets, transfers skipped).
 * Risparmi start/end: unwind reserveSaved from current reserve balances
 * (transfer net only — not direct reserve income).
 */
export interface ReportPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  spendableSpent: number;
  reserveSaved: number;
  allocated: number;
  remaining: number;
  reserveStart: number;
  reserveEnd: number;
  userId: string;
  /** True when the period has no end date (open / synthetic “Present”). */
  isOpen: boolean;
}

interface PeriodSlot {
  period: BudgetPeriod;
  startMs: number;
  endMs: number;
  spent: number;
  reserveSaved: number;
  liveReserve: boolean;
}

function categoryKeysByUser(budgets: Budget[]): Map<string, Set<string>> {
  const cats = new Map<string, Set<string>>();
  for (const budget of budgets) {
    if (budget.amount <= 0) continue;
    let set = cats.get(budget.user_id);
    if (!set) {
      set = new Set();
      cats.set(budget.user_id, set);
    }
    for (const key of budget.categories) set.add(key);
  }
  return cats;
}

function allocatedByUserId(budgets: Budget[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const budget of budgets) {
    if (budget.amount <= 0) continue;
    map.set(budget.user_id, (map.get(budget.user_id) ?? 0) + budget.amount);
  }
  return map;
}

function reserveBalanceByUser(accounts: Account[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const account of accounts) {
    if (!isReserveAccount(account)) continue;
    const bal = Number(account.balance) || 0;
    for (const uid of account.user_ids) {
      map.set(uid, (map.get(uid) ?? 0) + bal);
    }
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

/**
 * One pass over txs per user. Reserve start/end unwind transfer-net from current balances.
 */
export function calculatePeriodSummariesUseCase(
  periods: BudgetPeriod[],
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[] = []
): ReportPeriodSummary[] {
  const now = new Date();
  const allocatedByUser = allocatedByUserId(budgets);
  const catsByUser = categoryKeysByUser(budgets);
  const reserveNow = reserveBalanceByUser(accounts);
  const accountMap = new Map(accounts.map((account) => [account.id, account]));

  const slotsByUser = new Map<string, PeriodSlot[]>();
  for (const period of periods) {
    const [start, end] = parsePeriodDates(period, now);
    const slot: PeriodSlot = {
      period,
      startMs: start.toMillis(),
      endMs: end.toMillis(),
      spent: 0,
      reserveSaved:
        period.snapshot_at != null ? roundMoney(Number(period.reserve_saved) || 0) : 0,
      liveReserve: period.snapshot_at == null,
    };
    const list = slotsByUser.get(period.user_id);
    if (list) list.push(slot);
    else slotsByUser.set(period.user_id, [slot]);
  }

  for (const tx of transactions) {
    const userId = tx.user_id;
    if (!userId) continue;
    const slots = slotsByUser.get(userId);
    if (!slots) continue;
    const t = toDateTime(tx.date)?.toMillis();
    if (t == null) continue;
    let slot: PeriodSlot | undefined;
    for (const candidate of slots) {
      if (t >= candidate.startMs && t <= candidate.endMs) {
        slot = candidate;
        break;
      }
    }
    if (!slot) continue;

    const cats = catsByUser.get(userId);
    if (cats?.has(tx.category)) {
      if (tx.type === 'expense') slot.spent += tx.amount;
      else if (tx.type === 'income') slot.spent -= tx.amount;
    }

    if (slot.liveReserve && tx.type === 'transfer' && tx.to_account_id) {
      const source = accountMap.get(tx.account_id);
      const dest = accountMap.get(tx.to_account_id);
      if (source && dest) {
        slot.reserveSaved += classifyTransferSavingsDelta(source, dest, tx.amount);
      }
    }
  }

  const summaries: ReportPeriodSummary[] = [];
  for (const [userId, slots] of slotsByUser) {
    slots.sort((a, b) => b.startMs - a.startMs);
    let running = roundMoney(reserveNow.get(userId) ?? 0);
    const allocated = roundMoney(allocatedByUser.get(userId) ?? 0);
    for (const slot of slots) {
      const spent = roundMoney(Math.max(0, slot.spent));
      const reserveSaved = roundMoney(slot.reserveSaved);
      const reserveEnd = running;
      const reserveStart = roundMoney(running - reserveSaved);
      running = reserveStart;
      const period = slot.period;
      summaries.push({
        id: period.id,
        name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
        startDate: toDateString(period.start_date),
        endDate: toDateString(period.end_date ?? now),
        spendableSpent: spent,
        reserveSaved,
        allocated,
        remaining: roundMoney(allocated - spent),
        reserveStart,
        reserveEnd,
        userId: period.user_id,
        isOpen: period.end_date == null,
      });
    }
  }

  summaries.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  return summaries;
}
