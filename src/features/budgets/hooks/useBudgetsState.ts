/**
 * useBudgetsState Hook
 * Unified state management for budgets feature
 * Merges controller logic and form controller logic into one hook
 *
 * This replaces:
 * - use-budgets-controller.ts (mostly)
 * - use-budget-form-controller.ts (form-specific state)
 */

'use client';

import { Budget, Transaction } from '@/lib';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useBudgetsData } from './useBudgetsData';

/**
 * Unified state for budgets page
 */
export interface BudgetsPageState {
  // Selected budget
  selectedBudget: Budget | null;
  selectedViewUserId: string;

  // Modal states
  isDropdownOpen: boolean;
  isTransactionFormOpen: boolean;
  isBudgetFormOpen: boolean;
  isCategoryFormOpen: boolean;

  // Form editing state
  editingTransaction: Transaction | null;
  editingBudget: Budget | null;
  transactionFormMode: 'create' | 'edit';
  budgetFormMode: 'create' | 'edit';
}

/**
 * Unified actions for budgets page
 */
export interface BudgetsPageActions {
  // Selection
  handleBudgetSelect: (budgetId: string) => void;
  handleViewUserChange: (userId: string) => void;
  handleBackClick: () => void;

  // Dropdown
  setIsDropdownOpen: (open: boolean) => void;

  // Transaction form
  handleEditTransaction: (transaction: Transaction) => void;
  handleCreateTransaction: () => void;
  setIsTransactionFormOpen: (open: boolean) => void;

  // Budget form
  handleEditBudget: (budget: Budget) => void;
  handleCreateBudget: () => void;
  setIsBudgetFormOpen: (open: boolean) => void;

  // Category form
  handleCreateCategory: () => void;
  setIsCategoryFormOpen: (open: boolean) => void;
}

/**
 * Consolidated state management hook
 * Handles all UI state and form state for budgets page
 */
export function useBudgetsState() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { budgets } = useBudgetsData();

  // UI State
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [selectedViewUserId, setSelectedViewUserId] = useState<string>('all');
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

  // Initialize selected budget from URL
  useEffect(() => {
    const budgetIdFromUrl = searchParams.get('budget');
    if (budgetIdFromUrl) {
      const budget = budgets.data.find((b) => b.id === budgetIdFromUrl);
      if (budget) {
        setSelectedBudget(budget);
      }
    } else if (budgets.data.length > 0 && !selectedBudget) {
      setSelectedBudget(budgets.data[0]);
    }
  }, [budgets.data, searchParams, selectedBudget]);

  // Action handlers
  const handleBudgetSelect = useCallback(
    (budgetId: string) => {
      const budget = budgets.data.find((b) => b.id === budgetId);
      if (!budget) return;

      setSelectedBudget(budget);

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('budget', budgetId);
      router.push(`?${params.toString()}`);
    },
    [budgets.data, router, searchParams]
  );

  const handleViewUserChange = useCallback((userId: string) => {
    setSelectedViewUserId(userId);
  }, []);

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormMode('edit');
    setIsTransactionFormOpen(true);
  }, []);

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

  const handleCreateBudget = useCallback(() => {
    setEditingBudget(null);
    setBudgetFormMode('create');
    setIsBudgetFormOpen(true);
  }, []);

  const handleCreateCategory = useCallback(() => {
    setIsCategoryFormOpen(true);
  }, []);

  // Return state and actions
  const state: BudgetsPageState = {
    selectedBudget,
    selectedViewUserId,
    isDropdownOpen,
    isTransactionFormOpen,
    isBudgetFormOpen,
    isCategoryFormOpen,
    editingTransaction,
    editingBudget,
    transactionFormMode,
    budgetFormMode,
  };

  const actions: BudgetsPageActions = {
    handleBudgetSelect,
    handleViewUserChange,
    handleBackClick,
    setIsDropdownOpen,
    handleEditTransaction,
    handleCreateTransaction,
    setIsTransactionFormOpen,
    handleEditBudget,
    handleCreateBudget,
    setIsBudgetFormOpen,
    handleCreateCategory,
    setIsCategoryFormOpen,
  };

  return { state, actions };
}
