'use client';

import { useAccounts, useAccountsByUser, useTransactions, useTransactionsForBalances, useUsers } from '@/hooks';
import type { Account, User } from '@/lib/types';
import { calculateAccountBalance } from '@/lib/utils';
import { useMemo } from 'react';

/**
 * Core dashboard data hook - handles essential data with optimized loading
 * Follows Single Responsibility Principle - only handles core financial data
 */
export const useDashboardCore = (selectedUserId: string = 'all', currentUser: User | null) => {
  // Users query - highest priority, shortest stale time
  const usersQuery = useUsers();

  // Accounts: call hooks unconditionally, select the appropriate result
  const isSpecificUserSelected = selectedUserId !== 'all' && selectedUserId !== currentUser?.id;
  const accountsAllQuery = useAccounts();
  const accountsByUserQuery = useAccountsByUser(isSpecificUserSelected ? selectedUserId : '');
  const accountsQuery = isSpecificUserSelected ? accountsByUserQuery : accountsAllQuery;

  // Transactions query - for balance calculations, use the hook that includes shared account transactions
  // Members will get ALL transactions from shared accounts for accurate balance calculations
  const transactionsForBalancesQuery = useTransactionsForBalances();
  // Regular transactions for display (filtered by user for members)
  const transactionsQuery = useTransactions();

  // Computed core data with optimized memoization
  const coreData = useMemo(() => {
    const users = usersQuery.data || [];
    const allAccounts = accountsQuery.data || [];
    // Use transactions that include shared account data for balance calculations
    const allTransactionsForBalances = transactionsForBalancesQuery.data || [];
    // Use regular filtered transactions for other purposes
    const allTransactions = transactionsQuery.data || [];

    // Filter accounts by role and selection
    // Note: Accounts use user_ids (array) for shared accounts, requiring custom logic
    const getFilteredAccounts = (): Account[] => {
      if (!currentUser) return [];

      const role = currentUser.role;

      // Member: only see accounts they're included in
      if (role === 'member') {
        return allAccounts.filter(account =>
          account.user_ids.includes(currentUser.id)
        );
      }

      // Admin/Superadmin: see group or specific user accounts
      if (role === 'admin' || role === 'superadmin') {
        if (selectedUserId === 'all') {
          // Show all accounts in the group
          return allAccounts.filter(account =>
            account.group_id === currentUser.group_id
          );
        } else {
          // Show accounts for specific user (with group permission check)
          const selectedUser = users.find(u => u.id === selectedUserId);
          if (!selectedUser || selectedUser.group_id !== currentUser.group_id) {
            return [];
          }
          return allAccounts.filter(account =>
            account.user_ids.includes(selectedUserId)
          );
        }
      }

      return [];
    };

    const filteredAccounts = getFilteredAccounts();

    // Deduplicate accounts by ID to prevent counting shared accounts multiple times
    const uniqueAccounts = Array.from(
      new Map(filteredAccounts.map(account => [account.id, account])).values()
    );

    // Calculate balances efficiently - use allTransactionsForBalances for accurate shared account balances
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
    selectedUserId,
  ]);

  // Progressive loading states
  const loadingState = {
    users: usersQuery.isLoading,
    accounts: accountsQuery.isLoading,
    transactions: transactionsQuery.isLoading || transactionsForBalancesQuery.isLoading,
    isInitialLoading: usersQuery.isLoading || accountsQuery.isLoading,
    isFullyLoaded: !usersQuery.isLoading && !accountsQuery.isLoading && !transactionsQuery.isLoading && !transactionsForBalancesQuery.isLoading,
  };

  // Enhanced error handling
  const errorState = {
    users: usersQuery.error,
    accounts: accountsQuery.error,
    transactions: transactionsQuery.error || transactionsForBalancesQuery.error,
    hasErrors: usersQuery.isError || accountsQuery.isError || transactionsQuery.isError || transactionsForBalancesQuery.isError,
    criticalError: usersQuery.isError || accountsQuery.isError, // Core data errors
  };

  return {
    ...coreData,
    loading: loadingState,
    errors: errorState,
    refetch: {
      users: usersQuery.refetch,
      accounts: accountsQuery.refetch,
      transactions: transactionsQuery.refetch,
    },
  };
};

export default useDashboardCore;
