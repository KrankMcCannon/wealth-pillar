'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadMoreInvestmentsAction } from '@/features/investments/actions/investment-actions';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

export interface UseInvestmentsListOptions {
  initialHoldings: InvestmentListItem[];
  initialHasMore: boolean;
  initialNextCursor?: string | undefined;
  userScope: string;
}

export function useInvestmentsList({
  initialHoldings,
  initialHasMore,
  initialNextCursor,
  userScope,
}: UseInvestmentsListOptions) {
  const [extraPages, setExtraPages] = useState<InvestmentListItem[]>([]);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreLock = useRef(false);
  const prevScopeRef = useRef(userScope);

  useEffect(() => {
    if (prevScopeRef.current !== userScope) {
      prevScopeRef.current = userScope;
      setExtraPages([]);
      setHasMore(initialHasMore);
      setNextCursor(initialNextCursor);
    }
  }, [userScope, initialHasMore, initialNextCursor]);

  const holdings = useMemo(
    () => [...initialHoldings, ...extraPages],
    [initialHoldings, extraPages]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore || loadMoreLock.current) return;

    loadMoreLock.current = true;
    setIsLoadingMore(true);
    try {
      const result = await loadMoreInvestmentsAction({
        userScope,
        cursor: nextCursor,
      });
      if (result.error || !result.data) return;

      setExtraPages((prev) => [...prev, ...result.data!.holdings]);
      setHasMore(result.data.hasMore);
      setNextCursor(result.data.nextCursor);
    } finally {
      setIsLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [hasMore, nextCursor, isLoadingMore, userScope]);

  return {
    holdings,
    hasMore,
    isLoadingMore,
    loadMore,
  };
}
