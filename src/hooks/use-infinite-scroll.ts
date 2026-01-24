'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  /** Initial items from server */
  initialItems: T[];
  /** Total count of items */
  totalCount: number;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Number of items per page */
  pageSize?: number;
  /** Function to load more items */
  loadMore: (offset: number, limit: number) => Promise<{ data: T[]; hasMore: boolean }>;
  /** Threshold in pixels before bottom to trigger load */
  threshold?: number;
}

interface UseInfiniteScrollReturn<T> {
  /** All items (initial + loaded) */
  items: T[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether there are more items to load */
  hasMore: boolean;
  /** Function to manually load more */
  loadMoreItems: () => Promise<void>;
  /** Ref to attach to sentinel element */
  sentinelRef: React.RefCallback<HTMLDivElement>;
}

/**
 * useInfiniteScroll Hook
 * 
 * Provides infinite scroll functionality using Intersection Observer.
 * Compatible with TailwindCSS v4 and shadcn/ui.
 */
export function useInfiniteScroll<T>({
  initialItems,
  totalCount,
  hasMore: initialHasMore,
  pageSize = 50,
  loadMore,
  threshold = 200,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(initialHasMore);

  const offsetRef = useRef(initialItems.length);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Update items when initialItems change (e.g., server refresh)
  useEffect(() => {
    setItems(initialItems);
    offsetRef.current = initialItems.length;
    setHasMore(initialHasMore);
  }, [initialItems, initialHasMore]);

  const loadMoreItems = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await loadMore(offsetRef.current, pageSize);

      setItems(prev => [...prev, ...result.data]);
      offsetRef.current += result.data.length;
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more items');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, loadMore, pageSize]);

  // Sentinel ref callback for Intersection Observer
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (!node || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreItems();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observerRef.current.observe(node);
  }, [hasMore, isLoading, loadMoreItems, threshold]);

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    items,
    isLoading,
    error,
    hasMore,
    loadMoreItems,
    sentinelRef,
  };
}
