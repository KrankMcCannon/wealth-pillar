import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSearchParams } from 'next/navigation';
import { useIdNameMap } from '@/hooks';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { defaultFiltersState } from '../components/transaction-filters';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';
import type { Transaction, Budget, Account } from '@/lib/types';
import { useModalState, useTabState, type ModalType } from '@/lib/navigation/url-state';
import { useRouter } from '@/i18n/routing';
import { useTransactionEditStore } from '../stores/transaction-edit-store';
import {
  mergeOptimisticTransactions,
  useOptimisticTransactionStore,
} from '../stores/optimistic-transactions';
import { loadMoreTransactionsAction } from '../actions/transaction-actions';
import type { AppliedTransactionsQuery } from '@/server/use-cases/pages/transactions-page.use-case';
import {
  appliedQueryToListQuery,
  buildTransactionsQueryString,
  matchesAppliedQuery,
} from '../utils/transactions-query';

export { appliedQueryToListQuery } from '../utils/transactions-query';

export interface UseTransactionsContentProps {
  transactions: Transaction[];
  hasMore: boolean;
  nextCursor?: string;
  budgets: Budget[];
  accounts: Account[];
  appliedQuery: AppliedTransactionsQuery;
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
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  listItems: Transaction[];
  accountNames: Record<string, string>;
  handleEditTransaction: (transaction: Transaction) => void;
  openModal: (type: ModalType, id?: string) => void;
  isNavigatingFilters: boolean;
}

