'use client';

/**
 * useDashboardContent — display-only; totals precomputed server-side.
 */
import { useMemo, useCallback } from 'react';
import { useUserFilter, usePermissions } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import type { RecurringTransactionSeries, Transaction, User } from '@/lib/types';
import type { DashboardBalanceViewModel } from '@/server/use-cases/accounts/account.logic';
import { useRecurringEditStore } from '@/features/recurring/stores/recurring-edit-store';
import { useTransactionEditStore } from '@/features/transactions/stores/transaction-edit-store';

export interface UseDashboardContentParams {
  currentUser: User;
  balanceViewModel: DashboardBalanceViewModel;
}

export interface UseDashboardContentReturn {
  isMember: boolean;
  selectedUserId: string | undefined;
  selectedGroupFilter: string;
  effectiveUserId: string;
  spendableBalance: number;
  reserveBalance: number;
  handleEditRecurringSeries: (series: RecurringTransactionSeries) => void;
  handleEditTransaction: (transaction: Transaction) => void;
}

export function useDashboardContent({
  currentUser,
  balanceViewModel,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const { selectedGroupFilter, selectedUserId } = useUserFilter();
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === 'all' ? undefined : selectedGroupFilter,
  });

  const { openModal } = useModalState();
  const setRecurringEditSeed = useRecurringEditStore((state) => state.setSeed);
  const setTransactionEditSeed = useTransactionEditStore((state) => state.setSeed);

  const spendableBalance = useMemo(() => {
    const balanceUserId = isMember ? currentUser.id : selectedUserId;
    if (balanceUserId) {
      return balanceViewModel.spendableByUserId[balanceUserId] ?? 0;
    }
    return balanceViewModel.spendableBalanceAll;
  }, [isMember, currentUser.id, selectedUserId, balanceViewModel]);

  const reserveBalance = useMemo(() => {
    const balanceUserId = isMember ? currentUser.id : selectedUserId;
    if (balanceUserId) {
      return balanceViewModel.reserveByUserId[balanceUserId] ?? 0;
    }
    return balanceViewModel.reserveBalanceAll;
  }, [isMember, currentUser.id, selectedUserId, balanceViewModel]);

  const handleEditRecurringSeries = useCallback(
    (series: RecurringTransactionSeries) => {
      setRecurringEditSeed(series);
      openModal('recurring', series.id);
    },
    [openModal, setRecurringEditSeed]
  );

  const handleEditTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactionEditSeed(transaction);
      openModal('transaction', transaction.id);
    },
    [openModal, setTransactionEditSeed]
  );

  return {
    isMember,
    selectedUserId,
    selectedGroupFilter,
    effectiveUserId,
    spendableBalance,
    reserveBalance,
    handleEditRecurringSeries,
    handleEditTransaction,
  };
}
