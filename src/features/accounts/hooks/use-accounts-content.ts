'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useFilteredAccounts, usePermissions, useUserFilter } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import type { Account, User } from '@/lib/types';
import type { AccountStats } from '@/server/use-cases/accounts/account.logic';

export interface UseAccountsContentProps {
  accountBalances: Record<string, number>;
  currentUser: User;
  accounts: Account[];
  statsAll: AccountStats;
  statsByUserId: Record<string, AccountStats>;
}

export function useAccountsContent({
  accountBalances,
  currentUser,
  accounts,
  statsAll,
  statsByUserId,
}: UseAccountsContentProps) {
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const { isMember } = usePermissions({ currentUser, selectedUserId });

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

  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      const balanceA = filteredBalances[a.id] || 0;
      const balanceB = filteredBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [filteredAccounts, filteredBalances]);

  const accountStats = useMemo((): AccountStats => {
    if (isMember) {
      return statsByUserId[currentUser.id] ?? statsAll;
    }
    if (selectedUserId && selectedUserId !== 'all') {
      return statsByUserId[selectedUserId] ?? statsAll;
    }
    return statsAll;
  }, [isMember, currentUser.id, selectedUserId, statsAll, statsByUserId]);

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
