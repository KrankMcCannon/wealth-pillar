import type { Transaction, CategoryBreakdownItem, Category } from '@/lib/types';
import {
  toDateTime,
  now as luxonNow,
  isToday,
  isWithinWeek,
  isWithinMonth,
  isWithinYear,
} from '@/lib/utils';
import type { DateInput } from '@/lib/utils/date-utils';

/**
 * Filter transactions within a date range
 */
export function filterTransactionsByPeriod(
  transactions: Transaction[],
  startDate: DateInput,
  endDate: DateInput
): Transaction[] {
  const periodStart = toDateTime(startDate);
  if (!periodStart) return [];
  const normalizedStart = periodStart.startOf('day');

  const periodEnd = endDate ? toDateTime(endDate) : luxonNow();
  if (!periodEnd) return [];
  const normalizedEnd = periodEnd.endOf('day');

  return transactions.filter((t) => {
    const txDate = toDateTime(t.date);
    if (!txDate) return false;
    return txDate >= normalizedStart && txDate <= normalizedEnd;
  });
}

/**
 * Filter transactions by categories
 */
export function filterByCategories(
  transactions: Transaction[],
  categories: string[]
): Transaction[] {
  const categorySet = new Set(categories);
  return transactions.filter((t) => categorySet.has(t.category));
}

export interface OverviewMetrics {
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalBalance: number;
}

/**
 * Calculate overall metrics
 */
export function calculateOverviewMetrics(
  transactions: Transaction[],
  userAccountIds: string[],
  userId?: string
): OverviewMetrics {
  const accountSet = new Set(userAccountIds);
  let totalEarned = 0;
  let totalSpent = 0;
  let totalTransferred = 0;

  for (const t of transactions) {
    if (userId && t.user_id !== userId) continue;

    if (t.type === 'income' && accountSet.has(t.account_id)) {
      totalEarned += t.amount;
    } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
      totalSpent += t.amount;
    } else if (t.type === 'transfer') {
      const fromUserAccount = accountSet.has(t.account_id);
      const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

      if (fromUserAccount) {
        totalTransferred += t.amount;
      }

      if (fromUserAccount && toUserAccount) {
        // Internal transfer: no net change to total balance
      } else if (fromUserAccount) {
        totalSpent += t.amount; // External OUT
      } else if (toUserAccount) {
        totalEarned += t.amount; // External IN
      }
    }
  }

  return {
    totalEarned,
    totalSpent,
    totalTransferred,
    totalBalance: totalEarned - totalSpent,
  };
}

/**
 * Calculate category breakdown with NET analysis
 */
export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  if (transactions.length === 0) return [];
  const categoryMap = new Map<string, { spent: number; received: number; count: number }>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const existing = categoryMap.get(t.category) || { spent: 0, received: 0, count: 0 };
    if (t.type === 'expense') {
      existing.spent += t.amount;
      existing.count += 1;
    } else if (t.type === 'income') {
      existing.received += t.amount;
      existing.count += 1;
    }
    categoryMap.set(t.category, existing);
  }

  const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    spent: data.spent,
    received: data.received,
    net: data.spent - data.received,
    percentage: 0,
    count: data.count,
  }));

  const totalNetSpending = breakdown
    .filter((item) => item.net > 0)
    .reduce((sum, item) => sum + item.net, 0);

  for (const item of breakdown) {
    item.percentage =
      item.net > 0 && totalNetSpending > 0 ? (item.net / totalNetSpending) * 100 : 0;
  }

  return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

/**
 * Category spending for reports (pure aggregation)
 */
export function aggregateGroupCategorySpendingForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ category: string; amount: number; count: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type !== 'expense') continue;

    const cat = t.category;
    const prev = map.get(cat) || { amount: 0, count: 0 };
    prev.amount += t.amount;
    prev.count += 1;
    map.set(cat, prev);
  }

  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    amount: v.amount,
    count: v.count,
  }));
}

/**
 * Monthly income/expense buckets for reports
 */
export function aggregateMonthlyIncomeExpenseForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ month: string; income: number; expense: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { month: string; income: number; expense: number }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type === 'transfer') continue;

    const monthKey = d.toFormat('yyyy-MM');
    if (!map.has(monthKey)) {
      map.set(monthKey, { month: monthKey, income: 0, expense: 0 });
    }
    const row = map.get(monthKey)!;
    if (t.type === 'income') row.income += t.amount;
    if (t.type === 'expense') row.expense += t.amount;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(`${a.month}-01`).getTime() - new Date(`${b.month}-01`).getTime()
  );
}

/**
 * Calculate historical balance for a specific account
 * Reverses transactions from current balance back to target date
 */
export function calculateHistoricalBalance(
  allTransactions: Transaction[],
  accountIds: string | Set<string>,
  currentBalance: number,
  targetDate: DateInput
): number {
  // We want the balance at the BEGINNING of the target date
  // So we must reverse all transactions that happened ON or AFTER the target date
  const targetDt = toDateTime(targetDate)?.startOf('day');
  if (!targetDt) return currentBalance;

  // Normalize accountIds to Set
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  // Filter transactions that happened ON or AFTER the target date
  const futureTransactions = allTransactions.filter((t) => {
    const tDate = toDateTime(t.date);
    return tDate && tDate >= targetDt;
  });

  let historicalBalance = currentBalance;

  for (const t of futureTransactions) {
    const isSource = accountSet.has(t.account_id);
    const isDest = t.to_account_id && accountSet.has(t.to_account_id);

    if (!isSource && !isDest) continue;

    // REVERSE the effect of the transaction
    if (t.type === 'expense' && isSource) {
      historicalBalance += t.amount; // Add back spent money
    } else if (t.type === 'income' && isSource) {
      historicalBalance -= t.amount; // Remove received money
    } else if (t.type === 'transfer') {
      if (isSource && isDest) {
        // Internal transfer within the monitored accounts: NO NET CHANGE
      } else if (isSource) {
        // Money left the set of accounts -> Add it back
        historicalBalance += t.amount;
      } else if (isDest) {
        // Money entered the set of accounts -> Remove it
        historicalBalance -= t.amount;
      }
    }
  }

  return historicalBalance;
}

