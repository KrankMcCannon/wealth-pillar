'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useFilteredAccounts, usePermissions, useUserFilter } from '@/hooks';
import { toast } from '@/hooks/use-toast';
import { useModalState } from '@/lib/navigation/url-state';
import { recalculateAccountBalanceAction } from '@/features/accounts/actions/account-actions';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import type { Account, User } from '@/lib/types';
import { computeAccountStats, type AccountStats } from '@/server/use-cases/accounts/account.logic';

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
  const locale = useLocale();
  const t = useTranslations('Accounts.Content');
  const router = useRouter();
  const updateAccount = useReferenceDataStore((state) => state.updateAccount);
  const [balanceOverrides, setBalanceOverrides] = useState<Record<string, number>>({});
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);

  const { openModal, modal } = useModalState();

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
        const balance = balanceOverrides[account.id] ?? accountBalances[account.id];
        if (balance !== undefined) {
          acc[account.id] = balance;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }, [filteredAccounts, accountBalances, balanceOverrides]);

  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      const balanceA = filteredBalances[a.id] || 0;
      const balanceB = filteredBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [filteredAccounts, filteredBalances]);

  const accountStats = useMemo((): AccountStats => {
    if (Object.keys(balanceOverrides).length > 0) {
      return computeAccountStats(filteredAccounts, filteredBalances);
    }
    if (isMember) {
      return statsByUserId[currentUser.id] ?? statsAll;
    }
    if (selectedUserId && selectedUserId !== 'all') {
      return statsByUserId[selectedUserId] ?? statsAll;
    }
    return statsAll;
  }, [
    isMember,
    currentUser.id,
    selectedUserId,
    statsAll,
    statsByUserId,
    balanceOverrides,
    filteredAccounts,
    filteredBalances,
  ]);

  const handleEditAccount = (account: Account) => {
    openModal('account', account.id);
  };

  const handleRecalculateAccount = useCallback(
    async (account: Account) => {
      if (recalculatingId) return;
      setRecalculatingId(account.id);
      try {
        const result = await recalculateAccountBalanceAction(account.id, locale);
        if (result.error || !result.data) {
          toast({
            title: t('toast.recalculateErrorTitle'),
            description: result.error ?? t('toast.recalculateErrorDescription'),
            variant: 'destructive',
          });
          return;
        }
        const nextBalance = Number(result.data.balance ?? 0);
        setBalanceOverrides((prev) => ({ ...prev, [account.id]: nextBalance }));
        updateAccount(account.id, { balance: nextBalance });
        router.refresh();
        toast({
          title: t('toast.recalculateSuccessTitle'),
          description: t('toast.recalculateSuccessDescription'),
          variant: 'success',
        });
      } finally {
        setRecalculatingId(null);
      }
    },
    [locale, recalculatingId, router, t, updateAccount]
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
    selectedUserId: isMember ? currentUser.id : selectedUserId,
    accountStats,
    sortedAccounts,
    filteredBalances,
    recalculatingId,
    handleEditAccount,
    handleRecalculateAccount,
    handleUserFilterChange,
    openModal,
    isModalOpen: Boolean(modal),
  };
}
