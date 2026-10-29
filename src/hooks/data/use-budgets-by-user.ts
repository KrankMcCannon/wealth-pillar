import { useMemo } from 'react';
import type { UserBudgetSummary } from '@/lib/types';

/**
 * Display-only hook: budget summaries must be precomputed server-side.
 */
interface UseBudgetsByUserOptions {
  precalculatedData: Record<string, UserBudgetSummary>;
}

interface UseBudgetsByUserReturn {
  budgetsByUser: Record<string, UserBudgetSummary>;
  userIds: string[];
  isLoading: boolean;
}

export function useBudgetsByUser({
  precalculatedData,
}: UseBudgetsByUserOptions): UseBudgetsByUserReturn {
  const budgetsByUser = useMemo(() => precalculatedData ?? {}, [precalculatedData]);
  const userIds = useMemo(() => Object.keys(budgetsByUser), [budgetsByUser]);

  return { budgetsByUser, userIds, isLoading: false };
}