function toFiltersFromQuery(props: AppliedTransactionsQuery): TransactionFiltersState {
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

function buildQueryKey(appliedQuery: AppliedTransactionsQuery): string {
  return JSON.stringify(appliedQuery);
}

export function useTransactionsContent({
  transactions: serverTransactions,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
  budgets,
  accounts,
  appliedQuery,
}: UseTransactionsContentProps): UseTransactionsContentReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [extraPages, setExtraPages] = useState<Transaction[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const loadMoreLock = useRef(false);
  const queryKey = useMemo(() => buildQueryKey(appliedQuery), [appliedQuery]);
  const prevQueryKeyRef = useRef(queryKey);

  const optimisticOverlay = useOptimisticTransactionStore(
    useShallow((state) => ({
      pending: state.pending,
      updated: state.updated,
      deleted: state.deleted,
    }))
  );
  const pruneCommitted = useOptimisticTransactionStore((state) => state.pruneCommitted);

  const { openModal } = useModalState();
  const { activeTab, setActiveTab } = useTabState('Transactions');

  const urlFilters = useMemo(() => toFiltersFromQuery(appliedQuery), [appliedQuery]);
  const [searchDraft, setSearchDraft] = useState(urlFilters.searchQuery);

  useEffect(() => {
    setSearchDraft(urlFilters.searchQuery);
  }, [urlFilters.searchQuery]);

  useEffect(() => {
    if (prevQueryKeyRef.current !== queryKey) {
      prevQueryKeyRef.current = queryKey;
      setExtraPages([]);
      setHasMore(initialHasMore);
      setNextCursor(initialNextCursor);
    }
  }, [queryKey, initialHasMore, initialNextCursor]);

  const serverList = useMemo(
    () => [...serverTransactions, ...extraPages],
    [serverTransactions, extraPages]
  );

  useEffect(() => {
    pruneCommitted(new Set(serverList.map((transaction) => transaction.id)));
  }, [serverList, pruneCommitted]);

  const filters = useMemo(
    () => ({ ...urlFilters, searchQuery: searchDraft }),
    [urlFilters, searchDraft]
  );

  const listItems = useMemo(
    () =>
      mergeOptimisticTransactions(serverList, optimisticOverlay, (transaction) =>
        matchesAppliedQuery(transaction, appliedQuery, searchDraft)
      ),
    [serverList, optimisticOverlay, appliedQuery, searchDraft]
  );

  const debouncedSearch = useDebouncedValue(searchDraft, 300);

  const selectedUserId = appliedQuery.user;

  const selectedBudget = useMemo(() => {
    const budgetId = searchParams.get('budget');
    if (!budgetId) return null;
    return budgets.find((b) => b.id === budgetId) || null;
  }, [searchParams, budgets]);

  const pushQuery = useCallback(
    (nextFilters: TransactionFiltersState, userId?: string) => {
      const query = buildTransactionsQueryString(nextFilters, userId);
      const budget = searchParams.get('budget');
      const tab = searchParams.get('tab');
      const parts = [query];
      if (budget) parts.push(`budget=${encodeURIComponent(budget)}`);
      if (tab && tab !== 'Transactions') parts.push(`tab=${encodeURIComponent(tab)}`);
      const qs = parts.filter(Boolean).join('&');
      startNavigation(() => {
        router.push(`/transactions?${qs}`);
      });
    },
    [router, searchParams, startNavigation]
  );

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const urlQ = (appliedQuery.q ?? '').trim();
    if (trimmed === urlQ) return;
    pushQuery({ ...urlFilters, searchQuery: debouncedSearch }, selectedUserId);
  }, [debouncedSearch, appliedQuery.q, urlFilters, pushQuery, selectedUserId]);

  const setFilters: React.Dispatch<React.SetStateAction<TransactionFiltersState>> = useCallback(
    (updater) => {
      const base = { ...urlFilters, searchQuery: searchDraft };
      const next = typeof updater === 'function' ? updater(base) : updater;

      if (next.searchQuery !== searchDraft) {
        setSearchDraft(next.searchQuery);
      }

      const nonSearchChanged =
        next.type !== urlFilters.type ||
        next.dateRange !== urlFilters.dateRange ||
        next.categoryKey !== urlFilters.categoryKey ||
        next.accountId !== urlFilters.accountId ||
        (next.startDate ?? null) !== (urlFilters.startDate ?? null) ||
        (next.endDate ?? null) !== (urlFilters.endDate ?? null) ||
        JSON.stringify(next.categoryKeys ?? []) !== JSON.stringify(urlFilters.categoryKeys ?? []);

      if (nonSearchChanged) {
        pushQuery(next, selectedUserId);
      }
    },
    [urlFilters, searchDraft, pushQuery, selectedUserId]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore || loadMoreLock.current) return;
    loadMoreLock.current = true;
    setIsLoadingMore(true);
    try {
      const listQuery = appliedQueryToListQuery(appliedQuery, searchDraft);
      const result = await loadMoreTransactionsAction({
        query: listQuery,
        cursor: nextCursor,
      });
      if (result.error || !result.data) return;
      setExtraPages((prev) => [...prev, ...result.data!.transactions]);
      setHasMore(result.data.hasMore);
      setNextCursor(result.data.nextCursor);
    } finally {
      setIsLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [hasMore, nextCursor, isLoadingMore, appliedQuery, searchDraft]);

  const handleUserFilterChange = useCallback(
    (userId: string) => {
      pushQuery(filters, userId === 'all' ? undefined : userId);
    },
    [filters, pushQuery]
  );

  const handleClearBudgetFilter = useCallback(() => {
    const nextFilters = { ...defaultFiltersState };
    setSearchDraft('');
    const tab = searchParams.get('tab');
    const query = buildTransactionsQueryString(nextFilters, selectedUserId);
    const qs = tab && tab !== 'Transactions' ? `${query}&tab=${encodeURIComponent(tab)}` : query;
    startNavigation(() => {
      router.push(`/transactions?${qs}`);
    });
  }, [router, searchParams, selectedUserId, startNavigation]);

  const accountNames = useIdNameMap(accounts);
  const setTransactionEditSeed = useTransactionEditStore((state) => state.setSeed);

  const handleEditTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactionEditSeed(transaction);
      openModal('transaction', transaction.id);
    },
    [openModal, setTransactionEditSeed]
  );

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
    hasMore,
    isLoadingMore,
    loadMore,
    listItems,
    accountNames,
    handleEditTransaction,
    openModal,
    isNavigatingFilters: isNavigating,
  };
}
