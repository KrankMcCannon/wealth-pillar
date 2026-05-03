import {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
  createElement,
  useTransition,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDeleteConfirmation, useIdNameMap, useToast } from '@/hooks';
import { RecurringTransactionSeries } from '@/lib';
import { defaultFiltersState } from '../components/transaction-filters';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';
import type { Transaction, Budget, Account } from '@/lib/types';
import { deleteTransactionAction } from '@/features/transactions/actions/transaction-actions';
import { deleteRecurringSeriesAction } from '@/features/recurring/actions/recurring-actions';
import { useModalState, useTabState, type ModalType } from '@/lib/navigation/url-state';
import { usePageDataStore } from '@/stores/page-data-store';
import { useRouter } from '@/i18n/routing';
import { ToastAction, type ToastActionElement } from '@/components/ui/toast';

export type PageSizeOption = 10 | 20 | 30 | 50 | 100;

export interface UseTransactionsContentProps {
  transactions: Transaction[];
  totalTransactions?: number;
  recurringSeries: RecurringTransactionSeries[];
  budgets: Budget[];
  accounts: Account[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  /** Server-provided keyset token for the next page (sequential forward navigation). */
  nextCursor?: string;
  appliedQuery: {
    user?: string;
    q?: string;
    type: 'all' | 'income' | 'expense' | 'transfer';
    dateRange: 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
    account?: string;
    category?: string;
    /** Chiavi categoria separate da virgola (stesso formato query server). */
    categories?: string;
  };
}

export interface UseTransactionsContentReturn {
  router: ReturnType<typeof useRouter>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedUserId: string | undefined;
  handleUserFilterChange: (userId: string) => void;
  filters: TransactionFiltersState;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFiltersState>>;
  selectedBudget: Budget | null;
  handleClearBudgetFilter: () => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  setPageSize: (size: PageSizeOption) => void;
  isChangingPage: boolean;
  pageError: string | null;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  currentPageItems: Transaction[];
  filteredCount: number;
  storeTransactions: Transaction[];
  accountNames: Record<string, string>;
  handleEditTransaction: (transaction: Transaction) => void;
  handleDeleteClick: (transactionId: string) => void;
  handleDeleteConfirm: () => Promise<void>;
  deleteConfirm: ReturnType<typeof useDeleteConfirmation<Transaction>>;
  handleCancelDelete: () => void;
  recurringDeleteConfirm: ReturnType<typeof useDeleteConfirmation<RecurringTransactionSeries>>;
  handleRecurringCancelDelete: () => void;
  handleRecurringDeleteClick: (series: RecurringTransactionSeries) => void;
  handleRecurringDeleteConfirm: () => Promise<void>;
  showPauseModal: boolean;
  selectedSeriesForPause: RecurringTransactionSeries | null;
  handleRecurringPauseClick: (series: RecurringTransactionSeries) => void;
  handlePauseSuccess: () => void;
  handlePauseModalChange: (open: boolean) => void;
  openModal: (type: ModalType, id?: string) => void;
}

function toFiltersFromQuery(
  props: UseTransactionsContentProps['appliedQuery']
): TransactionFiltersState {
  const resolvedType = props.type === 'transfer' ? 'all' : props.type;
  const keysFromCsv = props.categories
    ? props.categories
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
    : [];

  return {
    ...defaultFiltersState,
    searchQuery: props.q ?? '',
    type: resolvedType,
    dateRange: props.dateRange,
    categoryKey: keysFromCsv.length > 0 ? 'all' : (props.category ?? 'all'),
    accountId: props.account ?? 'all',
    ...(keysFromCsv.length > 0 ? { categoryKeys: keysFromCsv } : {}),
    ...(props.startDate ? { startDate: props.startDate } : {}),
    ...(props.endDate ? { endDate: props.endDate } : {}),
  };
}

function buildQueryString(
  filters: TransactionFiltersState,
  page: number,
  pageSize: number,
  userId?: string,
  cursor?: string
) {
  const params = new URLSearchParams();
  if (userId) params.set('user', userId);
  if (filters.searchQuery.trim()) params.set('q', filters.searchQuery.trim());
  if (filters.type !== 'all') params.set('type', filters.type);
  if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.accountId && filters.accountId !== 'all') params.set('account', filters.accountId);
  if (filters.categoryKeys && filters.categoryKeys.length > 0) {
    params.set('categories', filters.categoryKeys.join(','));
  } else if (filters.categoryKey && filters.categoryKey !== 'all') {
    params.set('category', filters.categoryKey);
  }
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  if (page > 1 && cursor) params.set('cursor', cursor);
  return params.toString();
}

