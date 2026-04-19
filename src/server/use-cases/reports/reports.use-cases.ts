import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { UsersRepository } from '@/server/repositories/users.repository';
import { ReportsRepository } from '@/server/repositories/reports.repository';
import { transactions } from '@/server/db/schema';
import { parseBudgetPeriodsFromJson } from '@/lib/utils/budget-period-json';
import { toDateTime, formatDateShort } from '@/lib/utils';
import { cached } from '@/lib/cache';
import type { Transaction, Account, BudgetPeriod, Category, User } from '@/lib/types';
import type { Json } from '@/lib/types/database.types';

/**
 * Report Period Summary with calculated metrics
 */
export interface ReportPeriodSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  startBalance: number;
  endBalance: number;
  totalEarned: number;
  totalSpent: number;
  metricsByAccountType: Record<string, AccountMetrics>;
  userId: string;
}

export interface AccountMetrics {
  earned: number;
  spent: number;
  startBalance: number;
  endBalance: number;
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

export interface CategoryStat {
  id: string;
  name: string;
  type: 'income' | 'expense';
  total: number;
  color: string;
}

/**
 * Normalizes account type for reporting
 */
function normalizeAccountType(type: string | undefined): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

/**
 * Get processed budget periods for a user including synthetic active one
 */
export function getProcessedUserPeriodsUseCase(user: User): BudgetPeriod[] {
  let userPeriods: BudgetPeriod[] = [];

  const rawPeriods = parseBudgetPeriodsFromJson(user.budget_periods as Json | null);
  if (rawPeriods.length > 0) {
    userPeriods = rawPeriods.map((bp) => ({
      ...bp,
      user_id: user.id,
    })) as BudgetPeriod[];
  }

  const hasActive = userPeriods.some((p) => p.is_active && !p.end_date);

  if (!hasActive) {
    addSyntheticActivePeriod(user, userPeriods);
  }

  return userPeriods;
}

function addSyntheticActivePeriod(user: User, periods: BudgetPeriod[]) {
  let startDateStr = new Date().toISOString().split('T')[0];

  if (periods.length > 0) {
    const sortedByEnd = [...periods].sort((a, b) => {
      const aEnd = a.end_date ? String(a.end_date) : '0000-00-00';
      const bEnd = b.end_date ? String(b.end_date) : '0000-00-00';
      return bEnd.localeCompare(aEnd);
    });

    const lastPeriod = sortedByEnd[0];
    if (lastPeriod && lastPeriod.end_date) {
      const lastEnd = new Date(lastPeriod.end_date);
      lastEnd.setDate(lastEnd.getDate() + 1);
      startDateStr = lastEnd.toISOString().split('T')[0];
    }
  } else if (user.budget_start_date) {
    const now = new Date();
    const day = user.budget_start_date;
    const validDate = new Date(now.getFullYear(), now.getMonth(), day);

    if (now < validDate) {
      validDate.setMonth(validDate.getMonth() - 1);
    }

    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const d = String(validDate.getDate()).padStart(2, '0');
    startDateStr = `${year}-${month}-${d}`;
  }

  const today = new Date().toISOString().split('T')[0];
  if (startDateStr != null && today != null && startDateStr <= today) {
    const nowIso = new Date().toISOString();
    periods.push({
      id: `active-generated-${user.id}`,
      start_date: startDateStr,
      end_date: null,
      is_active: true,
      user_id: user.id,
      created_at: nowIso,
      updated_at: nowIso,
    });
  }
}

/**
 * Main Reports Data Fetching Use Case
 */
export async function getReportsDataUseCase(groupId: string, groupUserIds?: string[]) {
  if (!groupId) throw new Error('Reports: groupId is required');

  // Fetch data in parallel using repositories
  const [users, allAccounts, allCategories, { data: allTransactions }] = await Promise.all([
    UsersRepository.findByGroupId(groupId),
    AccountsRepository.findByGroup(groupId),
    CategoriesRepository.findByGroup(groupId),
    TransactionsRepository.getByGroup(groupId),
  ]);

  // Drizzle returns numeric() columns as strings from Postgres — coerce to numbers here
  const normalizedTransactions: Transaction[] = (allTransactions || []).map(
    (t: typeof transactions.$inferSelect) => ({
      ...t,
      amount: Number(t.amount),
    })
  ) as Transaction[];

  const normalizedAccounts: Account[] = (allAccounts || []).map((a: Account) => ({
    ...a,
    balance: Number(a.balance),
  })) as Account[];

  const filteredUsers =
    groupUserIds && groupUserIds.length > 0
      ? users.filter((u) => groupUserIds.includes(u.id))
      : users;

  // Process periods for each user
  const allPeriods: BudgetPeriod[] = filteredUsers.flatMap((u) =>
    getProcessedUserPeriodsUseCase(u)
  );

  return {
    transactions: normalizedTransactions,
    accounts: normalizedAccounts,
    periods: allPeriods,
    categories: allCategories || [],
    users: filteredUsers,
  };
}

/**
 * Calculate user flow summary
 */
export function calculateUserFlowSummaryUseCase(
  transactions: Transaction[],
  accounts: Account[],
  userIds: string[]
): UserFlowSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const userFlows = new Map<
    string,
    Map<string, { earned: number; spent: number; balance: number }>
  >();

