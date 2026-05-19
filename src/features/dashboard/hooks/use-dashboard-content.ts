'use client';

/**
 * useDashboardContent — logica condivisa per la Home dashboard (client).
 */
import { useMemo, useCallback } from 'react';
import { useUserFilter, usePermissions, useFilteredAccounts } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
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
  handleOpenRecurringTab: () => void;
}

export function useDashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId } = useUserFilter();
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

  const handleCreateRecurringSeries = useCallback(() => {
    openModal('recurring');
  }, [openModal]);

  const handleOpenRecurringTab = useCallback(() => {
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
    handleOpenRecurringTab,
  };
}