/**
 * Calculate total spent (expenses + outgoing transfers) for an account in a period
 */
export function calculatePeriodTotalSpent(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    const isSource = accountSet.has(t.account_id);
    if (!isSource) return sum;

    if (t.type === 'expense') {
      return sum + t.amount;
    }

    if (t.type === 'transfer') {
      // Only count as spent if sending to an account OUTSIDE the set
      const isDestInternal = t.to_account_id && accountSet.has(t.to_account_id);
      if (!isDestInternal) {
        return sum + t.amount;
      }
    }

    return sum;
  }, 0);
}

/**
 * Calculate total income (income + incoming transfers) for an account in a period
 */
export function calculatePeriodTotalIncome(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    // Direct income to account
    if (t.type === 'income' && accountSet.has(t.account_id)) {
      return sum + t.amount;
    }

    // Transfer IN to account (from outside)
    if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
      const isSourceInternal = accountSet.has(t.account_id);
      if (!isSourceInternal) {
        return sum + t.amount;
      }
    }

    return sum;
  }, 0);
}

/**
 * Calculate total transfers (absolute sum of IN and OUT) for a specific account
 */
export function calculatePeriodTotalTransfers(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    if (t.type !== 'transfer') return sum;

    const isSource = accountSet.has(t.account_id);
    const isDest = t.to_account_id && accountSet.has(t.to_account_id);

    if (isSource || isDest) {
      return sum + t.amount;
    }
    return sum;
  }, 0);
}

/**
 * Calculate annual category spending
 */
export function calculateAnnualCategorySpending(
  allTransactions: Transaction[],
  year: number | 'all' = new Date().getFullYear()
): CategoryBreakdownItem[] {
  // If 'all', use all transactions without filtering
  if (year === 'all') {
    return calculateCategoryBreakdown(allTransactions);
  }

  // Otherwise filter by specific year
  const annualTransactions = allTransactions.filter((t) => {
    const dt = toDateTime(t.date);
    return dt?.year === year;
  });

  return calculateCategoryBreakdown(annualTransactions);
}

// ============================================================================
// UI Related Transaction Filtering (Shared)
// ============================================================================

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface TransactionFiltersState {
  searchQuery: string;
  type: TransactionTypeFilter;
  dateRange: DateRangeFilter;
  categoryKey: string;
  accountId?: string;
  // For budget mode
  budgetId?: string;
  categoryKeys?: string[];
  // For custom date range
  startDate?: string | null;
  endDate?: string | null;
}

const matchesSearch = (
  t: { description: string; category: string },
  query: string,
  categoryByKey: Map<string, Category> | null
): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();

  // Search in description
  if (t.description.toLowerCase().includes(q)) return true;

  // Search in category label
  if (categoryByKey && t.category) {
    const category = categoryByKey.get(t.category);
    if (category?.label.toLowerCase().includes(q)) return true;
  }

  return false;
};

const matchesCategory = (t: { category: string }, filters: TransactionFiltersState): boolean => {
  // 1. Specific category selected
  if (filters.categoryKey !== 'all') {
    return t.category === filters.categoryKey;
  }

  // 2. Budget mode (multiple permitted categories)
  if (filters.categoryKeys && filters.categoryKeys.length > 0) {
    return filters.categoryKeys.includes(t.category);
  }

  return true;
};

const matchesDate = (t: { date: string | Date }, filters: TransactionFiltersState): boolean => {
  if (filters.dateRange === 'all') return true;

  const transactionDate = toDateTime(t.date);
  if (!transactionDate) return false;

  switch (filters.dateRange) {
    case 'today':
      return isToday(transactionDate);
    case 'week':
      return isWithinWeek(transactionDate);
    case 'month':
      return isWithinMonth(transactionDate);
    case 'year':
      return isWithinYear(transactionDate);
    case 'custom': {
      if (filters.startDate) {
        const startDate = toDateTime(filters.startDate);
        if (startDate && transactionDate < startDate.startOf('day')) return false;
      }
      if (filters.endDate) {
        const endDate = toDateTime(filters.endDate);
        if (endDate && transactionDate > endDate.endOf('day')) return false;
      }
      return true;
    }
    default:
      return true;
  }
};

/**
 * Shared filter function for transactions components
 */
export function filterTransactions<
  T extends {
    description: string;
    type: string;
    category: string;
    date: string | Date;
    accountId?: string;
    account_id?: string;
  },
>(transactions: T[], filters: TransactionFiltersState, categories?: Category[]): T[] {
  // Create category lookup by key for search functionality
  const categoryByKey = categories ? new Map(categories.map((c) => [c.key, c])) : null;

  return transactions.filter((t) => {
    // 1. Search Filter
    if (!matchesSearch(t, filters.searchQuery, categoryByKey)) return false;

    // 2. Type Filter
    if (filters.type !== 'all' && t.type !== filters.type) return false;

    // 3. Category Filter
    if (!matchesCategory(t, filters)) return false;

    // 4. Date Filter
    if (!matchesDate(t, filters)) return false;

    // 5. Account Filter — support both camelCase (accountId) and snake_case (account_id)
    if (filters.accountId !== 'all') {
      const txAccountId = t.accountId ?? t.account_id;
      if (txAccountId !== filters.accountId) return false;
    }

    return true;
  });
}
