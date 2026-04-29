'use client';

/**
 * useDashboardContent — logica condivisa per la Home dashboard (client).
 */
import { useEffect, useMemo, useCallback } from 'react';
import { useUserFilter, usePermissions, useFilteredAccounts } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { usePageDataStore } from '@/stores/page-data-store';
import { calculateDisplayedAccounts } from './dashboard-helpers';
import { findSharedSavingsAccount } from '../constants';
import type { Account, BudgetPeriod, User } from '@/lib/types';
import type { RecurringTransactionSeries } from '@/lib';
import { useRouter } from '@/i18n/routing';

export interface UseDashboardContentParams {
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
}

export interface UseDashboardContentReturn {
  isMember: boolean;
  selectedUserId: string | undefined;
  selectedGroupFilter: string;
  effectiveUserId: string;
  displayedDefaultAccounts: Account[];
  totalBalance: number;
  handleCreateRecurringSeries: () => void;
  handleSeriesCardClick: () => void;
  handlePauseRecurringSeries: () => void;
}

export function useDashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  budgetPeriods,
  recurringSeries,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId } = useUserFilter();
  const setBudgetPeriods = usePageDataStore((state) => state.setBudgetPeriods);
  const setRecurringSeries = usePageDataStore((state) => state.setRecurringSeries);

  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === 'all' ? undefined : selectedGroupFilter,
  });

  const { openModal } = useModalState();

  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId,
  });

  const displayedDefaultAccounts = useMemo(() => {
    return calculateDisplayedAccounts(
      accounts,
      groupUsers,
      accountBalances,
      currentUser,
      selectedUserId,
      isMember
    );
  }, [selectedUserId, accounts, groupUsers, accountBalances, isMember, currentUser]);

  const totalBalance = useMemo(() => {
    let balance = 0;
    if (selectedUserId) {
      const userAccountIds = userAccounts.map((a) => a.id);
      balance = userAccountIds.reduce(
        (sum, accountId) => sum + (accountBalances[accountId] || 0),
        0
      );
      const sharedSavings = findSharedSavingsAccount(accounts);
      if (sharedSavings) balance += accountBalances[sharedSavings.id] || 0;
    } else {
      balance = Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    }
    return Math.round(balance * 100) / 100;
  }, [selectedUserId, userAccounts, accounts, accountBalances]);

  useEffect(() => {
    setBudgetPeriods(budgetPeriods);
  }, [budgetPeriods, setBudgetPeriods]);

  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  const handleCreateRecurringSeries = useCallback(() => {
    openModal('recurring');
  }, [openModal]);

  const handleSeriesCardClick = useCallback(() => {
    router.push('/transactions?tab=Recurrent');
  }, [router]);

  const handlePauseRecurringSeries = useCallback(() => {
    router.push('/transactions?tab=Recurrent');
  }, [router]);

  return {
    isMember,
    selectedUserId,
    selectedGroupFilter,
    effectiveUserId,
    displayedDefaultAccounts,
    totalBalance,
    handleCreateRecurringSeries,
    handleSeriesCardClick,
    handlePauseRecurringSeries,
  };
}
