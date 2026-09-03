import { REPORTS_TRANSACTIONS_LIMIT } from '@/server/db/query-limits';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { transactions } from '@/server/db/schema';
import { toDateTime, formatDateShort } from '@/lib/utils';
import type { Transaction, Account, BudgetPeriod, User, AccountLiquidity } from '@/lib/types';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { addSyntheticActivePeriod } from '@/server/use-cases/budget-periods/synthetic-active-period.logic';

export interface PeriodLiquidityBalance {
  startBalance: number;
  endBalance: number;
}

/**
 * Report Period Summary with spendable/reserve balance breakdown
 */
export interface ReportPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startBalance: number;
  endBalance: number;
  spendable: PeriodLiquidityBalance;
  reserve: PeriodLiquidityBalance;
  userId: string;
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

type LiquidityMetrics = { earned: number; spent: number; startBalance: number; endBalance: number };

function emptyLiquidityMetrics(): LiquidityMetrics {
  return { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
}

function ensureLiquidityBucket(
  map: Partial<Record<AccountLiquidity, LiquidityMetrics>>,
  key: AccountLiquidity
): LiquidityMetrics {
  if (!map[key]) map[key] = emptyLiquidityMetrics();
  return map[key];
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
 * Users, accounts, categories, and periods — no transactions.
 * Resolve reporting windows from this context before fetching txs.
 */
export async function getReportsContextUseCase(groupId: string, groupUserIds?: string[]) {
  if (!groupId) throw new Error('Reports: groupId is required');

  const [users, allAccounts, allCategories] = await Promise.all([
    UsersRepository.findByGroupId(groupId),
    AccountsRepository.findByGroup(groupId),
    CategoriesRepository.findByGroup(groupId),
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
 * Calculate period summaries with spendable/reserve balance breakdown per period.
 */
export function calculatePeriodSummariesUseCase(
  periods: BudgetPeriod[],
  transactions: Transaction[],
  accounts: Account[]
): ReportPeriodSummary[] {
  const sortedPeriods = [...periods].sort((a, b) => {
    const aTime = toDateTime(a.start_date)?.toMillis() || 0;
    const bTime = toDateTime(b.start_date)?.toMillis() || 0;
    return bTime - aTime;
  });

  const userLiquidityBalances = new Map<string, Map<AccountLiquidity, number>>();

  for (const acc of accounts) {
    const liquidity = resolveAccountLiquidity(acc);
    for (const uid of acc.user_ids) {
      if (!userLiquidityBalances.has(uid)) {
        userLiquidityBalances.set(uid, new Map());
      }
      const userBalances = userLiquidityBalances.get(uid)!;
      userBalances.set(liquidity, (userBalances.get(liquidity) || 0) + (acc.balance || 0));
    }
  }

  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const liquidityKeys: AccountLiquidity[] = ['spendable', 'reserve'];

  return sortedPeriods
    .map((period) => {
      const pStart = toDateTime(period.start_date);
      const pEnd = toDateTime(period.end_date ?? new Date());
      if (!pStart || !pEnd) return null;

      const pTransactions = transactions.filter((t) => {
        if (t.user_id !== period.user_id) return false;
        const date = toDateTime(t.date);
        return date && date >= pStart && date <= pEnd;
      });

      const metricsByLiquidity: Partial<Record<AccountLiquidity, LiquidityMetrics>> = {};

      for (const t of pTransactions) {
        const account = accountMap.get(t.account_id);
        if (!account) continue;
        const sourceLiquidity = resolveAccountLiquidity(account);

        if (t.type === 'income') {
          ensureLiquidityBucket(metricsByLiquidity, sourceLiquidity).earned += t.amount;
        } else if (t.type === 'expense') {
          ensureLiquidityBucket(metricsByLiquidity, sourceLiquidity).spent += t.amount;
        } else if (t.type === 'transfer' && t.to_account_id) {
          const toAccount = accountMap.get(t.to_account_id);
          if (!toAccount) continue;
          const destLiquidity = resolveAccountLiquidity(toAccount);
          ensureLiquidityBucket(metricsByLiquidity, sourceLiquidity).spent += t.amount;
          ensureLiquidityBucket(metricsByLiquidity, destLiquidity).earned += t.amount;
        }
      }

      const userBalances =
        userLiquidityBalances.get(period.user_id) || new Map<AccountLiquidity, number>();
      const allLiquidity = new Set<AccountLiquidity>([
        ...liquidityKeys,
        ...userBalances.keys(),
        ...(Object.keys(metricsByLiquidity) as AccountLiquidity[]),
      ]);

      for (const liquidity of allLiquidity) {
        const currentEndBalance = userBalances.get(liquidity) || 0;
        const metrics = ensureLiquidityBucket(metricsByLiquidity, liquidity);
        const netChange = metrics.earned - metrics.spent;
        const calculatedStartBalance = currentEndBalance - netChange;
        metrics.endBalance = currentEndBalance;
        metrics.startBalance = calculatedStartBalance;
        userBalances.set(liquidity, calculatedStartBalance);
      }

      const spendableMetrics = metricsByLiquidity.spendable ?? emptyLiquidityMetrics();
      const reserveMetrics = metricsByLiquidity.reserve ?? emptyLiquidityMetrics();

      return {
        id: period.id,
        name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
        startDate: period.start_date,
        endDate: period.end_date || new Date().toISOString().split('T')[0],
        startBalance: spendableMetrics.startBalance + reserveMetrics.startBalance,
        endBalance: spendableMetrics.endBalance + reserveMetrics.endBalance,
        spendable: {
          startBalance: spendableMetrics.startBalance,
          endBalance: spendableMetrics.endBalance,
        },
        reserve: {
          startBalance: reserveMetrics.startBalance,
          endBalance: reserveMetrics.endBalance,
        },
        userId: period.user_id,
      };
    })
    .filter(Boolean) as ReportPeriodSummary[];
}
