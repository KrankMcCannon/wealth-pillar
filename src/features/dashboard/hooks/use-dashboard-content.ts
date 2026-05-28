'use client';

/**
 * useDashboardContent — display-only; totals precomputed server-side.
 */
import { useMemo, useCallback } from 'react';
import { useUserFilter, usePermissions } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { calculateDisplayedAccounts } from './dashboard-helpers';
import type { Account, BudgetPeriod, User } from '@/lib/types';
import type { RecurringTransactionSeries } from '@/lib';
import type { DashboardBalanceViewModel } from '@/server/use-cases/accounts/account.logic';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';
import { useRouter } from '@/i18n/routing';

export interface UseDashboardContentParams {
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  balanceViewModel: DashboardBalanceViewModel;
  netSavingsAll: NetSavingsResult;
  netSavingsByUserId: Record<string, NetSavingsResult>;
}

export interface UseDashboardContentReturn {
  isMember: boolean;
  selectedUserId: string | undefined;
  selectedGroupFilter: string;
  effectiveUserId: string;
  displayedDefaultAccounts: Account[];
  spendableBalance: number;
  reserveBalance: number;
  totalBalance: number;
  netSavings: NetSavingsResult;
  handleCreateRecurringSeries: () => void;
  handleOpenRecurringTab: () => void;
}

export function useDashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  balanceViewModel,
  netSavingsAll,
  netSavingsByUserId,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId } = useUserFilter();
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === 'all' ? undefined : selectedGroupFilter,
  });

  const { openModal } = useModalState();

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

  const spendableBalance = useMemo(() => {
    if (selectedUserId) {
      return balanceViewModel.spendableByUserId[selectedUserId] ?? 0;
    }
    return balanceViewModel.spendableBalanceAll;
  }, [selectedUserId, balanceViewModel]);

  const reserveBalance = useMemo(() => {
    if (selectedUserId) {
      return balanceViewModel.reserveByUserId[selectedUserId] ?? 0;
    }
    return balanceViewModel.reserveBalanceAll;
  }, [selectedUserId, balanceViewModel]);

  const totalBalance = useMemo(() => {
    if (selectedUserId) {
      return balanceViewModel.totalBalanceByUserId[selectedUserId] ?? 0;
    }
    return balanceViewModel.totalBalanceAll;
  }, [selectedUserId, balanceViewModel]);

  const netSavings = useMemo(() => {
    if (selectedUserId) {
      return netSavingsByUserId[selectedUserId] ?? netSavingsAll;
    }
    return netSavingsAll;
  }, [selectedUserId, netSavingsAll, netSavingsByUserId]);

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
    spendableBalance,
    reserveBalance,
    totalBalance,
    netSavings,
    handleCreateRecurringSeries,
    handleOpenRecurringTab,
  };
}
