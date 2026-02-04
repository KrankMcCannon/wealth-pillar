import { useState, useMemo, useCallback } from 'react';
import { toDateTime } from '@/lib/utils';
import type { EnrichedBudgetPeriod } from '@/server/services/report-period.service';

/**
 * Extended type including optional transaction count sometimes appended by server/parent
 */
export type ReportsBudgetPeriod = EnrichedBudgetPeriod & { transactionCount?: number };

interface UseBudgetPeriodsOptions {
  periods: ReportsBudgetPeriod[];
  initialVisibleCount?: number;
  incrementCount?: number;
}

export function useBudgetPeriods({
  periods,
  initialVisibleCount = 5,
  incrementCount = 5,
}: UseBudgetPeriodsOptions) {
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  // Sort by start_date descending (most recent first)
  const sortedPeriods = useMemo(() => {
    return [...periods].sort((a, b) => {
      const dateA = toDateTime(a.start_date)?.toMillis() || 0;
      const dateB = toDateTime(b.start_date)?.toMillis() || 0;
      return dateB - dateA;
    });
  }, [periods]);

  // Get visible periods subset
  const visiblePeriods = useMemo(() => {
    return sortedPeriods.slice(0, visibleCount);
  }, [sortedPeriods, visibleCount]);

  const hasMore = visibleCount < sortedPeriods.length;
  const remainingCount = sortedPeriods.length - visibleCount;

  // Load more handler
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + incrementCount);
  }, [incrementCount]);

  // Toggle period expansion
  const togglePeriod = useCallback((periodId: string) => {
    setExpandedPeriods((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(periodId)) {
        newSet.delete(periodId);
      } else {
        newSet.add(periodId);
      }
      return newSet;
    });
  }, []);

  const isExpanded = useCallback(
    (periodId: string) => {
      return expandedPeriods.has(periodId);
    },
    [expandedPeriods]
  );

  return {
    sortedPeriods,
    visiblePeriods,
    hasMore,
    remainingCount,
    handleLoadMore,
    togglePeriod,
    isExpanded,
    visibleCount, // Exposed if needed
  };
}
