/**
 * useDashboardData Hook
 * Consolidated data fetching for dashboard feature
 * Orchestrates all queries with progressive loading support
 *
 * Enables progressive data loading and section-level loading states
 */

'use client';

import {
  Account,
  calculateAccountBalance,
  Transaction,
  useAccounts,
  useAccountsByUser,
  User,
  useTransactions,
  useTransactionsForBalances,
  useUsers,
} from '@/src/lib';
import { useMemo } from 'react';
import useDashboardBudgets from './use-dashboard-budgets';

/**
 * Progressive loading states for each data section
 */
export interface DashboardDataSection<T> {
  data: T;
  isLoading: boolean;
  error?: Error | null;
}

/**
 * Consolidated data loading state for dashboard
 */
export interface DashboardDataState {
  // Essential data
  users: DashboardDataSection<User[]>;
  accounts: DashboardDataSection<Account[]>;
  transactions: DashboardDataSection<Transaction[]>;
  budgets: DashboardDataSection<unknown[]>;
  budgetsByUser: DashboardDataSection<unknown>;

  // Computed data
  accountBalances: Record<string, number>;
  totalBalance: number;
  hasCoreData: boolean;

  // Overall loading state
  isLoading: boolean;
  isFullyLoaded: boolean;

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
export function isSectionReady(section: DashboardDataSection<unknown>): boolean {
  return !section.isLoading && section.data !== undefined;
}

/**
 * Hook for consolidated data loading with progressive updates
 * Returns individual loading states for each data section
 */
export function useDashboardData(
  currentUser: User | null,
  selectedViewUserId: string = 'all'
): DashboardDataState {
  // Core data queries - essential for rendering
  const usersQuery = useUsers();

  // Accounts: call hooks unconditionally, select the appropriate result
  const isSpecificUserSelected = selectedViewUserId !== 'all' && selectedViewUserId !== currentUser?.id;
  const accountsAllQuery = useAccounts();
  const accountsByUserQuery = useAccountsByUser(isSpecificUserSelected ? selectedViewUserId : '');
  const accountsQuery = isSpecificUserSelected ? accountsByUserQuery : accountsAllQuery;

  // Transactions query - for balance calculations, use the hook that includes shared account transactions
  const transactionsForBalancesQuery = useTransactionsForBalances();
  const transactionsQuery = useTransactions();

  // Budget data
  const budgetsData = useDashboardBudgets(
    selectedViewUserId,
    currentUser,
    usersQuery.data || [],
    transactionsQuery.data || [],
    !!(usersQuery.data && accountsQuery.data && transactionsQuery.data)
  );

  // Computed core data with optimized memoization
  const coreData = useMemo(() => {
    const users = usersQuery.data || [];
    const allAccounts = accountsQuery.data || [];
    const allTransactionsForBalances = transactionsForBalancesQuery.data || [];
    const allTransactions = transactionsQuery.data || [];

    // Filter accounts by role and selection
    const getFilteredAccounts = (): Account[] => {
      if (!currentUser) return [];

      const role = currentUser.role;

      if (role === 'member') {
        return allAccounts.filter(account =>
          account.user_ids.includes(currentUser.id)
        );
      }

      if (role === 'admin' || role === 'superadmin') {
        if (selectedViewUserId === 'all') {
          return allAccounts.filter(account =>
            account.group_id === currentUser.group_id
          );
        } else {
          const selectedUser = users.find(u => u.id === selectedViewUserId);
          if (!selectedUser || selectedUser.group_id !== currentUser.group_id) {
            return [];
          }
          return allAccounts.filter(account =>
            account.user_ids.includes(selectedViewUserId)
          );
        }
      }

      return [];
    };

    const filteredAccounts = getFilteredAccounts();

    // Deduplicate accounts by ID
    const uniqueAccounts = Array.from(
      new Map(filteredAccounts.map(account => [account.id, account])).values()
    );

    // Calculate balances
    const accountBalances = uniqueAccounts.reduce((acc, account) => {
      acc[account.id] = calculateAccountBalance(account.id, allTransactionsForBalances);
      return acc;
    }, {} as Record<string, number>);

    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0
    );

    return {
      users,
      accounts: uniqueAccounts,
      transactions: allTransactions,
      accountBalances,
      totalBalance,
      hasData: uniqueAccounts.length > 0,
    };
  }, [
    usersQuery.data,
    accountsQuery.data,
    transactionsQuery.data,
    transactionsForBalancesQuery.data,
    currentUser,
    selectedViewUserId,
  ]);

  // Determine overall loading state
  const isLoading = useMemo(
    () =>
      usersQuery.isLoading ||
      accountsQuery.isLoading ||
      transactionsQuery.isLoading ||
      budgetsData.isLoading,
    [usersQuery.isLoading, accountsQuery.isLoading, transactionsQuery.isLoading, budgetsData.isLoading]
  );

  // Determine if all data is fully loaded
  const isFullyLoaded = useMemo(
    () =>
      isSectionReady(usersQuery as unknown as DashboardDataSection<User[]>) &&
      isSectionReady(accountsQuery as unknown as DashboardDataSection<Account[]>) &&
      isSectionReady(transactionsQuery as unknown as DashboardDataSection<Record<string, unknown>[]>) &&
      !budgetsData.isLoading,
    [usersQuery, accountsQuery, transactionsQuery, budgetsData.isLoading]
  );

  return {
    users: {
      data: coreData.users || [], // Always array, never undefined
      isLoading: usersQuery.isLoading,
      error: usersQuery.error,
    },
    accounts: {
      data: coreData.accounts || [], // Always array, never undefined
      isLoading: accountsQuery.isLoading,
      error: accountsQuery.error,
    },
    transactions: {
      data: coreData.transactions || [], // Always array, never undefined
      isLoading: transactionsQuery.isLoading,
      error: transactionsQuery.error,
    },
    budgets: {
      data: (budgetsData.budgets as unknown[]) || [], // Always array, never undefined
      isLoading: budgetsData.isLoading,
      error: undefined,
    },
    budgetsByUser: {
      data: budgetsData.budgetsByUser || {}, // Always object, never undefined
      isLoading: budgetsData.isLoading,
      error: undefined,
    },
    accountBalances: coreData.accountBalances,
    totalBalance: coreData.totalBalance,
    hasCoreData: coreData.hasData,
    isLoading,
    isFullyLoaded,
    errors: {
      criticalError: !!usersQuery.error || !!accountsQuery.error,
      users: usersQuery.error || null,
      accounts: accountsQuery.error || null,
      transactions: transactionsQuery.error || null,
    },
  };
}
