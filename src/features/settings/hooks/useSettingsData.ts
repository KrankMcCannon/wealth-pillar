/**
 * useSettingsData Hook
 * Consolidated data fetching for settings feature
 * Orchestrates all queries with progressive loading support
 *
 * Enables progressive data loading and section-level loading states
 */

'use client';

import {
  Account,
  useAccounts,
  useTransactions,
  useUserSelection,
  User,
  Transaction,
} from '@/src/lib';
import { useMemo } from 'react';

/**
 * Progressive loading states for each data section
 */
export interface SettingsDataSection<T> {
  data: T;
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Consolidated data loading state for settings
 */
export interface SettingsDataState {
  // Essential data
  users: SettingsDataSection<User[]>;
  accounts: SettingsDataSection<Account[]>;
  transactions: SettingsDataSection<Transaction[]>;

  // Current user context
  currentUser: User | null;
  userStats: {
    totalUsers: number;
    viewableUsers: number;
  } | null;

  // Overall loading state
  isLoading: boolean;

  // Error states
  errors: {
    criticalError: boolean;
    users: Error | null;
    accounts: Error | null;
    transactions: Error | null;
  };
}

/**
 * Helper function to check if a data section is ready for rendering
 */
export function isSectionReady(section: SettingsDataSection<unknown>): boolean {
  return !section.isLoading && section.data !== undefined;
}

/**
 * Hook for consolidated data loading with progressive updates
 * Returns individual loading states for each data section
 */
export function useSettingsData(): SettingsDataState {
  // Core data queries - essential for rendering
  const {
    currentUser,
    users: rawUsers,
    isLoading: usersLoading,
    userStats,
  } = useUserSelection();

  const accountsQuery = useAccounts();
  const transactionsQuery = useTransactions();

  // Sort users by role: superadmin -> admin -> member
  const sortedUsers = useMemo(() => {
    const roleOrder = { superadmin: 0, admin: 1, member: 2 };
    return [...rawUsers].sort((a, b) => {
      const aOrder = roleOrder[a.role] ?? 3;
      const bOrder = roleOrder[b.role] ?? 3;
      return aOrder - bOrder;
    });
  }, [rawUsers]);

  // Determine overall loading state
  const isLoading = useMemo(
    () => usersLoading || accountsQuery.isLoading || transactionsQuery.isLoading,
    [usersLoading, accountsQuery.isLoading, transactionsQuery.isLoading]
  );

  return {
    users: {
      data: sortedUsers || [], // Always array, never undefined
      isLoading: usersLoading,
      error: null,
    },
    accounts: {
      data: accountsQuery.data || [], // Always array, never undefined
      isLoading: accountsQuery.isLoading,
      error: accountsQuery.error,
    },
    transactions: {
      data: transactionsQuery.data || [], // Always array, never undefined
      isLoading: transactionsQuery.isLoading,
      error: transactionsQuery.error,
    },
    currentUser,
    userStats: userStats || null,
    isLoading,
    errors: {
      criticalError: !!usersLoading || !!accountsQuery.error,
      users: null,
      accounts: accountsQuery.error || null,
      transactions: transactionsQuery.error || null,
    },
  };
}
