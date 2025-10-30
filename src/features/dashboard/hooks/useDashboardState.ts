/**
 * useDashboardState Hook
 * Manages all UI state for the dashboard
 * Handles form modals, expanded sections, and navigation
 */

'use client';

import { RecurringTransactionSeries } from '@/src/lib';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export interface DashboardPageState {
  expandedAccount: string | null;
  isRecurringFormOpen: boolean;
  editingSeries: RecurringTransactionSeries | null;
  recurringFormMode: 'create' | 'edit';
}

export interface DashboardPageActions {
  handleAccountClick: (id: string) => void;
  handleCreateRecurringSeries: () => void;
  handleEditRecurringSeries: (series: RecurringTransactionSeries) => void;
  handleNavigateToSettings: () => void;
  handleNavigateToBudgets: (userId?: string) => void;
  handleNavigateToTransactions: (options?: {
    from?: string;
    userId?: string;
    category?: string;
  }) => void;
  setIsRecurringFormOpen: (open: boolean) => void;
}

/**
 * Hook for consolidated UI state management on dashboard
 * Returns structured { state, actions } object
 */
export function useDashboardState(): {
  state: DashboardPageState;
  actions: DashboardPageActions;
} {
  const router = useRouter();

  // ========================================
  // UI STATE
  // ========================================
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<RecurringTransactionSeries | null>(null);
  const [recurringFormMode, setRecurringFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const handleAccountClick = useCallback((id: string) => {
    setExpandedAccount(prev => prev === id ? null : id);
  }, []);

  const handleCreateRecurringSeries = useCallback(() => {
    setEditingSeries(null);
    setRecurringFormMode('create');
    setIsRecurringFormOpen(true);
  }, []);

  const handleEditRecurringSeries = useCallback((series: RecurringTransactionSeries) => {
    setEditingSeries(series);
    setRecurringFormMode('edit');
    setIsRecurringFormOpen(true);
  }, []);

  const handleNavigateToSettings = useCallback(() => {
    router.push('/settings');
  }, [router]);

  const handleNavigateToBudgets = useCallback((userId?: string) => {
    const params = new URLSearchParams();
    if (userId && userId !== 'all') {
      params.set('member', userId);
    }
    const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
    router.push(url);
  }, [router]);

  const handleNavigateToTransactions = useCallback((options?: {
    from?: string;
    userId?: string;
    category?: string;
  }) => {
    const params = new URLSearchParams();

    if (options?.from) {
      params.set('from', options.from);
    }

    if (options?.userId && options.userId !== 'all') {
      params.set('member', options.userId);
    }

    if (options?.category) {
      params.set('category', options.category);
    }

    const url = params.toString() ? `/transactions?${params.toString()}` : '/transactions';
    router.push(url);
  }, [router]);

  return {
    state: {
      expandedAccount,
      isRecurringFormOpen,
      editingSeries,
      recurringFormMode,
    },
    actions: {
      handleAccountClick,
      handleCreateRecurringSeries,
      handleEditRecurringSeries,
      handleNavigateToSettings,
      handleNavigateToBudgets,
      handleNavigateToTransactions,
      setIsRecurringFormOpen,
    },
  };
}
