'use client';

import { useCallback, useEffect, type RefObject } from 'react';

export interface UseInfiniteScrollSentinelOptions {
  enabled: boolean;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

export function useInfiniteScrollSentinel(
  sentinelRef: RefObject<HTMLElement | null>,
  {
    enabled,
    hasMore,
    isLoading,
    onLoadMore,
    rootMargin = '120px',
  }: UseInfiniteScrollSentinelOptions
): void {
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasMore && !isLoading) {
        onLoadMore();
      }
    },
    [hasMore, isLoading, onLoadMore]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin,
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, handleIntersect, rootMargin, sentinelRef]);
}
