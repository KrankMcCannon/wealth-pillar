import { useState, useMemo, useCallback, useTransition, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSearchParams } from 'next/navigation';
import { useIdNameMap } from '@/hooks';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { clearAdvancedFilters, clearAllFilters } from '../components/filters/filter-helpers';
import type { TransactionFiltersState } from '@/server/use-cases/transactions/transaction.logic';
import type { Transaction, Budget, Account } from '@/lib/types';
import { parseReturnTo, withReturnTo } from '@/lib/navigation/return-to';
import { useModalState, useTabState, type ModalType } from '@/lib/navigation/url-state';
import { useRouter } from '@/i18n/routing';
import { toast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { useTransactionEditStore } from '../stores/transaction-edit-store';
import {
  mergeOptimisticTransactions,
  useOptimisticTransactionStore,
} from '../stores/optimistic-transactions';
import { loadMoreTransactionsAction } from '../actions/transaction-actions';
import type { AppliedTransactionsQuery } from '@/server/use-cases/pages/transactions-page.use-case';
import {
  appliedQueryToFiltersState,
  appliedQueryToListQuery,
  buildTransactionsQueryString,
  matchesAppliedQuery,
} from '../utils/transactions-query';

function transactionsHref(qs: string, searchParams: URLSearchParams): string {
  const params = new URLSearchParams(qs);
  for (const key of ['recurringStatus', 'recurringSearch', 'recurringAccount']) {
    const value = searchParams.get(key);
    if (value && !params.has(key)) params.set(key, value);
  }
  const href = `/transactions?${params.toString()}`;
  const from = parseReturnTo(searchParams);
  return from ? withReturnTo(href, from) : href;
}

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
  loadMoreFailed: boolean;
  loadMore: () => Promise<void>;
  listItems: Transaction[];
  accountNames: Record<string, string>;
  handleEditTransaction: (transaction: Transaction) => void;
  openModal: (type: ModalType, id?: string) => void;
  isNavigatingFilters: boolean;
  handleClearFilters: () => void;
  applyAdvancedFilters: (filters: TransactionFiltersState) => void;
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
  const t = useTranslations('TransactionsContent');
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();
  const queryKey = useMemo(() => buildQueryKey(appliedQuery), [appliedQuery]);
  const [pagination, setPagination] = useState({
    queryKey,
    generation: 0,
    extraPages: [] as Transaction[],
    hasMore: initialHasMore,
    nextCursor: initialNextCursor,
    isLoadingMore: false,
    loadMoreFailed: false,
  });
  // Adjust this hook's state before rendering children when the server query changes.
  // A pending request retains its old key and cannot append into the new query.
  if (pagination.queryKey !== queryKey) {
    setPagination({
      queryKey,
      generation: pagination.generation + 1,
      extraPages: [],
      hasMore: initialHasMore,
      nextCursor: initialNextCursor,
      isLoadingMore: false,
      loadMoreFailed: false,
    });
  }
  const { extraPages, hasMore, nextCursor, isLoadingMore, loadMoreFailed, generation } = pagination;
  const loadMoreLock = useRef<number | null>(null);

  const optimisticOverlay = useOptimisticTransactionStore(
    useShallow((state) => ({
      pending: state.pending,
      updated: state.updated,
      deleted: state.deleted,
    }))
  );
  const pruneCommitted = useOptimisticTransactionStore((state) => state.pruneCommitted);

  const { openModal } = useModalState();
  const { activeTab: requestedTab, setActiveTab } = useTabState('Transactions');
  const activeTab = requestedTab === 'Recurrent' ? 'Recurrent' : 'Transactions';

  const urlFilters = useMemo(
    () => appliedQueryToFiltersState(appliedQuery, appliedQuery.q ?? ''),
    [appliedQuery]
  );
  const [searchState, setSearchState] = useState({
    urlQuery: urlFilters.searchQuery,
    draft: urlFilters.searchQuery,
    skipSync: false,
  });
  if (searchState.urlQuery !== urlFilters.searchQuery) {
    setSearchState({
      urlQuery: urlFilters.searchQuery,
      draft: urlFilters.searchQuery,
      skipSync: false,
    });
  }
  const searchDraft = searchState.draft;
  const setSearchDraft = useCallback((draft: string) => {
    setSearchState((current) => ({ ...current, draft, skipSync: false }));
  }, []);

  const serverList = useMemo(() => {
    const merged = [...serverTransactions, ...extraPages];
    const seen = new Set<string>();
    return merged.filter((transaction) => {
      if (!transaction?.id) return true;
      if (seen.has(transaction.id)) return false;
      seen.add(transaction.id);
      return true;
    });
  }, [serverTransactions, extraPages]);

  useEffect(() => {
    pruneCommitted(serverList);
  }, [serverList, pruneCommitted]);

  const filters = useMemo(
    () => ({
      ...urlFilters,
      searchQuery: searchDraft,
      ...(searchParams.get('budget') ? { budgetId: searchParams.get('budget')! } : {}),
    }),
    [urlFilters, searchDraft, searchParams]
  );

  const listItems = useMemo(
    () =>
      mergeOptimisticTransactions(serverList, optimisticOverlay, (transaction) =>
        matchesAppliedQuery(transaction, appliedQuery, searchDraft, accounts)
      ),
    [serverList, optimisticOverlay, appliedQuery, searchDraft, accounts]
  );

  const debouncedDraft = useDebouncedValue(searchState, 300);

  const selectedUserId = appliedQuery.user;

  const selectedBudget = useMemo(() => {
    const budgetId = searchParams.get('budget');
    if (!budgetId) return null;
    return budgets.find((b) => b.id === budgetId) || null;
  }, [searchParams, budgets]);

  const requestedQuery = useRef<{
    filters: TransactionFiltersState;
    userId: string | undefined;
    budget: string | null;
  } | null>(null);
  const appliedBudgetId = searchParams.get('budget');
  useEffect(() => {
    requestedQuery.current = null;
  }, [queryKey, appliedBudgetId]);

  const pushQuery = useCallback(
    (nextFilters: TransactionFiltersState, userId?: string, budgetOverride?: string | null) => {
      const query = buildTransactionsQueryString(nextFilters, userId);
      const budget = budgetOverride === undefined ? searchParams.get('budget') : budgetOverride;
      requestedQuery.current = { filters: nextFilters, userId, budget };
      // Every navigation includes the current search. Supersede any debounce
      // still based on the preceding server query while its response is pending.
      setSearchState((current) => ({ ...current, draft: nextFilters.searchQuery, skipSync: true }));
      const tab = searchParams.get('tab');
      const parts = [query];
      if (budget) parts.push(`budget=${encodeURIComponent(budget)}`);
      if (tab && tab !== 'Transactions') parts.push(`tab=${encodeURIComponent(tab)}`);
      const qs = parts.filter(Boolean).join('&');
      startNavigation(() => {
        router.push(transactionsHref(qs, searchParams));
      });
    },
    [router, searchParams, startNavigation]
  );

  useEffect(() => {
    if (searchState.skipSync || debouncedDraft !== searchState) return;
    if (debouncedDraft.urlQuery !== urlFilters.searchQuery) return;
    const debouncedSearch = debouncedDraft.draft;
    const trimmed = debouncedSearch.trim();
    const requested = requestedQuery.current;
    const targetSearch = (requested?.filters.searchQuery ?? appliedQuery.q ?? '').trim();
    if (trimmed === targetSearch) return;
    pushQuery(
      { ...(requested?.filters ?? urlFilters), searchQuery: debouncedSearch },
      requested ? requested.userId : selectedUserId,
      requested?.budget
    );
  }, [debouncedDraft, appliedQuery.q, urlFilters, pushQuery, selectedUserId, searchState]);

  const setFilters: React.Dispatch<React.SetStateAction<TransactionFiltersState>> = useCallback(
    (updater) => {
      const base = filters;
      const next = typeof updater === 'function' ? updater(base) : updater;

      if (next.searchQuery !== searchDraft) {
        setSearchDraft(next.searchQuery);
      }

      const nonSearchChanged =
        next.type !== urlFilters.type ||
        next.dateRange !== urlFilters.dateRange ||
        next.categoryKey !== urlFilters.categoryKey ||
        next.accountId !== urlFilters.accountId ||
        next.budgetId !== filters.budgetId ||
        Boolean(next.reserve) !== Boolean(urlFilters.reserve) ||
        (next.startDate ?? null) !== (urlFilters.startDate ?? null) ||
        (next.endDate ?? null) !== (urlFilters.endDate ?? null) ||
        JSON.stringify(next.categoryKeys ?? []) !== JSON.stringify(urlFilters.categoryKeys ?? []);

      if (nonSearchChanged) {
        pushQuery(next, selectedUserId, next.budgetId ?? null);
      }
    },
    [filters, urlFilters, searchDraft, pushQuery, selectedUserId, setSearchDraft]
  );

  const loadMore = useCallback(async () => {
    if (searchDraft.trim() !== (appliedQuery.q ?? '').trim() || isNavigating) return;
    if (!hasMore || !nextCursor || isLoadingMore || loadMoreLock.current === generation) return;
    loadMoreLock.current = generation;
    setPagination((current) => ({ ...current, isLoadingMore: true, loadMoreFailed: false }));
    try {
      const listQuery = appliedQueryToListQuery(appliedQuery, searchDraft);
      const result = await loadMoreTransactionsAction({
        query: listQuery,
        cursor: nextCursor,
      });
      if (result.error || !result.data) {
        setPagination((current) =>
          current.generation === generation ? { ...current, loadMoreFailed: true } : current
        );
        toast({ title: t('loadMoreError'), variant: 'destructive' });
        return;
      }
      const page = result.data;
      setPagination((current) =>
        current.generation === generation
          ? {
              ...current,
              extraPages: [...current.extraPages, ...page.transactions],
              hasMore: page.hasMore,
              nextCursor: page.nextCursor,
            }
          : current
      );
    } catch {
      setPagination((current) =>
        current.generation === generation ? { ...current, loadMoreFailed: true } : current
      );
      toast({ title: t('loadMoreError'), variant: 'destructive' });
    } finally {
      setPagination((current) =>
        current.generation === generation ? { ...current, isLoadingMore: false } : current
      );
      if (loadMoreLock.current === generation) loadMoreLock.current = null;
    }
  }, [hasMore, nextCursor, isLoadingMore, appliedQuery, searchDraft, t, generation, isNavigating]);

  const handleUserFilterChange = useCallback(
    (userId: string) => {
      pushQuery(filters, userId === 'all' ? undefined : userId);
    },
    [filters, pushQuery]
  );

  const handleClearBudgetFilter = useCallback(() => {
    pushQuery(clearAdvancedFilters(filters), selectedUserId, null);
  }, [pushQuery, selectedUserId, filters]);

  const handleClearFilters = useCallback(() => {
    pushQuery(clearAllFilters(filters), selectedUserId, null);
  }, [filters, selectedUserId, pushQuery]);

  const applyAdvancedFilters = useCallback(
    (next: TransactionFiltersState) => {
      pushQuery(next, selectedUserId, next.budgetId ?? null);
    },
    [pushQuery, selectedUserId]
  );

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
    loadMoreFailed,
    loadMore,
    listItems,
    accountNames,
    handleEditTransaction,
    openModal,
    isNavigatingFilters: isNavigating || searchDraft.trim() !== (appliedQuery.q ?? '').trim(),
    handleClearFilters,
    applyAdvancedFilters,
  };
}
