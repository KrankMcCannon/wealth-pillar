/**
 * useTransactionsContent Hook
 *
 * Extracts business logic from TransactionsContent component.
 * Manages filters, pagination, delete handlers, pause modal, and grouped transactions.
 */

import { useState, useMemo, useEffect, useCallback, useRef, createElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  useUserFilter,
  useDeleteConfirmation,
  useIdNameMap,
  useFilteredData,
  useToast,
  useDebouncedValue,
} from '@/hooks';
import { loadMoreTransactionsAction } from '@/features/transactions/actions/load-more-transactions';
import { RecurringTransactionSeries } from '@/lib';
import {
  defaultFiltersState,
  filterTransactions,
  type TransactionFiltersState,
} from '@/features/transactions';
import type { Transaction, Budget, User, Account, Category } from '@/lib/types';
import { deleteTransactionAction } from '@/features/transactions/actions/transaction-actions';
import { deleteRecurringSeriesAction } from '@/features/recurring/actions/recurring-actions';
import { useModalState, useTabState, type ModalType } from '@/lib/navigation/url-state';
import { usePageDataStore } from '@/stores/page-data-store';
import { useRouter } from '@/i18n/routing';
import { ToastAction, type ToastActionElement } from '@/components/ui/toast';
import { usePaginatedTransactions, type PageSizeOption } from './usePaginatedTransactions';

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

  // Pagination
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPageSize: (size: PageSizeOption) => void;
  isChangingPage: boolean;
  pageError: string | null;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;

  // Current page transactions (filtered + sliced)
  currentPageItems: Transaction[];

  // All filtered transactions count (for pagination info)
  filteredCount: number;

  // Store data
  storeTransactions: Transaction[];

  // Account names map
  accountNames: Record<string, string>;

  // Transaction handlers
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteClick: (transactionId: string) => void;
  handleDeleteConfirm: () => Promise<void>;

  // Delete confirmation state
  deleteConfirm: ReturnType<typeof useDeleteConfirmation<Transaction>>;
  handleCancelDelete: () => void;
  recurringDeleteConfirm: ReturnType<typeof useDeleteConfirmation<RecurringTransactionSeries>>;
  handleRecurringCancelDelete: () => void;

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