  for (const uid of userIds) {
    userFlows.set(uid, new Map());
  }

  // Seed with account balances
  for (const account of accounts) {
    const type = normalizeAccountType(account.type);
    for (const uid of account.user_ids) {
      if (!userFlows.has(uid)) continue;
      const typeMap = userFlows.get(uid)!;
      if (!typeMap.has(type)) {
        typeMap.set(type, { earned: 0, spent: 0, balance: 0 });
      }
      typeMap.get(type)!.balance += account.balance || 0;
    }
  }

  // Aggregate transactions
  for (const t of transactions) {
    const uid = t.user_id;
    if (!uid || !userFlows.has(uid)) continue;

    const account = accountMap.get(t.account_id);
    if (!account) continue;

    const type = normalizeAccountType(account.type);
    const typeMap = userFlows.get(uid)!;

    const ensureBucket = (key: string) => {
      if (!typeMap.has(key)) typeMap.set(key, { earned: 0, spent: 0, balance: 0 });
      return typeMap.get(key)!;
    };

    if (t.type === 'income') {
      ensureBucket(type).earned += t.amount;
    } else if (t.type === 'expense') {
      ensureBucket(type).spent += t.amount;
    } else if (t.type === 'transfer' && t.to_account_id) {
      const toAccount = accountMap.get(t.to_account_id);
      if (!toAccount) continue;
      const toType = normalizeAccountType(toAccount.type);
      ensureBucket(type).spent += t.amount;
      ensureBucket(toType).earned += t.amount;
    }
  }

  return userIds.map((uid) => {
    const typeMap = userFlows.get(uid) || new Map();
    const accountFlows: UserAccountFlow[] = Array.from(typeMap.entries()).map(
      ([accountType, data]) => ({
        accountType,
        balance: data.balance,
        earned: data.earned,
        spent: data.spent,
        net: data.earned - data.spent,
      })
    );

    const totalEarned = accountFlows.reduce((s, a) => s + a.earned, 0);
    const totalSpent = accountFlows.reduce((s, a) => s + a.spent, 0);

    return {
      userId: uid,
      totalEarned,
      totalSpent,
      netFlow: totalEarned - totalSpent,
      accounts: accountFlows.sort((a, b) => b.balance - a.balance),
    };
  });
}

/**
 * Calculate account type summary for the group
 */
