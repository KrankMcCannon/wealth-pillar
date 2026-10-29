import type { BudgetProgress, UserBudgetSummary } from '@/lib/types';

export type BudgetCategoryStatus = 'onTrack' | 'fixed' | 'over';

export function deriveBudgetStatus(remaining: number, percentage: number): BudgetCategoryStatus {
  if (remaining < 0 || percentage > 100) return 'over';
  if (percentage >= 100 && remaining >= 0) return 'fixed';
  return 'onTrack';
}

export function getBudgetCategoryStatus(progress: BudgetProgress): BudgetCategoryStatus {
  return deriveBudgetStatus(progress.remaining, progress.percentage);
}

/** Client-side rollup status — do not add `aggregateStatus` to the server DTO. */
export function deriveUserBudgetStatus(
  summary: Pick<UserBudgetSummary, 'totalRemaining' | 'overallPercentage'>
): BudgetCategoryStatus {
  return deriveBudgetStatus(summary.totalRemaining, summary.overallPercentage);
}
