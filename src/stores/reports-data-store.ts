/**
 * Reports Data Store
 *
 * Centralized state management for reports page data (budget periods).
 * Separate from page-data-store to maintain clear separation of concerns.
 * Enables optimistic updates for better UX.
 *
 * @module stores/reports-data-store
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { BudgetPeriod } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

interface ReportsDataState {
  // All budget periods per user (Map of userId -> periods array)
  allBudgetPeriods: Map<string, BudgetPeriod[]>;

  // Actions
  setAllBudgetPeriods: (userId: string, periods: BudgetPeriod[]) => void;
  addBudgetPeriod: (userId: string, period: BudgetPeriod) => void;
  removeBudgetPeriod: (userId: string, periodId: string) => void;
  updateBudgetPeriodInList: (
    userId: string,
    periodId: string,
    updates: Partial<BudgetPeriod>
  ) => void;

  // Reset
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  allBudgetPeriods: new Map<string, BudgetPeriod[]>(),
};

// ============================================================================
// Store
// ============================================================================

export const useReportsDataStore = create<ReportsDataState>()(
  devtools(
    (set) => ({
      ...initialState,

      // Set all budget periods for a user
      setAllBudgetPeriods: (userId, periods) => {
        set(
          (state) => {
            const newMap = new Map(state.allBudgetPeriods);
            newMap.set(userId, periods);
            return { allBudgetPeriods: newMap };
          },
          false,
          'reports/setAllBudgetPeriods'
        );
      },

      // Add a single budget period (optimistic update)
      addBudgetPeriod: (userId, period) => {
        set(
          (state) => {
            const newMap = new Map(state.allBudgetPeriods);
            const current = newMap.get(userId) || [];
            // Add new period at the beginning (most recent first)
            newMap.set(userId, [period, ...current]);
            return { allBudgetPeriods: newMap };
          },
          false,
          'reports/addBudgetPeriod'
        );
      },

      // Remove a budget period (optimistic update for delete)
      removeBudgetPeriod: (userId, periodId) => {
        set(
          (state) => {
            const newMap = new Map(state.allBudgetPeriods);
            const current = newMap.get(userId) || [];
            newMap.set(
              userId,
              current.filter((p) => p.id !== periodId)
            );
            return { allBudgetPeriods: newMap };
          },
          false,
          'reports/removeBudgetPeriod'
        );
      },

      // Update a budget period in the list (optimistic update)
      updateBudgetPeriodInList: (userId, periodId, updates) => {
        set(
          (state) => {
            const newMap = new Map(state.allBudgetPeriods);
            const current = newMap.get(userId) || [];
            newMap.set(
              userId,
              current.map((p) => (p.id === periodId ? { ...p, ...updates } : p))
            );
            return { allBudgetPeriods: newMap };
          },
          false,
          'reports/updateBudgetPeriodInList'
        );
      },

      // Reset store
      reset: () => {
        set(initialState, false, 'reports/reset');
      },
    }),
    { name: 'ReportsData' }
  )
);

// ============================================================================
// Optimized Selectors
// ============================================================================

/**
 * Get all budget periods for a specific user
 * Subscribes only to changes for this specific user
 */
export const useAllBudgetPeriods = (userId: string): BudgetPeriod[] =>
  useReportsDataStore((state) => state.allBudgetPeriods.get(userId) || []);

/**
 * Get active budget periods for a user
 * Filters periods that are currently active
 */
export const useActiveBudgetPeriods = (userId: string): BudgetPeriod[] =>
  useReportsDataStore((state) => {
    const periods = state.allBudgetPeriods.get(userId) || [];
    return periods.filter((p) => p.is_active && !p.end_date);
  });

/**
 * Get historical (closed) budget periods for a user
 * Filters periods that have been closed
 */
export const useHistoricalBudgetPeriods = (userId: string): BudgetPeriod[] =>
  useReportsDataStore((state) => {
    const periods = state.allBudgetPeriods.get(userId) || [];
    return periods.filter((p) => !p.is_active || p.end_date);
  });