const DEFAULT_PAGE_SIZE: PageSizeOption = 30;

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
  const DELETE_UNDO_WINDOW_MS = 5000;
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('TransactionsContent');
  const { toast } = useToast();

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

  // Page size state — user can change via selector
  const [pageSize, setPageSizeRaw] = useState<PageSizeOption>(DEFAULT_PAGE_SIZE);

  // Debounce search so typing does not re-run filter on every keystroke
  const debouncedSearchQuery = useDebouncedValue(filters.searchQuery, 250);

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

  // Scroll to top on page mount
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
  const pendingDeleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRecurringDeleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    const pendingDeleteTimers = pendingDeleteTimersRef.current;
    const pendingRecurringDeleteTimers = pendingRecurringDeleteTimersRef.current;
    return () => {
      pendingDeleteTimers.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingDeleteTimers.clear();
      pendingRecurringDeleteTimers.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      pendingRecurringDeleteTimers.clear();
    };
  }, []);

  // Initialize store with initial server-loaded transactions
  useEffect(() => {
    setTransactions(transactions);
  }, [transactions, setTransactions]);

  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  // Create account names map for display
  const accountNames = useIdNameMap(accounts);

  // Filter by selected user (centralized permission-based filtering)
  const { filteredData: userFilteredTransactions } = useFilteredData({
    data: storeTransactions,
    currentUser,
    selectedUserId,
  });

  // Apply domain-specific filters (type, date, category, search)
  const filteredTransactions = useMemo(() => {
    return filterTransactions(
      userFilteredTransactions,
      {
        searchQuery: debouncedSearchQuery,
        type: filters.type,
        dateRange: filters.dateRange,
        categoryKey: filters.categoryKey,
        categoryKeys: filters.categoryKeys,
        budgetId: filters.budgetId,
        startDate: filters.startDate,
        endDate: filters.endDate,
      },
      categories
    );
  }, [
    userFilteredTransactions,
    debouncedSearchQuery,
    filters.type,
    filters.dateRange,
    filters.categoryKey,
    filters.categoryKeys,
    filters.budgetId,
    filters.startDate,
    filters.endDate,
    categories,
  ]);

  // Load-more callback for pagination
  const loadMoreCallback = useCallback(async (offset: number, limit: number) => {
    const result = await loadMoreTransactionsAction(offset, limit);
    if (result.error) throw new Error(result.error);
    return { data: result.data, hasMore: result.hasMore };
  }, []);

  // Handle newly loaded transactions from pagination hook
  const handleNewTransactions = useCallback(
    (newTxs: Transaction[]) => {
      setTransactions([...storeTransactions, ...newTxs]);
    },
    [storeTransactions, setTransactions]
  );

  // Pagination hook
  const {
    currentPage,
    totalPages,
    currentPageItems,
    isChangingPage,
    pageError,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  } = usePaginatedTransactions({
    filteredTransactions,
    allLoadedCount: storeTransactions.length,
    totalServerCount: totalTransactions,
    hasMoreFromServer: hasMoreTransactions,
    pageSize,
    loadMore: loadMoreCallback,
    onNewTransactions: handleNewTransactions,
  });

  // Changing page size resets to page 1 in the same event — no effect needed
  const setPageSize = useCallback(
    (size: PageSizeOption) => {
      setPageSizeRaw(size);
      resetPage();
    },
    [resetPage]
  );

  // Reset pagination when filters change
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    if (prevFiltersRef.current !== filters) {
      prevFiltersRef.current = filters;
      resetPage();
    }
  }, [filters, resetPage]);

  // Transaction handlers
  const handleEditTransaction = useCallback(
    (transaction: Transaction) => {
      openModal('transaction', transaction.id);
    },
    [openModal]
  );

  const handleDeleteClick = useCallback(
    (transactionId: string) => {
      if (pendingDeleteTimersRef.current.has(transactionId)) {
        toast({
          title: t('undoDelete.pendingTitle'),
          description: t('undoDelete.pendingDescription'),
          variant: 'info',
        });
        return;
      }

      const transaction = storeTransactions.find((tx) => tx.id === transactionId);
      if (transaction) {
        deleteConfirm.openDialog(transaction);
      }
    },
    [storeTransactions, deleteConfirm, toast, t]
  );

  const handleDeleteConfirm = useCallback(async () => {
    await deleteConfirm.executeDelete(async (transaction) => {
      let rollbackDone = false;
      const rollbackOptimisticDelete = () => {
        if (rollbackDone) return;
        addTransactionToStore(transaction);
        rollbackDone = true;
      };

      removeTransactionFromStore(transaction.id);
      const pendingDeleteTimers = pendingDeleteTimersRef.current;

      const commitDelete = async () => {
        try {
          const result = await deleteTransactionAction(transaction.id);
          if (result.error) {
            rollbackOptimisticDelete();
            toast({
              title: t('errors.title'),
              description: `${t('errors.deleteTransactionFailed')} ${t('errors.retryHint')}`,
              variant: 'destructive',
            });
          }
        } catch {
          rollbackOptimisticDelete();
          toast({
            title: t('errors.title'),
            description: `${t('errors.deleteTransactionFailed')} ${t('errors.retryHint')}`,
            variant: 'destructive',
          });
        } finally {
          pendingDeleteTimers.delete(transaction.id);
        }
      };

      const undoDelete = () => {
        const timeoutId = pendingDeleteTimers.get(transaction.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingDeleteTimers.delete(transaction.id);
        }
        rollbackOptimisticDelete();
      };

      const timeoutId = setTimeout(() => {
        commitDelete();
      }, DELETE_UNDO_WINDOW_MS);

      pendingDeleteTimers.set(transaction.id, timeoutId);
      const undoAction = createElement(
        ToastAction,
        {
          altText: t('undoDelete.action'),
          onClick: undoDelete,
        },
        t('undoDelete.action')
      ) as unknown as ToastActionElement;

      toast({
        title: t('undoDelete.title'),
        description: t('undoDelete.description'),
        variant: 'info',
        action: undoAction,
      });
    });
  }, [deleteConfirm, removeTransactionFromStore, addTransactionToStore, toast, t]);

  // Recurring handlers
  const handleRecurringDeleteClick = useCallback(
    (series: RecurringTransactionSeries) => {
      if (pendingRecurringDeleteTimersRef.current.has(series.id)) {
        toast({
          title: t('undoDeleteRecurring.pendingTitle'),
          description: t('undoDeleteRecurring.pendingDescription'),
          variant: 'info',
        });
        return;
      }
      recurringDeleteConfirm.openDialog(series);
    },
    [recurringDeleteConfirm, toast, t]
  );

  const handleRecurringDeleteConfirm = useCallback(async () => {
    await recurringDeleteConfirm.executeDelete(async (series) => {
      const pendingRecurringDeleteTimers = pendingRecurringDeleteTimersRef.current;
      let wasCancelled = false;

      const commitRecurringDelete = async () => {
        if (wasCancelled) {
          pendingRecurringDeleteTimers.delete(series.id);
          return;
        }

        try {
          const result = await deleteRecurringSeriesAction(series.id);
          if (result.error) {
            toast({
              title: t('errors.title'),
              description: `${t('errors.deleteRecurringFailed')} ${t('errors.retryHint')}`,
              variant: 'destructive',
            });
          } else {
            toast({
              title: t('undoDeleteRecurring.committedTitle'),
              description: t('undoDeleteRecurring.committedDescription'),
              variant: 'success',
            });
            router.refresh();
          }
        } catch {
          toast({
            title: t('errors.title'),
            description: `${t('errors.deleteRecurringFailed')} ${t('errors.retryHint')}`,
            variant: 'destructive',
          });
        } finally {
          pendingRecurringDeleteTimers.delete(series.id);
        }
      };

      const undoRecurringDelete = () => {
        const timeoutId = pendingRecurringDeleteTimers.get(series.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          pendingRecurringDeleteTimers.delete(series.id);
        }
        wasCancelled = true;
        toast({
          title: t('undoDeleteRecurring.cancelledTitle'),
          description: t('undoDeleteRecurring.cancelledDescription'),
          variant: 'info',
        });
      };

      const timeoutId = setTimeout(() => {
        commitRecurringDelete();
      }, DELETE_UNDO_WINDOW_MS);

      pendingRecurringDeleteTimers.set(series.id, timeoutId);
      const undoAction = createElement(
        ToastAction,
        {
          altText: t('undoDeleteRecurring.action'),
          onClick: undoRecurringDelete,
        },
        t('undoDeleteRecurring.action')
      ) as unknown as ToastActionElement;

      toast({
        title: t('undoDeleteRecurring.title'),
        description: t('undoDeleteRecurring.description'),
        variant: 'info',
        action: undoAction,
      });
    });
  }, [recurringDeleteConfirm, toast, t, router]);

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
    // Pagination
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    isChangingPage,
    pageError,
    goToPage,
    nextPage,
    prevPage,
    currentPageItems,
    filteredCount: filteredTransactions.length,
    // Store
    storeTransactions,
    accountNames,
    // Handlers
    handleEditTransaction,
    handleDeleteClick,
    handleDeleteConfirm,
    deleteConfirm,
    handleCancelDelete: () => deleteConfirm.closeDialog(),
    recurringDeleteConfirm,
    handleRecurringCancelDelete: () => recurringDeleteConfirm.closeDialog(),
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
