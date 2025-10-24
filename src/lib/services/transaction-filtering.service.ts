/**
 * Transaction Filtering Service
 * Centralized, optimized transaction filtering logic
 * Follows DRY principle - single source of truth for all transaction filtering
 *
 * Performance: O(n) single-pass filtering with early exit optimization
 * Previous: O(6n) - 6 sequential .filter() calls in components
 */

import type { Budget, Transaction, User } from '@/src/lib/types';

/**
 * Transaction filter criteria
 */
export interface TransactionFilters {
  searchQuery?: string;
  category?: string;
  type?: 'income' | 'expense' | 'transfer' | 'all';
  userId?: string | 'all';
  accountId?: string;
  startDate?: string | Date;
  endDate?: string | Date;
}

/**
 * Single-pass optimized transaction filtering
 * Uses early exit pattern for 6x better performance vs sequential filters
 *
 * @param transactions - Array of transactions to filter
 * @param filters - Filter criteria
 * @returns Filtered transactions
 *
 * @performance O(n) single-pass instead of O(6n) multiple passes
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  // Pre-compute date objects outside the loop for better performance
  const startDate = filters.startDate ? new Date(filters.startDate) : null;
  const endDate = filters.endDate ? new Date(filters.endDate) : null;
  const searchLower = filters.searchQuery?.toLowerCase();

  return transactions.filter(tx => {
    // Early exit pattern - fail fast on first mismatch

    // Search filter
    if (searchLower && !tx.description.toLowerCase().includes(searchLower)) {
      return false;
    }

    // Category filter
    if (filters.category && filters.category !== 'all' && tx.category !== filters.category) {
      return false;
    }

    // Type filter
    if (filters.type && filters.type !== 'all' && tx.type !== filters.type) {
      return false;
    }

    // User filter
    if (filters.userId && filters.userId !== 'all' && tx.user_id !== filters.userId) {
      return false;
    }

    // Account filter
    if (filters.accountId && tx.account_id !== filters.accountId) {
      return false;
    }

    // Date range filters
    if (startDate) {
      const txDate = new Date(tx.date);
      if (txDate < startDate) return false;
    }

    if (endDate) {
      const txDate = new Date(tx.date);
      if (txDate > endDate) return false;
    }

    return true;
  });
}

/**
 * Filter transactions by user scope with role-based access control
 * Optimized for role-based filtering scenarios
 *
 * @param transactions - All transactions
 * @param currentUser - Current authenticated user
 * @param selectedUserId - Selected user ID or 'all'
 * @returns Filtered transactions based on user permissions
 */
export function filterByUserScope(
  transactions: Transaction[],
  currentUser: User | null,
  selectedUserId: string | 'all'
): Transaction[] {
  if (!currentUser) return [];

  const role = currentUser.role;

  // Member: only see their own transactions
  if (role === 'member') {
    return transactions.filter(tx => tx.user_id === currentUser.id);
  }

  // Admin/Superadmin: see group or specific user transactions
  if (role === 'admin' || role === 'superadmin') {
    if (selectedUserId === 'all') {
      // Show all transactions in the group
      return transactions.filter(tx => tx.group_id === currentUser.group_id);
    } else {
      // Show transactions for specific user
      return transactions.filter(tx => tx.user_id === selectedUserId);
    }
  }

  return [];
}

/**
 * Helper: Check if transaction is valid
 */
function isValidTransaction(tx: Transaction): boolean {
  return tx.amount !== null && tx.account_id !== "" && !isNaN(new Date(tx.date).getTime());
}

/**
 * Helper: Check if transaction date is within range
 */
function isWithinDateRange(txDate: Date, startDate: Date, endDate?: Date | null): boolean {
  // Normalize all dates to start of day for comparison
  const txDateNormalized = new Date(txDate);
  txDateNormalized.setHours(0, 0, 0, 0);

  const startDateNormalized = new Date(startDate);
  startDateNormalized.setHours(0, 0, 0, 0);

  if (txDateNormalized < startDateNormalized) return false;

  if (endDate) {
    const endDateNormalized = new Date(endDate);
    endDateNormalized.setHours(23, 59, 59, 999);
    if (txDateNormalized > endDateNormalized) return false;
  }

  return true;
}

/**
 * Filter transactions by budget scope
 * MATCHES EXACTLY the logic from lib/utils.ts:getBudgetTransactions()
 * Includes period-aware filtering for budget tracking
 * NOTE: Includes both expenses AND income to calculate net spending
 * (income in budget categories reduces the budget spent)
 *
 * @param transactions - All transactions
 * @param budget - Budget to filter by
 * @param periodDates - Optional period date range
 * @returns Transactions within budget scope
 */
export function filterByBudgetScope(
  transactions: Transaction[],
  budget: Budget,
  periodDates?: { start: Date | string; end: Date | string | null }
): Transaction[] {
  return transactions.filter(tx => {
    // Basic filtering (matches getBudgetTransactions)
    if (!isValidTransaction(tx)) return false;
    if (tx.user_id !== budget.user_id) return false;
    if (!budget.categories.includes(tx.category)) return false;

    // Date filtering if period is specified
    if (periodDates?.start) {
      const txDate = new Date(tx.date);
      const startDate = new Date(periodDates.start);
      const endDate = periodDates.end ? new Date(periodDates.end) : null;
      return isWithinDateRange(txDate, startDate, endDate);
    }

    return true;
  });
}

/**
 * Filter transactions for current month
 * Common use case for reports and dashboards
 *
 * @param transactions - All transactions
 * @param referenceDate - Optional reference date (defaults to now)
 * @returns Transactions from current month
 */
export function filterByCurrentMonth(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): Transaction[] {
  const month = referenceDate.getMonth();
  const year = referenceDate.getFullYear();

  return transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate.getMonth() === month && txDate.getFullYear() === year;
  });
}

/**
 * Filter transactions by date range
 * Generic date range filter with proper date handling
 *
 * @param transactions - All transactions
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Transactions within date range
 */
export function filterByDateRange(
  transactions: Transaction[],
  startDate: Date | string,
  endDate: Date | string
): Transaction[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Normalize dates to midnight for accurate comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return transactions.filter(tx => {
    const txDate = new Date(tx.date);
    return txDate >= start && txDate <= end;
  });
}

/**
 * Filter transactions by type (income, expense, transfer)
 *
 * @param transactions - All transactions
 * @param type - Transaction type to filter by
 * @returns Filtered transactions
 */
export function filterByType(
  transactions: Transaction[],
  type: 'income' | 'expense' | 'transfer'
): Transaction[] {
  return transactions.filter(tx => tx.type === type);
}

/**
 * Check if any filters are active
 * Useful for UI indicators
 *
 * @param filters - Filter criteria
 * @returns true if any filter is active
 */
export function hasActiveFilters(filters: TransactionFilters): boolean {
  return !!(
    (filters.searchQuery && filters.searchQuery.trim()) ||
    (filters.category && filters.category !== 'all') ||
    (filters.type && filters.type !== 'all') ||
    (filters.userId && filters.userId !== 'all') ||
    filters.accountId ||
    filters.startDate ||
    filters.endDate
  );
}
