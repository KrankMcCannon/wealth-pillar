/**
 * useTransactionsData Hook
 * Consolidated data fetching for transactions feature
 * Orchestrates all queries with progressive loading support
 *
 * Enables progressive data loading and section-level loading states
 */

'use client';

import {
  createAccountNamesMap,
  createUserNamesMap,
  useAccounts,
  useCategories,
  useTransactions,
  useUserSelection,
} from '@/lib';
import type { Transaction, Category } from '@/lib/types';
import { useMemo } from 'react';

/**
 * Progressive loading states for each data section
 */
export interface TransactionsDataSection<T> {
  data: T;
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Consolidated data loading state for transactions
 */
export interface TransactionsDataState {
  // Essential data
  transactions: TransactionsDataSection<Transaction[]>;
  categories: TransactionsDataSection<Category[]>;
  accounts: TransactionsDataSection<{ id: string; name: string }[]>;
  users: TransactionsDataSection<{ id: string; group_id: string; name?: string }[]>;

  // Computed data
  userNamesMap: Record<string, string>;
  accountNamesMap: Record<string, string>;

  // Overall loading state
  isLoading: boolean;
  isFullyLoaded: boolean;
}

/**
 * Helper function to check if a data section is ready for rendering
 * @param section - The data section to check
 * @returns true if data is ready and not loading
 */
export function isSectionReady(section: TransactionsDataSection<any>): boolean {
  return !section.isLoading && section.data !== undefined;
}

/**
 * Hook for consolidated data loading with progressive updates
 * Returns individual loading states for each data section
 */
export function useTransactionsData(): TransactionsDataState {
  // Core queries - essential for rendering
  const transactionsQuery = useTransactions();
  const categoriesQuery = useCategories();
  const accountsQuery = useAccounts();

  // User selection (includes current user and group users)
  const {
    users,
    isLoading: userSelectionLoading,
  } = useUserSelection();

  // Build user names map for display
  const userNamesMap = useMemo(
    () => createUserNamesMap(users),
    [users]
  );

  // Build account names map for display
  const accountNamesMap = useMemo(
    () => createAccountNamesMap(accountsQuery.data || []),
    [accountsQuery.data]
  );

  // Determine overall loading state
  const isLoading = useMemo(
    () =>
      transactionsQuery.isLoading ||
      categoriesQuery.isLoading ||
      accountsQuery.isLoading ||
      userSelectionLoading,
    [transactionsQuery.isLoading, categoriesQuery.isLoading, accountsQuery.isLoading, userSelectionLoading]
  );

  // Determine if all data is fully loaded
  const isFullyLoaded = useMemo(
    () =>
      isSectionReady(transactionsQuery as any) &&
      isSectionReady(categoriesQuery as any) &&
      isSectionReady(accountsQuery as any) &&
      !userSelectionLoading,
    [transactionsQuery, categoriesQuery, accountsQuery, userSelectionLoading]
  );

  return {
    transactions: {
      data: transactionsQuery.data || [], // Always array, never undefined
      isLoading: transactionsQuery.isLoading,
      error: transactionsQuery.error,
    },
    categories: {
      data: categoriesQuery.data || [], // Always array, never undefined
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error,
    },
    accounts: {
      data: accountsQuery.data || [], // Always array, never undefined
      isLoading: accountsQuery.isLoading,
      error: accountsQuery.error,
    },
    users: {
      data: users || [], // Always array, never undefined
      isLoading: userSelectionLoading,
      error: undefined,
    },
    userNamesMap,
    accountNamesMap,
    isLoading,
    isFullyLoaded,
  };
}
