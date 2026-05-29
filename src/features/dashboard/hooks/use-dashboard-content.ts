'use client';

/**
 * useDashboardContent — display-only; totals precomputed server-side.
 */
import { useMemo, useCallback } from 'react';
import { useUserFilter, usePermissions } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import type { User } from '@/lib/types';
import type { DashboardBalanceViewModel } from '@/server/use-cases/accounts/account.logic';
import { useRouter } from '@/i18n/routing';

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
  handleCreateRecurringSeries: () => void;
  handleOpenRecurringTab: () => void;
}

export function useDashboardContent({
  currentUser,
  balanceViewModel,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId } = useUserFilter();
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === 'all' ? undefined : selectedGroupFilter,
  });

  const { openModal } = useModalState();

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
    spendableBalance,
    reserveBalance,
    handleCreateRecurringSeries,
    handleOpenRecurringTab,
  };
}
