/**
 * useBudgetsData Hook
 * Consolidated data fetching for budgets feature
 * Orchestrates all queries with progressive loading support
 *
 * Replaces the distributed query calls from use-budgets-controller.ts
 * Enables progressive data loading and section-level loading states
 */

'use client';

import {
  Budget,
  BudgetPeriod,
  createAccountNamesMap,
  createUserNamesMap,
  Transaction,
  useAccounts,
  useBudgetPeriods,
  useBudgets,
  useCategories,
  useTransactions,
  useUserSelection,
} from '@/lib';
import { useMemo } from 'react';

/**
 * Progressive loading states for each data section
 */
export interface BudgetsDataSection<T> {
  data: T;
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Consolidated data loading state
 */
export interface BudgetsDataState {
  // Essential data
  budgets: BudgetsDataSection<Budget[]>;
  transactions: BudgetsDataSection<Transaction[]>;
  users: BudgetsDataSection<{ id: string; group_id: string; name?: string }[]>;
  periods: BudgetsDataSection<BudgetPeriod[]>;

  // Reference data
  categories: BudgetsDataSection<string[]>;
  accounts: BudgetsDataSection<{ id: string; name: string }[]>;

  // Computed data
  userNamesMap: Record<string, string>;
  accountNamesMap: Record<string, string>;

  // Overall loading state
  isLoading: boolean;
  isFullyLoaded: boolean;

  // Analytics (loaded after core data)
  budgetAnalysis: BudgetsDataSection<any>;
}

/**
 * Hook for consolidated data loading with progressive updates
 * Returns individual loading states for each data section
 */
export function useBudgetsData(): BudgetsDataState {
  // Core queries - essential for rendering
  const budgetsQuery = useBudgets();
  const transactionsQuery = useTransactions();
  const categoriesQuery = useCategories();
  const accountsQuery = useAccounts();
  const periodsQuery = useBudgetPeriods();

  // User selection (includes current user)
  const {
    users,
    isLoading: userSelectionLoading,
  } = useUserSelection();

  // Build user names map for display
  const userNamesMap = useMemo(() => {
    return createUserNamesMap(users || []);
  }, [users]);

  // Build account names map for display
  const accountNamesMap = useMemo(() => {
    return createAccountNamesMap(accountsQuery.data || []);
  }, [accountsQuery.data]);

  // Calculate overall loading state
  // true if ANY critical data is loading
  const isLoading =
    budgetsQuery.isLoading ||
    transactionsQuery.isLoading ||
    userSelectionLoading ||
    periodsQuery.isLoading;

  // true only when ALL data has loaded
  const isFullyLoaded =
    !budgetsQuery.isLoading &&
    !transactionsQuery.isLoading &&
    !userSelectionLoading &&
    !periodsQuery.isLoading &&
    !categoriesQuery.isLoading &&
    !accountsQuery.isLoading;

  // Return structured data with per-section loading states
  return {
    // Essential data with loading states
    budgets: {
      data: budgetsQuery.data || [], // Always array, never undefined
      isLoading: budgetsQuery.isLoading,
      error: budgetsQuery.error,
    },
    transactions: {
      data: transactionsQuery.data || [], // Always array, never undefined
      isLoading: transactionsQuery.isLoading,
      error: transactionsQuery.error,
    },
    users: {
      data: users || [], // Always array, never undefined
      isLoading: userSelectionLoading,
      error: undefined,
    },
    periods: {
      data: periodsQuery.data || [], // Always array, never undefined
      isLoading: periodsQuery.isLoading,
      error: periodsQuery.error,
    },

    // Reference data
    categories: {
      data: (categoriesQuery.data as any) || [], // Always array, never undefined
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error,
    },
    accounts: {
      data: accountsQuery.data || [], // Always array, never undefined
      isLoading: accountsQuery.isLoading,
      error: accountsQuery.error,
    },

    // Computed maps
    userNamesMap,
    accountNamesMap,

    // Overall states
    isLoading,
    isFullyLoaded,

    // Analytics (optional, loaded separately)
    budgetAnalysis: {
      data: null,
      isLoading: false,
      error: undefined,
    },
  };
}

/**
 * Helper to check if a specific section is ready for display
 */
export function isSectionReady(
  section: BudgetsDataSection<any>,
  minDataLength: number = 0
): boolean {
  return (
    !section.isLoading &&
    section.data &&
    (Array.isArray(section.data) ? section.data.length >= minDataLength : true)
  );
}
