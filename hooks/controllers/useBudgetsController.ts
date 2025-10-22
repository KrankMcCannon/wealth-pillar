/**
 * Budgets Controller Hook
 * Extracts ALL business logic from budgets/page.tsx
 * Follows MVC pattern established in useTransactionsController
 *
 * Responsibilities:
 * 1. Data fetching (budgets, transactions, categories, periods, accounts)
 * 2. UI state management (forms, dropdowns, selected budget)
 * 3. Business logic (view model creation, budget selection, filtering)
 * 4. Action handlers (create, edit, delete operations)
 */

'use client';

import {
  useAccounts,
  useBudgetPeriods,
  useBudgets,
  useCategories,
  useDeleteBudget,
  useDeleteTransaction,
  useTransactions,
  useUserSelection
} from '@/hooks';
import {
  createAccountNamesMap,
  createUserNamesMap
} from '@/lib/services/data-grouping.service';
import type { Budget, Transaction } from '@/lib/types';
import { createBudgetsViewModel } from '@/lib/view-models/budgets-view-model';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Filter budgets based on user role and selection
 */
function getBudgetsForUser(
  budgets: Budget[],
  userId: string,
  currentUser: { id: string; role: string; group_id: string } | null,
  users: { id: string; group_id: string }[]
): Budget[] {
  if (userId === 'all' && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')) {
    // Admin sees all budgets from users in their group
    return budgets.filter(budget => {
      const budgetUser = users?.find(u => u.id === budget.user_id);
      return budgetUser?.group_id === currentUser?.group_id;
    });
  }

  if (userId === 'all') {
    // Fallback for non-admin users - show their own budgets
    return budgets.filter(budget => budget.user_id === currentUser?.id);
  }

  // Specific user selected
  return budgets.filter(budget => budget.user_id === userId);
}

