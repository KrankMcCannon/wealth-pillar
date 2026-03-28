'use client';

/**
 * usePaginatedTransactions Hook
 *
 * Manages client-side pagination over the full filtered transaction list.
 * When the user navigates to a page whose data is not yet loaded, it fetches
 * more transactions from the server on demand before updating the page.
 *
 * Design:
 * - filteredTransactions: the complete filtered list (client-side)
 * - pageSize: transactions per display page (default 50)
 * - totalServerCount: total count from server (used to know if more exist)
 * - hasMoreFromServer: whether the server has pages not yet fetched
 * - onLoadMore: callback that fetches more transactions from the server
 * - onNewTransactions: callback to persist newly loaded transactions in the store
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Transaction } from '@/lib/types';

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export interface UsePaginatedTransactionsOptions {
  filteredTransactions: Transaction[];
  allLoadedCount: number;
  totalServerCount: number;
  hasMoreFromServer: boolean;
  pageSize?: number;
  loadMore: (offset: number, limit: number) => Promise<{ data: Transaction[]; hasMore: boolean }>;
  onNewTransactions: (transactions: Transaction[]) => void;
}

export interface UsePaginatedTransactionsReturn {
  currentPage: number;
  totalPages: number;
  currentPageItems: Transaction[];
  isChangingPage: boolean;
  pageError: string | null;
  goToPage: (page: number) => Promise<void>;
  nextPage: () => Promise<void>;
  prevPage: () => Promise<void>;
  firstPage: () => Promise<void>;
  lastPage: () => Promise<void>;
  resetPage: () => void;
}

export function usePaginatedTransactions({
  filteredTransactions,
  allLoadedCount,
  totalServerCount,
  hasMoreFromServer,
  pageSize = 30,
  loadMore,
  onNewTransactions,
}: UsePaginatedTransactionsOptions): UsePaginatedTransactionsReturn {
  const [currentPage, setCurrentPage] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  // Stable refs so callbacks don't re-create on every render
  const hasMoreRef = useRef(hasMoreFromServer);
  const allLoadedCountRef = useRef(allLoadedCount);

  useEffect(() => {
    hasMoreRef.current = hasMoreFromServer;
  }, [hasMoreFromServer]);

  useEffect(() => {
    allLoadedCountRef.current = allLoadedCount;
  }, [allLoadedCount]);

  const totalFiltered = filteredTransactions.length;

  /**
   * Total display pages is based on the larger of:
   * - filtered transactions already available
   * - server total (when no filters, gives true page count)
   * This avoids showing "Page 1 of 1" when server has more data.
   */
  const effectiveTotal = Math.max(
    totalFiltered,
    hasMoreFromServer ? totalServerCount : totalFiltered
  );
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  // Slice the current page from filtered transactions
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const currentPageItems = filteredTransactions.slice(start, end);

  const goToPage = useCallback(
    async (page: number) => {
      const clamped = Math.max(1, Math.min(page, totalPages));
      setPageError(null);

      // Check if we need to fetch more from server
      const neededCount = clamped * pageSize;
      if (neededCount > allLoadedCountRef.current && hasMoreRef.current) {
        setIsChangingPage(true);
        try {
          const toLoad = neededCount - allLoadedCountRef.current;
          const result = await loadMore(allLoadedCountRef.current, Math.max(toLoad, pageSize));
          onNewTransactions(result.data);
          hasMoreRef.current = result.hasMore;
          allLoadedCountRef.current += result.data.length;
        } catch (err) {
          setPageError(err instanceof Error ? err.message : 'Failed to load transactions');
          setIsChangingPage(false);
          return;
        }
        setIsChangingPage(false);
      }

      setCurrentPage(clamped);
    },
    [totalPages, pageSize, loadMore, onNewTransactions]
  );

  const resetPage = useCallback(() => {
    setCurrentPage(1);
    setPageError(null);
  }, []);

  const nextPage = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage]);
  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  return {
    currentPage,
    totalPages,
    currentPageItems,
    isChangingPage,
    pageError,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    resetPage,
  };
}