export function useTransactionsContent({
  transactions,
  totalTransactions = 0,
  recurringSeries,
  budgets,
  accounts,
  currentPage,
  totalPages,
  pageSize,
  nextCursor,
  appliedQuery,
}: UseTransactionsContentProps): UseTransactionsContentReturn {
  const DELETE_UNDO_WINDOW_MS = 5000;
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations('TransactionsContent');
  const { toast } = useToast();
  const [isNavigating, startNavigation] = useTransition();
  const [pageError, setPageError] = useState<string | null>(null);

  const { openModal } = useModalState();
  const { activeTab, setActiveTab } = useTabState('Transactions');

  const [filters, setFiltersState] = useState<TransactionFiltersState>(() =>
    toFiltersFromQuery(appliedQuery)
  );

  useEffect(() => {
    setFiltersState(toFiltersFromQuery(appliedQuery));
  }, [appliedQuery]);

  const selectedUserId = appliedQuery.user;
  const selectedBudget = useMemo(() => {
    const budgetId = searchParams.get('budget');
    if (!budgetId) return null;
    return budgets.find((b) => b.id === budgetId) || null;
  }, [searchParams, budgets]);

  const pushQuery = useCallback(
    (
      nextFilters: TransactionFiltersState,
      nextPage: number,
      nextPageSize: number,
      userId?: string,
      cursor?: string
    ) => {
      setPageError(null);
      const query = buildQueryString(nextFilters, nextPage, nextPageSize, userId, cursor);
      startNavigation(() => {
        router.push(`/transactions?${query}`);
      });
    },
    [router]
  );

  const setFilters: React.Dispatch<React.SetStateAction<TransactionFiltersState>> = useCallback(
    (updater) => {
      setFiltersState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        pushQuery(next, 1, pageSize, selectedUserId);
        return next;
      });
    },
    [pageSize, pushQuery, selectedUserId]
  );

  const goToPage = useCallback(
    async (page: number) => {
      const nextPage = Math.max(1, Math.min(page, totalPages));
      const forwardOne = nextPage === currentPage + 1;
      const cursorForUrl = forwardOne && nextCursor ? nextCursor : undefined;
      pushQuery(filters, nextPage, pageSize, selectedUserId, cursorForUrl);
    },
    [currentPage, filters, nextCursor, pageSize, pushQuery, selectedUserId, totalPages]
  );

  const nextPage = useCallback(async () => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(async () => goToPage(currentPage - 1), [goToPage, currentPage]);

  const setPageSize = useCallback(
    (size: PageSizeOption) => {
      pushQuery(filters, 1, size, selectedUserId);
    },
    [filters, pushQuery, selectedUserId]
  );

  const handleUserFilterChange = useCallback(
    (userId: string) => {
      pushQuery(filters, 1, pageSize, userId === 'all' ? undefined : userId);
    },
    [filters, pageSize, pushQuery]
  );

  const handleClearBudgetFilter = useCallback(() => {
    const nextFilters = { ...defaultFiltersState };
    setFiltersState(nextFilters);
    pushQuery(nextFilters, 1, pageSize, selectedUserId);
  }, [pageSize, pushQuery, selectedUserId]);

  const deleteConfirm = useDeleteConfirmation<Transaction>();
  const recurringDeleteConfirm = useDeleteConfirmation<RecurringTransactionSeries>();

  const storeTransactions = usePageDataStore((state) => state.transactions);
  const setTransactions = usePageDataStore((state) => state.setTransactions);
  const setRecurringSeries = usePageDataStore((state) => state.setRecurringSeries);
  const removeTransactionFromStore = usePageDataStore((state) => state.removeTransaction);
  const addTransactionToStore = usePageDataStore((state) => state.addTransaction);
  const accountNames = useIdNameMap(accounts);
  const pendingDeleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRecurringDeleteTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  useEffect(() => {
    setTransactions(transactions);
  }, [transactions, setTransactions]);

  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  useEffect(() => {
    const pendingDeleteTimers = pendingDeleteTimersRef.current;
    const pendingRecurringDeleteTimers = pendingRecurringDeleteTimersRef.current;
    return () => {
      pendingDeleteTimers.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingRecurringDeleteTimers.forEach((timeoutId) => clearTimeout(timeoutId));
      pendingDeleteTimers.clear();
      pendingRecurringDeleteTimers.clear();
    };
  }, []);

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
      if (transaction) deleteConfirm.openDialog(transaction);
    },
    [deleteConfirm, storeTransactions, t, toast]
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
          } else {
            router.refresh();
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
        commitDelete().catch(() => undefined);
      }, DELETE_UNDO_WINDOW_MS);
      pendingDeleteTimers.set(transaction.id, timeoutId);
      const undoAction = createElement(
        ToastAction,
        { altText: t('undoDelete.action'), onClick: undoDelete },
        t('undoDelete.action')
      ) as unknown as ToastActionElement;
      toast({
        title: t('undoDelete.title'),
        description: t('undoDelete.description'),
        variant: 'info',
        action: undoAction,
      });
    });
  }, [addTransactionToStore, deleteConfirm, removeTransactionFromStore, router, t, toast]);

  const handleRecurringDeleteClick = useCallback(
    (series: RecurringTransactionSeries) => recurringDeleteConfirm.openDialog(series),
    [recurringDeleteConfirm]
  );

  const handleRecurringDeleteConfirm = useCallback(async () => {
    await recurringDeleteConfirm.executeDelete(async (series) => {
      try {
        const result = await deleteRecurringSeriesAction(series.id);
        if (result.error) {
          toast({
            title: t('errors.title'),
            description: `${t('errors.deleteRecurringFailed')} ${t('errors.retryHint')}`,
            variant: 'destructive',
          });
          return;
        }
        router.refresh();
      } catch {
        toast({
          title: t('errors.title'),
          description: `${t('errors.deleteRecurringFailed')} ${t('errors.retryHint')}`,
          variant: 'destructive',
        });
      }
    });
  }, [recurringDeleteConfirm, router, t, toast]);

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [selectedSeriesForPause, setSelectedSeriesForPause] =
    useState<RecurringTransactionSeries | null>(null);

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
    if (!open) setSelectedSeriesForPause(null);
  }, []);

  return {
    router,
    activeTab,
    setActiveTab,
    selectedUserId,
    handleUserFilterChange,
    filters,
    setFilters,
    selectedBudget,
    handleClearBudgetFilter,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    isChangingPage: isNavigating,
    pageError,
    goToPage,
    nextPage,
    prevPage,
    currentPageItems: storeTransactions,
    filteredCount: totalTransactions,
    storeTransactions,
    accountNames,
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