export function useBudgetsController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ========================================
  // DATA FETCHING (Read-only queries)
  // ========================================
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: allTransactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: allBudgetPeriods = [], isLoading: periodLoading } = useBudgetPeriods();

  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();

  // Mutations
  const deleteBudgetMutation = useDeleteBudget();
  const deleteTransactionMutation = useDeleteTransaction();

  // ========================================
  // UI STATE
  // ========================================
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Transaction form state
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFormMode, setTransactionFormMode] = useState<'create' | 'edit'>('edit');

  // Budget form state
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetFormMode, setBudgetFormMode] = useState<'create' | 'edit'>('create');

  // Category form state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  // User and account name maps
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});

  // ========================================
  // COMPUTED DATA
  // ========================================

  // Get available budgets for current user selection
  const availableBudgets = useMemo(() => {
    return getBudgetsForUser(budgets, selectedViewUserId, currentUser, users || []);
  }, [budgets, selectedViewUserId, currentUser, users]);

  // Get current period for selected budget owner
  const getCurrentPeriodForUser = useCallback((userId: string) => {
    return allBudgetPeriods.find(period => period.user_id === userId && period.is_active);
  }, [allBudgetPeriods]);

  const currentPeriod = useMemo(() => {
    if (!selectedBudget) return null;
    return getCurrentPeriodForUser(selectedBudget.user_id);
  }, [selectedBudget, getCurrentPeriodForUser]);

  // Create view model for selected budget
  const viewModel = useMemo(() => {
    if (!selectedBudget) return null;

    return createBudgetsViewModel(
      selectedBudget,
      allTransactions,
      currentPeriod || null
    );
  }, [selectedBudget, allTransactions, currentPeriod]);

  // Create lookup maps
  const userNamesMap = useMemo(() => {
    return createUserNamesMap(users || []);
  }, [users]);

  const accountNamesMap = useMemo(() => {
    return createAccountNamesMap(accounts);
  }, [accounts]);

  // ========================================
  // EFFECTS
  // ========================================

  // Update user map when users change
  useEffect(() => {
    const nextMap: { [key: string]: string } = {};
    users?.forEach(user => { nextMap[user.id] = user.name; });

    const sameSize = Object.keys(nextMap).length === Object.keys(userMap).length;
    const sameEntries = sameSize && Object.keys(nextMap).every(k => userMap[k] === nextMap[k]);

    if (!sameEntries) {
      setUserMap(nextMap);
    }
  }, [users, userMap]);

  // Initialize or update selected budget when data changes
  useEffect(() => {
    if (!budgets || !users || !currentUser) return;

    const available = getBudgetsForUser(budgets, selectedViewUserId, currentUser, users);
    
    // Check if there's a budget ID in the URL
    const budgetIdFromUrl = searchParams.get('budget');
    
    if (budgetIdFromUrl) {
      // Try to find and select the budget from URL
      const budgetFromUrl = available.find(b => b.id === budgetIdFromUrl);
      if (budgetFromUrl && (!selectedBudget || selectedBudget.id !== budgetIdFromUrl)) {
        console.log('Selecting budget from URL:', budgetFromUrl.description);
        setSelectedBudget(budgetFromUrl);
        return;
      }
    }
    
    const first = available[0];

    // Only update if we don't have a selected budget or it's not in the available budgets
    if (!selectedBudget || !available.some(b => b.id === selectedBudget.id)) {
      setSelectedBudget(first || null);
    }
  }, [budgets, selectedViewUserId, currentUser, users, selectedBudget, searchParams]);

  // ========================================
  // ACTION HANDLERS
  // ========================================

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormMode('edit');
    setIsTransactionFormOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback(async (transactionId: string) => {
    if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
      try {
        await deleteTransactionMutation.mutateAsync(transactionId);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Errore durante l\'eliminazione della transazione');
      }
    }
  }, [deleteTransactionMutation]);

  const handleCreateTransaction = useCallback(() => {
    setEditingTransaction(null);
    setTransactionFormMode('create');
    setIsTransactionFormOpen(true);
  }, []);

  const handleEditBudget = useCallback((budget: Budget) => {
    setEditingBudget(budget);
    setBudgetFormMode('edit');
    setIsBudgetFormOpen(true);
  }, []);

  const handleDeleteBudget = useCallback(async (budgetId: string) => {
    if (confirm('Sei sicuro di voler eliminare questo budget?')) {
      try {
        await deleteBudgetMutation.mutateAsync(budgetId);

        // If deleted budget was selected, reset to first available budget
        if (selectedBudget?.id === budgetId) {
          const remaining = availableBudgets.filter(b => b.id !== budgetId);
          setSelectedBudget(remaining[0] || null);
        }
      } catch (error) {
        console.error('Failed to delete budget:', error);
        alert('Errore durante l\'eliminazione del budget');
      }
    }
  }, [deleteBudgetMutation, selectedBudget, availableBudgets]);

  const handleCreateBudget = useCallback(() => {
    setEditingBudget(null);
    setBudgetFormMode('create');
    setIsBudgetFormOpen(true);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setIsCategoryFormOpen(true);
  }, []);

  const handleBudgetSelect = useCallback((budgetId: string) => {
    const budget = availableBudgets.find(b => b.id === budgetId);
    if (budget) {
      setSelectedBudget(budget);
    }
  }, [availableBudgets]);

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  // ========================================
  // LOADING STATE
  // ========================================
  const isLoading = budgetsLoading || txLoading || userSelectionLoading || periodLoading;

  // ========================================
  // RETURN API
  // ========================================
  return {
    // View Model
    viewModel,

    // Raw Data
    budgets: availableBudgets,
    categories,
    users: users || [],
    currentUser,
    selectedViewUserId,
    userNamesMap,
    accountNamesMap,
    allBudgetPeriods,

    // Selected Budget
    selectedBudget,

    // UI State
    isDropdownOpen,
    isTransactionFormOpen,
    editingTransaction,
    transactionFormMode,
    isBudgetFormOpen,
    editingBudget,
    budgetFormMode,
    isCategoryFormOpen,
    isLoading,

    // State Setters
    setIsDropdownOpen,
    setIsTransactionFormOpen,
    setIsBudgetFormOpen,
    setIsCategoryFormOpen,
    updateViewUserId,

    // Actions
    handleEditTransaction,
    handleDeleteTransaction,
    handleCreateTransaction,
    handleEditBudget,
    handleDeleteBudget,
    handleCreateBudget,
    handleCreateCategory,
    handleBudgetSelect,
    handleBackClick,

    // Utilities
    getCurrentPeriodForUser
  };
}
