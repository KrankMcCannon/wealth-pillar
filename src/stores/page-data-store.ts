/**
 * Page Data Store
 *
 * Centralized state management for page-specific data (transactions, budgets, recurring series).
 * Enables optimistic updates and eliminates the need for router.refresh().
 *
 * @module stores/page-data-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Transaction, Budget, RecurringTransactionSeries, BudgetPeriod } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface PageDataState {
  // Transactions
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;

  // Budgets
  budgets: Budget[];
  setBudgets: (budgets: Budget[]) => void;
  addBudget: (budget: Budget) => void;
  updateBudget: (id: string, updates: Partial<Budget>) => void;
  removeBudget: (id: string) => void;

  // Budget Periods (Record of userId -> active period)
  budgetPeriods: Record<string, BudgetPeriod | null>;
  setBudgetPeriods: (periods: Record<string, BudgetPeriod | null>) => void;
  updateBudgetPeriod: (userId: string, period: BudgetPeriod | null) => void;

  // Recurring Series
  recurringSeries: RecurringTransactionSeries[];
  setRecurringSeries: (series: RecurringTransactionSeries[]) => void;
  addRecurringSeries: (series: RecurringTransactionSeries) => void;
  updateRecurringSeries: (id: string, updates: Partial<RecurringTransactionSeries>) => void;
  removeRecurringSeries: (id: string) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  transactions: [],
  budgets: [],
  budgetPeriods: {},
  recurringSeries: [],
};

// ============================================================================
// Store
// ============================================================================

export const usePageDataStore = create<PageDataState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Transactions
      setTransactions: (transactions) => {
        set({ transactions }, false, 'page-data/setTransactions');
      },

      addTransaction: (transaction) => {
        set((state) => ({
          transactions: [...state.transactions, transaction],
        }), false, 'page-data/addTransaction');
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id ? { ...transaction, ...updates } : transaction
          ),
        }), false, 'page-data/updateTransaction');
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }), false, 'page-data/removeTransaction');
      },

      // Budgets
      setBudgets: (budgets) => {
        set({ budgets }, false, 'page-data/setBudgets');
      },

      addBudget: (budget) => {
        set((state) => ({
          budgets: [...state.budgets, budget],
        }), false, 'page-data/addBudget');
      },

      updateBudget: (id, updates) => {
        set((state) => ({
          budgets: state.budgets.map((budget) =>
            budget.id === id ? { ...budget, ...updates } : budget
          ),
        }), false, 'page-data/updateBudget');
      },

      removeBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }), false, 'page-data/removeBudget');
      },

      // Budget Periods
      setBudgetPeriods: (periods) => {
        set({ budgetPeriods: periods }, false, 'page-data/setBudgetPeriods');
      },

      updateBudgetPeriod: (userId, period) => {
        set((state) => ({
          budgetPeriods: { ...state.budgetPeriods, [userId]: period },
        }), false, 'page-data/updateBudgetPeriod');
      },

      // Recurring Series
      setRecurringSeries: (series) => {
        set({ recurringSeries: series }, false, 'page-data/setRecurringSeries');
      },

      addRecurringSeries: (series) => {
        set((state) => ({
          recurringSeries: [...state.recurringSeries, series],
        }), false, 'page-data/addRecurringSeries');
      },

      updateRecurringSeries: (id, updates) => {
        set((state) => ({
          recurringSeries: state.recurringSeries.map((series) =>
            series.id === id ? { ...series, ...updates } : series
          ),
        }), false, 'page-data/updateRecurringSeries');
      },

      removeRecurringSeries: (id) => {
        set((state) => ({
          recurringSeries: state.recurringSeries.filter((series) => series.id !== id),
        }), false, 'page-data/removeRecurringSeries');
      },

      // Reset
      reset: () => {
        set(initialState, false, 'page-data/reset');
      },
    }),
    { name: 'PageData' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get transactions
 * Subscribes only to transactions changes
 */
export const useTransactions = () =>
  usePageDataStore((state) => state.transactions);

/**
 * Get budgets
 * Subscribes only to budgets changes
 */
export const useBudgets = () =>
  usePageDataStore((state) => state.budgets);

/**
 * Get recurring series
 * Subscribes only to recurringSeries changes
 */
export const useRecurringSeries = () =>
  usePageDataStore((state) => state.recurringSeries);

/**
 * Get budget periods
 * Subscribes only to budgetPeriods changes
 */
export const useBudgetPeriods = () =>
  usePageDataStore((state) => state.budgetPeriods);

/**
 * Get budget period for a specific user
 * Subscribes only to budgetPeriods changes (optimized)
 */
export const useBudgetPeriod = (userId: string) =>
  usePageDataStore((state) => state.budgetPeriods[userId] ?? null);
