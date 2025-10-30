/**
 * useTransactionsState Hook
 * Unified state management for transactions feature
 * Handles all UI state, filter state, and form state
 */

'use client';

import type { RecurringTransactionSeries, Transaction } from '@/lib/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDeleteTransaction } from './use-transaction-mutations';

/**
 * Unified state for transactions page
 */
export interface TransactionsPageState {
  // Tab state
  activeTab: 'Transactions' | 'Recurrent';

  // Filter state
  searchQuery: string;
  debouncedSearchQuery: string;
  selectedFilter: string;
  selectedCategory: string;
  isFilterModalOpen: boolean;

  // Transaction form state
  isTransactionFormOpen: boolean;
  transactionFormType: 'expense' | 'income' | 'transfer';
  editingTransaction: Transaction | null;
  transactionFormMode: 'create' | 'edit';

  // Recurring series form state
  isRecurringFormOpen: boolean;
  editingSeries: RecurringTransactionSeries | null;
  recurringFormMode: 'create' | 'edit';
}

/**
 * Unified actions for transactions page
 */
export interface TransactionsPageActions {
  // Tab management
  setActiveTab: (tab: 'Transactions' | 'Recurrent') => void;

  // Filter management
  setSearchQuery: (query: string) => void;
  setSelectedFilter: (filter: string) => void;
  setSelectedCategory: (category: string) => void;
  setIsFilterModalOpen: (open: boolean) => void;
  resetFilters: () => void;

  // Transaction form management
  setIsTransactionFormOpen: (open: boolean) => void;
  handleCreateTransaction: (type?: 'expense' | 'income' | 'transfer') => void;
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteTransaction: (transactionId: string) => void;

  // Recurring series form management
  setIsRecurringFormOpen: (open: boolean) => void;
  handleCreateRecurringSeries: () => void;
  handleEditRecurringSeries: (series: RecurringTransactionSeries) => void;

  // Navigation
  handleBackClick: (selectedViewUserId: string, searchParams: URLSearchParams) => void;
}

/**
 * Consolidated state management hook
 * Handles all UI state and form state for transactions page
 */
export function useTransactionsState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const deleteTransactionMutation = useDeleteTransaction();

  // ========================================
  // Tab State
  // ========================================
  const [activeTab, setActiveTab] = useState<'Transactions' | 'Recurrent'>('Transactions');

  // ========================================
  // Filter State
  // ========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // ========================================
  // Transaction Form State
  // ========================================
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [transactionFormType, setTransactionFormType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFormMode, setTransactionFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // Recurring Series Form State
  // ========================================
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<RecurringTransactionSeries | null>(null);
  const [recurringFormMode, setRecurringFormMode] = useState<'create' | 'edit'>('create');

  // ========================================
  // Effects - Debounce search query
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
  // Effects - Tab initialization from URL
  // ========================================
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'upcoming' || tab === 'recurrent') {
      setActiveTab('Recurrent');
    }
  }, [searchParams]);

  // ========================================
  // Effects - Reset form when modal closes
  // ========================================
  useEffect(() => {
    if (!isTransactionFormOpen) {
      setEditingTransaction(null);
      setTransactionFormMode('create');
    }
  }, [isTransactionFormOpen]);

  useEffect(() => {
    if (!isRecurringFormOpen) {
      setEditingSeries(null);
      setRecurringFormMode('create');
    }
  }, [isRecurringFormOpen]);

  // ========================================
  // Actions - Filter Management
  // ========================================
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedFilter('all');
    setSelectedCategory('all');
  }, []);

  // ========================================
  // Actions - Transaction Management
  // ========================================
  const handleCreateTransaction = useCallback(
    (type: 'expense' | 'income' | 'transfer' = 'expense') => {
      setEditingTransaction(null);
      setTransactionFormMode('create');
      setTransactionFormType(type);
      setIsTransactionFormOpen(true);
    },
    []
  );

  const handleEditTransaction = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormMode('edit');
    setIsTransactionFormOpen(true);
  }, []);

  const handleDeleteTransaction = useCallback(
    async (transactionId: string) => {
      if (confirm('Sei sicuro di voler eliminare questa transazione?')) {
        try {
          await deleteTransactionMutation.mutateAsync(transactionId);
        } catch (error) {
          console.error('Failed to delete transaction:', error);
          alert("Errore durante l'eliminazione della transazione");
        }
      }
    },
    [deleteTransactionMutation]
  );

  // ========================================
  // Actions - Recurring Series Management
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
  // Actions - Navigation
  // ========================================
  const handleBackClick = useCallback(
    (selectedViewUserId: string, searchParamsObj: URLSearchParams) => {
      const from = searchParamsObj.get('from');
      if (from === 'dashboard') {
        router.push('/dashboard');
      } else if (from === 'budgets') {
        const params = new URLSearchParams();
        if (selectedViewUserId !== 'all') {
          params.set('member', selectedViewUserId);
        }
        const budgetParam = searchParamsObj.get('budget');
        if (budgetParam && budgetParam !== 'all') {
          params.set('budget', budgetParam);
        }
        const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
        router.push(url);
      } else {
        router.back();
      }
    },
    [router]
  );

  return {
    // State
    state: {
      activeTab,
      searchQuery,
      debouncedSearchQuery,
      selectedFilter,
      selectedCategory,
      isFilterModalOpen,
      isTransactionFormOpen,
      transactionFormType,
      editingTransaction,
      transactionFormMode,
      isRecurringFormOpen,
      editingSeries,
      recurringFormMode,
    } as TransactionsPageState,

    // Actions
    actions: {
      setActiveTab,
      setSearchQuery,
      setSelectedFilter,
      setSelectedCategory,
      setIsFilterModalOpen,
      resetFilters,
      setIsTransactionFormOpen,
      handleCreateTransaction,
      handleEditTransaction,
      handleDeleteTransaction,
      setIsRecurringFormOpen,
      handleCreateRecurringSeries,
      handleEditRecurringSeries,
      handleBackClick,
    } as TransactionsPageActions,
  };
}
