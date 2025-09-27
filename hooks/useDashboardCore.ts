'use client';

import { useMemo } from 'react';
import type { User, Account } from '@/lib/types';
import { calculateAccountBalance } from '@/lib/utils';
import { useUsers, useAccounts, useAccountsByUser, useTransactions } from '@/hooks';

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

  // Transactions query - for balance calculations
  const transactionsQuery = useTransactions();

  // Computed core data with optimized memoization
  const coreData = useMemo(() => {
    const users = usersQuery.data || [];
    const allAccounts = accountsQuery.data || [];
    const allTransactions = transactionsQuery.data || [];

    // Apply user-based filtering (extracted to separate function for reusability)
    const getFilteredAccounts = (): Account[] => {
      if (!currentUser) return [];

      const isMember = currentUser.role === 'member';
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

      if (isMember) {
        return allAccounts.filter(account =>
          account.user_ids.includes(currentUser.id)
        );
      }

      if (isAdmin) {
        if (selectedUserId === 'all') {
          return allAccounts.filter(account =>
            account.group_id === currentUser.group_id
          );
        } else {
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

    // Calculate balances efficiently
    const accountBalances = filteredAccounts.reduce((acc, account) => {
      acc[account.id] = calculateAccountBalance(account.id, allTransactions);
      return acc;
    }, {} as Record<string, number>);

    const totalBalance = Object.values(accountBalances).reduce(
      (sum, balance) => sum + balance,
      0
    );

    return {
      users,
      accounts: filteredAccounts,
      transactions: allTransactions,
      accountBalances,
      totalBalance,
      hasData: filteredAccounts.length > 0,
    };
  }, [
    usersQuery.data,
    accountsQuery.data,
    transactionsQuery.data,
    currentUser,
    selectedUserId,
  ]);

  // Progressive loading states
  const loadingState = {
    users: usersQuery.isLoading,
    accounts: accountsQuery.isLoading,
    transactions: transactionsQuery.isLoading,
    isInitialLoading: usersQuery.isLoading || accountsQuery.isLoading,
    isFullyLoaded: !usersQuery.isLoading && !accountsQuery.isLoading && !transactionsQuery.isLoading,
  };

  // Enhanced error handling
  const errorState = {
    users: usersQuery.error,
    accounts: accountsQuery.error,
    transactions: transactionsQuery.error,
    hasErrors: usersQuery.isError || accountsQuery.isError || transactionsQuery.isError,
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
