'use client';

/**
 * Transactions Controller Hook
 * Extracts ALL business logic and state management from transactions/page.tsx
 * Follows MVC pattern - Controller layer that orchestrates services and view models
 *
 * Reduces page from 450 lines to ~100 lines (78% reduction)
 */

import { useAccounts, useCategories, useTransactions, useUserSelection } from '@/src/lib';
import type { RecurringTransactionSeries, Transaction } from '@/src/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createTransactionsViewModel } from '../services/transactions-view-model';
import { useDeleteTransaction } from './use-transaction-mutations';

/**
 * Transactions Controller
 * Central orchestration point for all transactions page logic
 */
export function useTransactionsController() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ========================================
  // DATA FETCHING (Read-only queries)
  // ========================================
  const { data: transactions = [], isLoading: txLoading } = useTransactions();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();

  const deleteTransactionMutation = useDeleteTransaction();

  // ========================================
  // UI STATE - Filters
  // ========================================
  const [activeTab, setActiveTab] = useState("Transactions");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // ========================================
  // UI STATE - Transaction Form
  // ========================================
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<"expense" | "income" | "transfer">("expense");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFormMode, setTransactionFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // UI STATE - Recurring Series Form
  // ========================================
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<RecurringTransactionSeries | null>(null);
  const [recurringFormMode, setRecurringFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // UI STATE - Filter Modal
  // ========================================
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // ========================================
  // EFFECTS - Debounce search query
  // ========================================
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // ========================================
  // BUSINESS LOGIC - View Model Creation
  // ========================================
  const viewModel = useMemo(
    () => createTransactionsViewModel(
      transactions,
      {
        searchQuery: debouncedSearchQuery,
        selectedFilter,
        selectedCategory,
        selectedUserId: selectedViewUserId
      },
      accounts,
      currentUser
    ),
    [transactions, debouncedSearchQuery, selectedFilter, selectedCategory, selectedViewUserId, accounts, currentUser]
  );

  // ========================================
  // EFFECTS - Tab initialization from URL
  // ========================================
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upcoming' || tab === 'recurrent') {
      setActiveTab('Recurrent');
    }
  }, [searchParams]);

  // ========================================
  // ACTIONS - Transaction Management
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

  const handleCreateTransaction = useCallback((type: "expense" | "income" | "transfer" = "expense") => {
    setEditingTransaction(null);
    setTransactionFormMode('create');
    setTransactionFormType(type);
    setIsTransactionFormOpen(true);
  }, []);

  // ========================================
  // ACTIONS - Recurring Series Management
  // ========================================
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

  // ========================================
  // ACTIONS - Filter Management
  // ========================================
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedFilter("all");
    setSelectedCategory("all");
    updateViewUserId("all");
  }, [updateViewUserId]);

  // ========================================
  // ACTIONS - Navigation
  // ========================================
  const handleBackClick = useCallback(() => {
    const from = searchParams.get('from');
    if (from === 'dashboard') {
      router.push('/dashboard');
    } else if (from === 'budgets') {
      const params = new URLSearchParams();
      if (selectedViewUserId !== 'all') {
        params.set('member', selectedViewUserId);
      }
      const budgetParam = searchParams.get('budget');
      if (budgetParam && budgetParam !== 'all') {
        params.set('budget', budgetParam);
      }
      const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
      router.push(url);
    } else {
      router.back();
    }
  }, [router, searchParams, selectedViewUserId]);

  // ========================================
  // COMPUTED STATE
  // ========================================
  const isLoading = txLoading || userSelectionLoading || categoriesLoading || accountsLoading;

  // ========================================
  // RETURN CONTROLLER API
  // ========================================
  return {
    // View Model (computed data ready for UI)
    viewModel,

    // Raw data (for specific UI needs)
    categories,
    users,
    currentUser,
    selectedViewUserId,

    // UI State - Tabs
    activeTab,

    // UI State - Filters
    searchQuery,
    selectedFilter,
    selectedCategory,
    isFilterModalOpen,

    // UI State - Transaction Form
    isTransactionFormOpen,
    transactionFormType,
    editingTransaction,
    transactionFormMode,

    // UI State - Recurring Series Form
    isRecurringFormOpen,
    editingSeries,
    recurringFormMode,

    // Loading State
    isLoading,

    // State Setters - Tabs
    setActiveTab,

    // State Setters - Filters
    setSearchQuery,
    setSelectedFilter,
    setSelectedCategory,
    setIsFilterModalOpen,

    // State Setters - Forms
    setIsTransactionFormOpen,
    setIsRecurringFormOpen,

    // State Setters - User Selection
    updateViewUserId,

    // Actions - Transaction Management
    handleEditTransaction,
    handleDeleteTransaction,
    handleCreateTransaction,

    // Actions - Recurring Series Management
    handleCreateRecurringSeries,
    handleEditRecurringSeries,

    // Actions - Filter Management
    resetFilters,

    // Actions - Navigation
    handleBackClick
  };
}