export function calculateAccountTypeSummaryUseCase(
  transactions: Transaction[],
  accounts: Account[]
): AccountTypeSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const typeSummaryMap = new Map<
    string,
    { balance: number; earned: number; spent: number; count: number }
  >();

  // Initial balances from accounts
  for (const acc of accounts) {
    const type = normalizeAccountType(acc.type);
    if (!typeSummaryMap.has(type)) {
      typeSummaryMap.set(type, { balance: 0, earned: 0, spent: 0, count: 0 });
    }
    typeSummaryMap.get(type)!.balance += acc.balance || 0;
  }

  // Aggregate transactions
  for (const t of transactions) {
    const acc = accountMap.get(t.account_id);
    if (!acc) continue;

    const type = normalizeAccountType(acc.type);
    if (!typeSummaryMap.has(type)) {
      typeSummaryMap.set(type, { balance: 0, earned: 0, spent: 0, count: 0 });
    }

    const metrics = typeSummaryMap.get(type)!;
    if (t.type === 'income') {
      metrics.earned += t.amount;
      metrics.count++;
    } else if (t.type === 'expense') {
      metrics.spent += t.amount;
      metrics.count++;
    } else if (t.type === 'transfer' && t.to_account_id) {
      const toAcc = accountMap.get(t.to_account_id);
      if (toAcc) {
        const toType = normalizeAccountType(toAcc.type);
        metrics.spent += t.amount;
        if (!typeSummaryMap.has(toType)) {
          typeSummaryMap.set(toType, { balance: 0, earned: 0, spent: 0, count: 0 });
        }
        typeSummaryMap.get(toType)!.earned += t.amount;
      }
    }
  }

  return Array.from(typeSummaryMap.entries()).map(([accountType, data]) => ({
    accountType,
    totalBalance: data.balance,
    totalEarned: data.earned,
    totalSpent: data.spent,
    transactionCount: data.count,
  }));
}

/**
 * Calculate period summaries
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

  const userTypeBalances = new Map<string, Map<string, number>>();

  for (const acc of accounts) {
    const type = normalizeAccountType(acc.type);
    acc.user_ids.forEach((uid) => {
      if (!userTypeBalances.has(uid)) userTypeBalances.set(uid, new Map());
      const userBalances = userTypeBalances.get(uid)!;
      userBalances.set(type, (userBalances.get(type) || 0) + (acc.balance || 0));
    });
  }

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

      const metricsByAccountType: Record<string, AccountMetrics> = {};
      const accountMap = new Map(accounts.map((a) => [a.id, a]));

      for (const t of pTransactions) {
        const account = accountMap.get(t.account_id);
        if (!account) continue;
        const type = normalizeAccountType(account.type);

        if (!metricsByAccountType[type]) {
          metricsByAccountType[type] = { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
        }

        if (t.type === 'income') {
          metricsByAccountType[type].earned += t.amount;
        } else if (t.type === 'expense') {
          metricsByAccountType[type].spent += t.amount;
        } else if (t.type === 'transfer' && t.to_account_id) {
          const toAccount = accountMap.get(t.to_account_id);
          const toType = toAccount ? normalizeAccountType(toAccount.type) : null;
          metricsByAccountType[type].spent += t.amount;
          if (toType) {
            if (!metricsByAccountType[toType]) {
              metricsByAccountType[toType] = {
                earned: 0,
                spent: 0,
                startBalance: 0,
                endBalance: 0,
              };
            }
            metricsByAccountType[toType].earned += t.amount;
          }
        }
      }

      const userBalances = userTypeBalances.get(period.user_id) || new Map<string, number>();
      const allTypes = new Set([...Object.keys(metricsByAccountType), ...userBalances.keys()]);

      allTypes.forEach((type) => {
        const currentEndBalance = userBalances.get(type) || 0;
        if (!metricsByAccountType[type]) {
          metricsByAccountType[type] = { earned: 0, spent: 0, startBalance: 0, endBalance: 0 };
        }
        const metrics = metricsByAccountType[type];
        const netChange = metrics.earned - metrics.spent;
        const calculatedStartBalance = currentEndBalance - netChange;
        metrics.endBalance = currentEndBalance;
        metrics.startBalance = calculatedStartBalance;
        userBalances.set(type, calculatedStartBalance);
      });

      const totalEarned = pTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalSpent = pTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        id: period.id,
        name: `${formatDateShort(period.start_date)} - ${period.end_date ? formatDateShort(period.end_date) : 'Present'}`,
        startDate: period.start_date,
        endDate: period.end_date || new Date().toISOString().split('T')[0],
        startBalance: Object.values(metricsByAccountType).reduce(
          (sum, m) => sum + m.startBalance,
          0
        ),
        endBalance: Object.values(metricsByAccountType).reduce((sum, m) => sum + m.endBalance, 0),
        totalEarned,
        totalSpent,
        metricsByAccountType,
        userId: period.user_id,
      };
    })
    .filter(Boolean) as ReportPeriodSummary[];
}

/**
 * Calculate category stats
 */
