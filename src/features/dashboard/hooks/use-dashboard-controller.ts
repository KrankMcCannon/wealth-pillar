/**
 * Dashboard Controller Hook
 * Extracts ALL business logic from dashboard/page.tsx
 * Follows MVC pattern established in useTransactionsController
 *
 * Responsibilities:
 * 1. Data fetching (users, accounts, transactions, budgets via specialized hooks)
 * 2. UI state management (expanded accounts, forms, modals)
 * 3. Loading and error state orchestration
 * 4. Action handlers (navigation, user switching, recurring series management)
 *
 * Note: Uses existing optimized hooks (useDashboardCore, useDashboardBudgets)
 */

'use client';

import { RecurringTransactionSeries, useUserSelection } from '@/src/lib';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import useDashboardBudgets from './use-dashboard-budgets';
import useDashboardCore from './use-dashboard-core';

export function useDashboardController() {
  const router = useRouter();

  // ========================================
  // UI STATE
  // ========================================
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<RecurringTransactionSeries | null>(null);
  const [recurringFormMode, setRecurringFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // DATA FETCHING
  // ========================================

  // User selection
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading,
    updateUserCache,
  } = useUserSelection();

  // Core dashboard data (users, accounts, transactions)
  const {
    users: coreUsers,
    accounts,
    transactions,
    accountBalances,
    totalBalance,
    loading: coreLoading,
    errors: coreErrors,
    hasData: hasCoreData,
  } = useDashboardCore(selectedViewUserId, currentUser);

  // Budget data (loaded separately for better performance)
  const {
    budgets,
    budgetsByUser,
    isLoading: budgetsLoading,
  } = useDashboardBudgets(
    selectedViewUserId,
    currentUser,
    coreUsers,
    transactions,
    hasCoreData
  );

  // ========================================
  // COMPUTED STATE
  // ========================================

  // Enhanced loading states - show loader until all critical data is ready
  const showInitialLoading = userSelectionLoading || coreLoading.isInitialLoading || budgetsLoading;

  // Check if we have a critical error that blocks the entire dashboard
  const hasCriticalError = coreErrors.criticalError;
  const criticalErrorDetail = coreErrors.users || coreErrors.accounts;

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

  const handleUserChange = useCallback((userId: string) => {
    // Update cache before switching
    if (selectedViewUserId !== 'all') {
      updateUserCache(selectedViewUserId, hasCoreData);
    }
    updateViewUserId(userId);
  }, [selectedViewUserId, updateViewUserId, updateUserCache, hasCoreData]);

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

  // ========================================
  // RETURN API
  // ========================================
  return {
    // Core Data
    currentUser,
    selectedViewUserId,
    users,
    coreUsers,
    accounts,
    transactions,
    accountBalances,
    totalBalance,
    budgets,
    budgetsByUser,

    // UI State
    expandedAccount,
    isRecurringFormOpen,
    editingSeries,
    recurringFormMode,

    // Loading & Error States
    showInitialLoading,
    hasCriticalError,
    criticalErrorDetail,
    coreLoading,
    coreErrors,
    hasCoreData,

    // State Setters
    setIsRecurringFormOpen,

    // Actions
    handleAccountClick,
    handleCreateRecurringSeries,
    handleEditRecurringSeries,
    handleUserChange,
    handleNavigateToSettings,
    handleNavigateToBudgets,
    handleNavigateToTransactions,
  };
}
