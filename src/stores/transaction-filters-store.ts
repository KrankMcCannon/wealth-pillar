/**
 * Transaction Filters Store
 *
 * Centralized state management for transaction filters with localStorage persistence.
 * Filters persist across page refreshes and navigation.
 *
 * @module stores/transaction-filters-store
 */

import { create } from 'zustand';
import { persist, createJSONStorage, devtools } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface TransactionFiltersState {
  searchQuery: string;
  type: TransactionTypeFilter;
  dateRange: DateRangeFilter;
  categoryKey: string; // "all" or single category ID
  categoryKeys?: string[]; // Multiple category IDs (for budget filtering)
  budgetId?: string; // Budget ID when coming from budgets page
  startDate?: string; // Custom date range start (ISO string)
  endDate?: string; // Custom date range end (ISO string)
}

interface TransactionFiltersStore extends TransactionFiltersState {
  // Actions
  setFilters: (filters: Partial<TransactionFiltersState>) => void;
  resetFilters: () => void;
  clearBudgetFilter: () => void;
  setSearchQuery: (query: string) => void;
  setType: (type: TransactionTypeFilter) => void;
  setDateRange: (range: DateRangeFilter) => void;
  setCategoryKey: (key: string) => void;
  setCustomDateRange: (startDate: string, endDate: string) => void;
}

// ============================================================================
// Initial State
// ============================================================================

export const defaultFiltersState: TransactionFiltersState = {
  searchQuery: '',
  type: 'all',
  dateRange: 'all',
  categoryKey: 'all',
};

// ============================================================================
// Store
// ============================================================================

export const useTransactionFiltersStore = create<TransactionFiltersStore>()(
  devtools(
    persist(
      (set) => ({
        ...defaultFiltersState,

        // Set multiple filters at once
        setFilters: (filters) => {
          set(
            (state) => ({ ...state, ...filters }),
            false,
            'transaction-filters/setFilters'
          );
        },

        // Reset all filters to default
        resetFilters: () => {
          set(defaultFiltersState, false, 'transaction-filters/resetFilters');
        },

        // Clear budget-specific filters
        clearBudgetFilter: () => {
          set(
            (state) => ({
              ...state,
              budgetId: undefined,
              categoryKeys: undefined,
            }),
            false,
            'transaction-filters/clearBudgetFilter'
          );
        },

        // Individual filter setters
        setSearchQuery: (query) => {
          set({ searchQuery: query }, false, 'transaction-filters/setSearchQuery');
        },

        setType: (type) => {
          set({ type }, false, 'transaction-filters/setType');
        },

        setDateRange: (range) => {
          set(
            () =>
              range === 'custom'
                ? { dateRange: range }
                : { dateRange: range, startDate: undefined, endDate: undefined },
            false,
            'transaction-filters/setDateRange'
          );
        },

        setCategoryKey: (key) => {
          set({ categoryKey: key }, false, 'transaction-filters/setCategoryKey');
        },

        setCustomDateRange: (startDate, endDate) => {
          set(
            {
              dateRange: 'custom',
              startDate: startDate || undefined,
              endDate: endDate || undefined,
            },
            false,
            'transaction-filters/setCustomDateRange'
          );
        },
      }),
      {
        name: 'wealth-pillar-transaction-filters',
        storage: createJSONStorage(() => localStorage),
        // Persist only filter state, not budget-specific context
        partialize: (state) => ({
          searchQuery: state.searchQuery,
          type: state.type,
          dateRange: state.dateRange,
          categoryKey: state.categoryKey,
          startDate: state.startDate,
          endDate: state.endDate,
          // Don't persist budget-specific filters (they come from URL)
        }),
      }
    ),
    { name: 'TransactionFilters' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get all filter values
 * Use this when you need all filters
 */
export const useTransactionFilters = () =>
  useTransactionFiltersStore((state) => ({
    searchQuery: state.searchQuery,
    type: state.type,
    dateRange: state.dateRange,
    categoryKey: state.categoryKey,
    categoryKeys: state.categoryKeys,
    budgetId: state.budgetId,
    startDate: state.startDate,
    endDate: state.endDate,
  }));

/**
 * Get filter actions
 * Use this to update filters
 */
export const useTransactionFiltersActions = () =>
  useTransactionFiltersStore((state) => ({
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
    clearBudgetFilter: state.clearBudgetFilter,
    setSearchQuery: state.setSearchQuery,
    setType: state.setType,
    setDateRange: state.setDateRange,
    setCategoryKey: state.setCategoryKey,
    setCustomDateRange: state.setCustomDateRange,
  }));

/**
 * Check if any filters are active
 */
export const useHasActiveFilters = () =>
  useTransactionFiltersStore((state) => {
    const { searchQuery, type, dateRange, categoryKey, categoryKeys, budgetId } = state;
    return !!(
      searchQuery ||
      type !== 'all' ||
      dateRange !== 'all' ||
      categoryKey !== 'all' ||
      (categoryKeys && categoryKeys.length > 0) ||
      budgetId
    );
  });