export function calculateCategoryStatsUseCase(
  transactions: Transaction[],
  categories: Category[]
): { income: CategoryStat[]; expense: CategoryStat[] } {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const statsMap = new Map<string, CategoryStat>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;

    const catId = t.category;
    const category =
      categoryMap.get(catId) ||
      Array.from(categoryMap.values()).find((c) => c.key.toLowerCase() === catId.toLowerCase());

    const catKey = category?.id || catId;

    if (!statsMap.has(catKey)) {
      statsMap.set(catKey, {
        id: catKey,
        name: category?.label || catId,
        type: t.type,
        total: 0,
        color: category?.color || '#cbd5e1',
      });
    }

    statsMap.get(catKey)!.total += t.amount;
  }

  const allStats = Array.from(statsMap.values());
  return {
    income: allStats.filter((s) => s.type === 'income').sort((a, b) => b.total - a.total),
    expense: allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total),
  };
}

/**
 * Calculate time trends
 */
export function calculateTimeTrendsUseCase(
  transactions: Transaction[],
  range: { start: Date; end: Date }
) {
  const dailyMap = new Map<string, { date: string; income: number; expense: number }>();

  transactions.forEach((t) => {
    const date = toDateTime(t.date);
    if (!date || date.toJSDate() < range.start || date.toJSDate() > range.end) return;
    if (t.type === 'transfer') return;

    const key = date.toISODate() || formatDateShort(t.date);
    if (!dailyMap.has(key)) {
      dailyMap.set(key, { date: key, income: 0, expense: 0 });
    }
    const entry = dailyMap.get(key)!;

    if (t.type === 'income') entry.income += t.amount;
    if (t.type === 'expense') entry.expense += t.amount;
  });

  return Array.from(dailyMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Get group category spending (wrapped in cached)
 */
export async function getGroupCategorySpendingUseCase(
  groupId: string,
  startDate: Date,
  endDate: Date
) {
  return cached(
    async () => {
      const data = await ReportsRepository.getGroupCategorySpending(groupId, startDate, endDate);
      return data.map((item) => ({
        ...item,
        spent: Number(item.spent),
        transaction_count: Number(item.transaction_count),
      }));
    },
    ['group-category-spending', groupId, startDate.toISOString(), endDate.toISOString()],
    { revalidate: 300 }
  )();
}

/**
 * Get per-user category spending (spent vs income) for a group and date range.
 */
export async function getGroupUserCategorySpendingUseCase(
  groupId: string,
  startDate: Date,
  endDate: Date
) {
  return cached(
    async () => {
      const data = await ReportsRepository.getGroupUserCategorySpending(
        groupId,
        startDate,
        endDate
      );
      return data.map((item) => ({
        ...item,
        spent: Number(item.spent),
        income: Number(item.income),
        transaction_count: Number(item.transaction_count),
      }));
    },
    ['group-user-category-spending', groupId, startDate.toISOString(), endDate.toISOString()],
    { revalidate: 300 }
  )();
}

/**
 * Get group monthly spending (wrapped in cached)
 */
export async function getGroupMonthlySpendingUseCase(
  groupId: string,
  startDate: Date,
  endDate: Date
) {
  return cached(
    async () => {
      const data = await ReportsRepository.getGroupMonthlySpending(groupId, startDate, endDate);
      return data.map((item) => ({
        ...item,
        income: Number(item.income),
        expense: Number(item.expense),
      }));
    },
    ['group-monthly-spending', groupId, startDate.toISOString(), endDate.toISOString()],
    { revalidate: 300 }
  )();
}
