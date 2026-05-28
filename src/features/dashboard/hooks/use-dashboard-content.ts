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
import { useRouter } from '@/i18n/routing';

export interface UseDashboardContentParams {
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  balanceViewModel: DashboardBalanceViewModel;
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
  balanceViewModel,
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

  const totalBalance = useMemo(() => {
    if (selectedUserId) {
      return balanceViewModel.totalBalanceByUserId[selectedUserId] ?? 0;
    }
    return balanceViewModel.totalBalanceAll;
  }, [selectedUserId, balanceViewModel]);

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
