/**
 * useTransactionsContent Hook
 *
 * Extracts business logic from TransactionsContent component.
 * Manages filters, infinite scroll, delete handlers, pause modal, and grouped transactions.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  useUserFilter,
  useDeleteConfirmation,
  useIdNameMap,
  useFilteredData,
  useInfiniteScroll,
} from '@/hooks';
import { loadMoreTransactionsAction } from '@/features/transactions/actions/load-more-transactions';
import { RecurringTransactionSeries } from '@/lib';
import {
  defaultFiltersState,
  filterTransactions,
  type TransactionFiltersState,
  type GroupedTransaction,
} from '@/features/transactions';
import type { Transaction, Budget, User, Account, Category } from '@/lib/types';
import { TransactionLogic } from '@/lib/utils/transaction-logic';
import { formatDateSmart, toDateTime } from '@/lib/utils/date-utils';
import { deleteTransactionAction } from '@/features/transactions/actions/transaction-actions';
import { deleteRecurringSeriesAction } from '@/features/recurring/actions/recurring-actions';
import { useModalState, useTabState, type ModalType } from '@/lib/navigation/url-state';
import { usePageDataStore } from '@/stores/page-data-store';

// ============================================================================
// Types
// ============================================================================

export interface UseTransactionsContentProps {
  transactions: Transaction[];
  totalTransactions?: number;
  hasMoreTransactions?: boolean;
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  categories: Category[];
}

export interface UseTransactionsContentReturn {
  // Navigation
  router: ReturnType<typeof useRouter>;

  // Tab management
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // User filtering
  selectedUserId: string | undefined;

  // Filter state
  filters: TransactionFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFiltersState>>;
  selectedBudget: Budget | null;
  handleClearBudgetFilter: () => void;

  // Infinite scroll
  isLoadingMore: boolean;
  canLoadMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;

  // Store data
  storeTransactions: Transaction[];

  // Grouped transactions (computed)
  dayTotals: GroupedTransaction[];
  accountNames: Record<string, string>;

  // Transaction handlers
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteClick: (transactionId: string) => void;
  handleDeleteConfirm: () => Promise<void>;

  // Delete confirmation state
  deleteConfirm: ReturnType<typeof useDeleteConfirmation<Transaction>>;
  recurringDeleteConfirm: ReturnType<typeof useDeleteConfirmation<RecurringTransactionSeries>>;

  // Recurring handlers
  handleRecurringDeleteClick: (series: RecurringTransactionSeries) => void;
  handleRecurringDeleteConfirm: () => Promise<void>;

  // Pause modal
  showPauseModal: boolean;
  selectedSeriesForPause: RecurringTransactionSeries | null;
  handleRecurringPauseClick: (series: RecurringTransactionSeries) => void;
  handlePauseSuccess: () => void;
  handlePauseModalChange: (open: boolean) => void;

  // Modal state
  openModal: (type: ModalType, id?: string) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useTransactionsContent({
  transactions,
  totalTransactions = 0,
  hasMoreTransactions = false,
  recurringSeries,
  budgets,
  currentUser,
  accounts,
  categories,
}: UseTransactionsContentProps): UseTransactionsContentReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();

  // User filtering state management (global context)
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  // Check if coming from budgets page
  const fromBudgets = searchParams.get('from') === 'budgets';
  const budgetIdFromUrl = searchParams.get('budget');
  const memberIdFromUrl = searchParams.get('member');
  const startDateFromUrl = searchParams.get('startDate');
  const endDateFromUrl = searchParams.get('endDate');

  // Get selected budget for display
  const selectedBudget = useMemo(() => {
    if (budgetIdFromUrl) {
      return budgets.find((b) => b.id === budgetIdFromUrl) || null;
    }
    return null;
  }, [budgetIdFromUrl, budgets]);

  // Initialize filters from URL params (budget navigation)
  const initialFilters = useMemo((): TransactionFiltersState => {
    if (fromBudgets && selectedBudget) {
      return {
        ...defaultFiltersState,
        budgetId: selectedBudget.id,
        categoryKeys: selectedBudget.categories,
        type: 'expense',
        dateRange: startDateFromUrl || endDateFromUrl ? 'custom' : defaultFiltersState.dateRange,
        startDate: startDateFromUrl ?? undefined,
        endDate: endDateFromUrl ?? undefined,
      };
    }
    return defaultFiltersState;
  }, [fromBudgets, selectedBudget, startDateFromUrl, endDateFromUrl]);

  // Tab state - managed via URL params for shareable links
  const { activeTab, setActiveTab } = useTabState('Transactions');

  // Modern filters state - initialized from URL or default
  const [filters, setFilters] = useState<TransactionFiltersState>(initialFilters);

  // Pause modal state
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSeriesForPause, setSelectedSeriesForPause] =
    useState<RecurringTransactionSeries | null>(null);

  // Set user filter when coming from budgets
  useEffect(() => {
    if (fromBudgets && memberIdFromUrl) {
      setSelectedGroupFilter(memberIdFromUrl);
    }
  }, [fromBudgets, memberIdFromUrl, setSelectedGroupFilter]);

  // Scroll to top on page mount (navigation to transactions page)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    if (activeTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Handler to clear budget filter and reset URL
  const handleClearBudgetFilter = useCallback(() => {
    setFilters(defaultFiltersState);
    setSelectedGroupFilter('all');
    router.push('/transactions');
  }, [router, setSelectedGroupFilter]);

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Transaction>();
  const recurringDeleteConfirm = useDeleteConfirmation<RecurringTransactionSeries>();

  // Page data store - for optimistic updates
  const storeTransactions = usePageDataStore((state) => state.transactions);
  const setTransactions = usePageDataStore((state) => state.setTransactions);
  const setRecurringSeries = usePageDataStore((state) => state.setRecurringSeries);
  const removeTransactionFromStore = usePageDataStore((state) => state.removeTransaction);
  const addTransactionToStore = usePageDataStore((state) => state.addTransaction);

  // Infinite scroll - load more transactions callback
  const loadMoreCallback = useCallback(async (offset: number, limit: number) => {
    const result = await loadMoreTransactionsAction(offset, limit);
    if (result.error) throw new Error(result.error);
    return { data: result.data, hasMore: result.hasMore };
  }, []);

  // Infinite scroll hook
  const {
    items: infiniteTransactions,
    isLoading: isLoadingMore,
    hasMore: canLoadMore,
    sentinelRef,
  } = useInfiniteScroll({
    initialItems: transactions,
    totalCount: totalTransactions,
    hasMore: hasMoreTransactions,
    pageSize: 50,
    loadMore: loadMoreCallback,
  });

  // Initialize store with infinite scroll data
  useEffect(() => {
    setTransactions(infiniteTransactions);
  }, [infiniteTransactions, setTransactions]);

  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  // Create account names map for display using hook
  const accountNames = useIdNameMap(accounts);

  // Filter transactions by selected user (centralized permission-based filtering)
  const { filteredData: userFilteredTransactions } = useFilteredData({
    data: storeTransactions,
    currentUser,
    selectedUserId,
  });

  // Apply domain-specific filters (type, date, category, search)
  const filteredTransactions = useMemo(() => {
    return filterTransactions(userFilteredTransactions, filters, categories);
  }, [userFilteredTransactions, filters, categories]);

  // Group transactions by date and calculate daily totals using service layer
  const dayTotals = useMemo((): GroupedTransaction[] => {
    const groupedByIsoDate = filteredTransactions.reduce(
      (groups, transaction) => {
        const txDate = toDateTime(transaction.date);
        const isoDate = txDate?.toISODate();
        if (!isoDate) return groups;
        if (!groups[isoDate]) {
          groups[isoDate] = [];
        }
        groups[isoDate].push(transaction);
        return groups;
      },
      {} as Record<string, Transaction[]>
    );

    const dailyTotals = TransactionLogic.calculateDailyTotals(groupedByIsoDate);

    return Object.entries(groupedByIsoDate)
      .map(([isoDate, txs]) => ({
        date: isoDate,
        formattedDate: formatDateSmart(isoDate, locale),
        transactions: txs,
        income: dailyTotals[isoDate]?.income ?? 0,
        expense: dailyTotals[isoDate]?.expense ?? 0,
        total: (dailyTotals[isoDate]?.income ?? 0) - (dailyTotals[isoDate]?.expense ?? 0),
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredTransactions, locale]);

  // Transaction handlers
  const handleEditTransaction = useCallback(
    (transaction: Transaction) => {
      openModal('transaction', transaction.id);
    },
    [openModal]
  );

  const handleDeleteClick = useCallback(
    (transactionId: string) => {
      const transaction = storeTransactions.find((t) => t.id === transactionId);
      if (transaction) {
        deleteConfirm.openDialog(transaction);
      }
    },
    [storeTransactions, deleteConfirm]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await deleteConfirm.executeDelete(async (transaction) => {
      removeTransactionFromStore(transaction.id);

      try {
        const result = await deleteTransactionAction(transaction.id);

        if (result.error) {
          addTransactionToStore(transaction);
          console.error('Failed to delete transaction:', result.error);
          throw new Error(result.error);
        }
      } catch (error) {
        addTransactionToStore(transaction);
        console.error('Error deleting transaction:', error);
        throw error;
      }
    });
  }, [deleteConfirm, removeTransactionFromStore, addTransactionToStore]);

  // Recurring handlers
  const handleRecurringDeleteClick = useCallback(
    (series: RecurringTransactionSeries) => {
      recurringDeleteConfirm.openDialog(series);
    },
    [recurringDeleteConfirm]
  );

  const handleRecurringDeleteConfirm = useCallback(async () => {
    await recurringDeleteConfirm.executeDelete(async (series) => {
      const result = await deleteRecurringSeriesAction(series.id);
      if (result.error) {
        console.error('Failed to delete recurring series:', result.error);
        throw new Error(result.error);
      }
    });
  }, [recurringDeleteConfirm]);

  const handleRecurringPauseClick = useCallback((series: RecurringTransactionSeries) => {
    setSelectedSeriesForPause(series);
    setShowPauseModal(true);
  }, []);

  const handlePauseSuccess = useCallback(() => {
    router.refresh();
    setShowPauseModal(false);
    setSelectedSeriesForPause(null);
  }, [router]);

  const handlePauseModalChange = useCallback((open: boolean) => {
    setShowPauseModal(open);
    if (!open) {
      setSelectedSeriesForPause(null);
    }
  }, []);

  return {
    router,
    activeTab,
    setActiveTab,
    selectedUserId,
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    isLoadingMore,
    canLoadMore,
    sentinelRef,
    storeTransactions,
    dayTotals,
    accountNames,
    handleEditTransaction,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteConfirm,
    recurringDeleteConfirm,
    handleRecurringDeleteClick,
    handleRecurringDeleteConfirm,
    showPauseModal,
    selectedSeriesForPause,
    handleRecurringPauseClick,
    handlePauseSuccess,
    handlePauseModalChange,
    openModal,
  };
}
