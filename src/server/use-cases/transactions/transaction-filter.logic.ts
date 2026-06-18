import type { Category } from '@/lib/types';
import { isTransactionDateInFilterRange } from '@/lib/utils/transaction-date-range';

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface TransactionFiltersState {
  searchQuery: string;
  type: TransactionTypeFilter;
  dateRange: DateRangeFilter;
  categoryKey: string;
  accountId?: string;
  budgetId?: string;
  categoryKeys?: string[];
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

  if (t.description.toLowerCase().includes(q)) return true;

  if (categoryByKey && t.category) {
    const category = categoryByKey.get(t.category);
    if (category?.label.toLowerCase().includes(q)) return true;
  }

  return false;
};

const matchesCategory = (t: { category: string }, filters: TransactionFiltersState): boolean => {
  if (filters.categoryKey !== 'all') {
    return t.category === filters.categoryKey;
  }

  if (filters.categoryKeys && filters.categoryKeys.length > 0) {
    return filters.categoryKeys.includes(t.category);
  }

  return true;
};

const matchesDate = (t: { date: string | Date }, filters: TransactionFiltersState): boolean =>
  isTransactionDateInFilterRange(t.date, filters.dateRange, {
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
  });

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
  const categoryByKey = categories ? new Map(categories.map((c) => [c.key, c])) : null;

  return transactions.filter((t) => {
    if (!matchesSearch(t, filters.searchQuery, categoryByKey)) return false;
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (!matchesCategory(t, filters)) return false;
    if (!matchesDate(t, filters)) return false;

    if (filters.accountId !== 'all') {
      const txAccountId = t.accountId ?? t.account_id;
      if (txAccountId !== filters.accountId) return false;
    }

    return true;
  });
}
