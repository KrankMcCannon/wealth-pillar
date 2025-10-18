/**
 * Transactions View Model
 * Transforms raw transaction data into ready-for-UI structured data
 * Follows MVVM pattern - separates data transformation from presentation
 */

import {
  filterTransactions,
  filterByUserScope,
  hasActiveFilters as checkActiveFilters
} from '@/lib/services/transaction-filtering.service';
import {
  groupTransactionsByDay,
  createAccountNamesMap,
  type DayGroup
} from '@/lib/services/data-grouping.service';
import type { Transaction, Account, User } from '@/lib/types';

/**
 * Transaction filter state
 */
export interface TransactionFilters {
  searchQuery: string;
  selectedFilter: string;
  selectedCategory: string;
  selectedUserId: string | 'all';
}

/**
 * Transactions View Model
 * Complete data structure ready for UI consumption
 */
export interface TransactionsViewModel {
  // Grouped transaction data
  groupedByDay: DayGroup[];

  // Lookup maps
  accountNamesMap: Record<string, string>;

  // Aggregated metrics
  totalAmount: number;
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;

  // State indicators
  hasActiveFilters: boolean;
  isEmpty: boolean;
  transactionCount: number;

  // Filter info
  appliedFilters: {
    hasSearch: boolean;
    hasCategory: boolean;
    hasType: boolean;
    hasUser: boolean;
  };
}

/**
 * Create Transactions View Model
 * Main factory function that transforms raw data into view model
 *
 * @param allTransactions - All transactions from API
 * @param filters - Active filter state
 * @param accounts - All accounts for name mapping
 * @param currentUser - Current authenticated user
 * @returns Complete view model ready for UI
 */
export function createTransactionsViewModel(
  allTransactions: Transaction[],
  filters: TransactionFilters,
  accounts: Account[],
  currentUser: User | null
): TransactionsViewModel {
  // ========================================
  // Step 1: Apply user scope filter
  // ========================================
  const userScopedTransactions = currentUser
    ? filterByUserScope(allTransactions, currentUser, filters.selectedUserId)
    : [];

  // ========================================
  // Step 2: Apply additional filters
  // ========================================
  const filteredTransactions = filterTransactions(userScopedTransactions, {
    searchQuery: filters.searchQuery || undefined,
    category: filters.selectedCategory !== 'all' ? filters.selectedCategory : undefined,
    type: filters.selectedFilter !== 'all' ? (filters.selectedFilter as 'income' | 'expense' | 'transfer' | 'all') : undefined
  });

  // ========================================
  // Step 3: Group by day with totals
  // ========================================
  const groupedByDay = groupTransactionsByDay(filteredTransactions);

  // ========================================
  // Step 4: Calculate aggregated metrics
  // ========================================
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTransfers = 0;

  for (const tx of filteredTransactions) {
    switch (tx.type) {
      case 'income':
        totalIncome += tx.amount;
        break;
      case 'expense':
        totalExpenses += tx.amount;
        break;
      case 'transfer':
        totalTransfers += tx.amount;
        break;
    }
  }

  const totalAmount = totalIncome - totalExpenses;

  // ========================================
  // Step 5: Create account names lookup map
  // ========================================
  const accountNamesMap = createAccountNamesMap(accounts);

  // ========================================
  // Step 6: Check filter states
  // ========================================
  const hasActiveFilters = checkActiveFilters({
    searchQuery: filters.searchQuery,
    category: filters.selectedCategory !== 'all' ? filters.selectedCategory : undefined,
    type: filters.selectedFilter !== 'all' ? (filters.selectedFilter as 'income' | 'expense' | 'transfer' | 'all') : undefined,
    userId: filters.selectedUserId !== 'all' ? filters.selectedUserId : undefined
  });

  const appliedFilters = {
    hasSearch: !!(filters.searchQuery && filters.searchQuery.trim()),
    hasCategory: filters.selectedCategory !== 'all',
    hasType: filters.selectedFilter !== 'all',
    hasUser: filters.selectedUserId !== 'all'
  };

  // ========================================
  // Return complete view model
  // ========================================
  return {
    groupedByDay,
    accountNamesMap,
    totalAmount: roundToTwoDecimals(totalAmount),
    totalIncome: roundToTwoDecimals(totalIncome),
    totalExpenses: roundToTwoDecimals(totalExpenses),
    totalTransfers: roundToTwoDecimals(totalTransfers),
    hasActiveFilters,
    isEmpty: filteredTransactions.length === 0,
    transactionCount: filteredTransactions.length,
    appliedFilters
  };
}

/**
 * Create empty view model
 * Used for loading states or no data scenarios
 */
export function createEmptyTransactionsViewModel(): TransactionsViewModel {
  return {
    groupedByDay: [],
    accountNamesMap: {},
    totalAmount: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalTransfers: 0,
    hasActiveFilters: false,
    isEmpty: true,
    transactionCount: 0,
    appliedFilters: {
      hasSearch: false,
      hasCategory: false,
      hasType: false,
      hasUser: false
    }
  };
}

/**
 * Helper: Round to 2 decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
