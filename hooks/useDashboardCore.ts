'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { userService, accountService, transactionService } from '@/lib/api-client';
import type { User, Account, Transaction } from '@/lib/types';
import { calculateAccountBalance } from '@/lib/utils';

/**
 * Core dashboard data hook - handles essential data with optimized loading
 * Follows Single Responsibility Principle - only handles core financial data
 */
export const useDashboardCore = (selectedUserId: string = 'all', currentUser: User | null) => {
  // Users query - highest priority, shortest stale time
  const usersQuery = useQuery({
    queryKey: queryKeys.users(),
    queryFn: userService.getAll,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Accounts query - critical for balance display
  const accountsQuery = useQuery({
    queryKey: selectedUserId !== 'all' && selectedUserId !== currentUser?.id
      ? queryKeys.accountsByUser(selectedUserId)
      : queryKeys.accounts(),
    queryFn: selectedUserId !== 'all' && selectedUserId !== currentUser?.id
      ? () => accountService.getByUserId(selectedUserId)
      : accountService.getAll,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!currentUser, // Only fetch when user is authenticated
  });

  // Transactions query - for balance calculations
  const transactionsQuery = useQuery({
    queryKey: queryKeys.transactions(),
    queryFn: transactionService.getAll,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!currentUser,
  });

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