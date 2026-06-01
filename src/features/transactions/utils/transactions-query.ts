import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';
import { filterTransactions } from '@/server/use-cases/transactions/transaction.logic';
import type { Transaction } from '@/lib/types';
import type {
  AppliedTransactionsQuery,
  TransactionsListQuery,
} from '@/server/use-cases/pages/transactions-page.use-case';
import { defaultFiltersState } from '../components/filters/filter-helpers';

export function appliedQueryToFiltersState(
  applied: AppliedTransactionsQuery,
  searchQuery: string
): TransactionFiltersState {
  const resolvedType = applied.type === 'transfer' ? 'all' : applied.type;
  const keysFromCsv = applied.categories
    ? applied.categories
        .split(',')
        .map((key) => key.trim())
        .filter(Boolean)
    : [];

  return {
    ...defaultFiltersState,
    searchQuery,
    type: resolvedType,
    dateRange: applied.dateRange,
    categoryKey: keysFromCsv.length > 0 ? 'all' : (applied.category ?? 'all'),
    accountId: applied.account ?? 'all',
    ...(keysFromCsv.length > 0 ? { categoryKeys: keysFromCsv } : {}),
    ...(applied.startDate ? { startDate: applied.startDate } : {}),
    ...(applied.endDate ? { endDate: applied.endDate } : {}),
  };
}

export function matchesAppliedQuery(
  transaction: Transaction,
  applied: AppliedTransactionsQuery,
  searchQuery: string
): boolean {
  if (applied.user && transaction.user_id !== applied.user) return false;

  const filters = appliedQueryToFiltersState(applied, searchQuery);
  return filterTransactions([transaction], filters).length > 0;
}

export function appliedQueryToListQuery(
  applied: AppliedTransactionsQuery,
  searchQuery: string
): TransactionsListQuery {
  const params: TransactionsListQuery = {
    type: applied.type,
    dateRange: applied.dateRange,
  };
  if (applied.user) params.user = applied.user;
  const q = searchQuery.trim();
  if (q) params.q = q;
  if (applied.startDate) params.startDate = applied.startDate;
  if (applied.endDate) params.endDate = applied.endDate;
  if (applied.account) params.account = applied.account;
  if (applied.category) params.category = applied.category;
  if (applied.categories) params.categories = applied.categories;
  return params;
}

export function buildTransactionsQueryString(filters: TransactionFiltersState, userId?: string) {
  const params = new URLSearchParams();
  if (userId) params.set('user', userId);
  if (filters.searchQuery.trim()) params.set('q', filters.searchQuery.trim());
  if (filters.type !== 'all') params.set('type', filters.type);
  if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.accountId && filters.accountId !== 'all') params.set('account', filters.accountId);
  if (filters.categoryKeys && filters.categoryKeys.length > 0) {
    params.set('categories', filters.categoryKeys.join(','));
  } else if (filters.categoryKey && filters.categoryKey !== 'all') {
    params.set('category', filters.categoryKey);
  }
  return params.toString();
}
