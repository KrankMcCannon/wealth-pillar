/**
 * Budgets Page Loading State
 * Shown while budget data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/budgets
 * Follows consistent design system and spacing patterns
 */

import { budgetStyles } from '@/features/budgets/theme/budget-styles';
import {
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
} from '@/features/budgets/components';

export default function BudgetsLoading() {
  return (
    <div className={budgetStyles.page.container}>
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
      </header>

      {/* Main Content Loading States */}
      <main className={budgetStyles.page.main}>
        <div className="space-y-6 px-4 py-6">
          {/* Budget Selector Skeleton */}
          <BudgetSelectorSkeleton />

          {/* Budget Card Skeleton */}
          <BudgetCardSkeleton />

          {/* Budget Details Skeleton */}
          <div className="space-y-4">
            <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
