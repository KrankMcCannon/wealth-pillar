'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { useFilteredAccounts, usePermissions, useUserFilter } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import type { Account, User } from '@/lib/types';
import { computeAccountStats, type AccountStats } from '@/server/use-cases/accounts/account.logic';

export interface UseAccountsContentProps {
  currentUser: User;
  accounts: Account[];
}

export function useAccountsContent({ currentUser, accounts }: UseAccountsContentProps) {
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const { isMember } = usePermissions({
    currentUser,
    selectedUserId,
  });

  const { openModal, modal } = useModalState();

  useEffect(() => {
    if (isMember) {
      setSelectedGroupFilter(currentUser.id);
    }
  }, [isMember, currentUser.id, setSelectedGroupFilter]);

  const effectiveSelectedUserId = isMember ? currentUser.id : selectedUserId;

  const { filteredAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId: effectiveSelectedUserId,
  });

  const filteredBalances = useMemo(() => {
    return filteredAccounts.reduce<Record<string, number>>((result, account) => {
      result[account.id] = Number(account.balance ?? 0);
      return result;
    }, {});
  }, [filteredAccounts]);

  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      const balanceA = filteredBalances[a.id] ?? 0;
      const balanceB = filteredBalances[b.id] ?? 0;

      return balanceB - balanceA;
    });
  }, [filteredAccounts, filteredBalances]);

  const accountStats = useMemo<AccountStats>(
    () => computeAccountStats(filteredAccounts, filteredBalances),
    [filteredAccounts, filteredBalances]
  );

  const handleEditAccount = useCallback(
    (account: Account) => {
      openModal('account', account.id);
    },
    [openModal]
  );

  const handleUserFilterChange = useCallback(
    (userId: string) => {
      setSelectedGroupFilter(userId);
    },
    [setSelectedGroupFilter]
  );

  return {
    currentUser,
    isMember,
    selectedUserId: effectiveSelectedUserId,
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleUserFilterChange,
    openModal,
    isModalOpen: Boolean(modal),
  };
}
