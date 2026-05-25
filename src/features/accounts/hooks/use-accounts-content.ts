'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useFilteredAccounts, usePermissions, useUserFilter } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import type { Account, User } from '@/lib/types';

export interface UseAccountsContentProps {
  accountBalances: Record<string, number>;
  currentUser: User;
  accounts: Account[];
}

export function useAccountsContent({
  accountBalances,
  currentUser,
  accounts,
}: UseAccountsContentProps) {
  // User filtering state management (global context)
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const { isMember } = usePermissions({ currentUser, selectedUserId });

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  useEffect(() => {
    if (isMember) {
      setSelectedGroupFilter(currentUser.id);
    }
  }, [isMember, currentUser.id, setSelectedGroupFilter]);

  const { filteredAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId: isMember ? currentUser.id : selectedUserId,
  });

  const filteredBalances = useMemo(() => {
    return filteredAccounts.reduce(
      (acc, account) => {
        const balance = accountBalances[account.id];
        if (balance !== undefined) {
          acc[account.id] = balance;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredAccounts, accountBalances]);

  // Sort accounts by balance (descending - highest first)
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      const balanceA = filteredBalances[a.id] || 0;
      const balanceB = filteredBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [filteredAccounts, filteredBalances]);

  // Calculate account statistics from balances
  const accountStats = useMemo(() => {
    return Object.values(filteredBalances).reduce(
      (stats, balance) => {
        stats.totalBalance += balance;
        if (balance > 0) {
          stats.positiveAccounts += 1;
        } else if (balance < 0) {
          stats.negativeAccounts += 1;
        }
        return stats;
      },
      {
        totalBalance: 0,
        totalAccounts: filteredAccounts.length,
        positiveAccounts: 0,
        negativeAccounts: 0,
      }
    );
  }, [filteredAccounts.length, filteredBalances]);

  const handleEditAccount = (account: Account) => {
    openModal('account', account.id);
  };

  const handleUserFilterChange = useCallback(
    (userId: string) => {
      setSelectedGroupFilter(userId);
    },
    [setSelectedGroupFilter]
  );

  return {
    currentUser,
    isMember,
    selectedUserId: isMember ? currentUser.id : selectedUserId,
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleUserFilterChange,
    openModal,
  };
}
