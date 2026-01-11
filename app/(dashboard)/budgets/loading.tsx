/**
 * Budgets Page Loading State
 * Shown while budget data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/budgets
 * Follows consistent design system and spacing patterns
 */

import { budgetStyles } from "@/styles/system";
import {
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
} from '@/features/budgets/components';
import { SkeletonBox, SkeletonList } from "@/components/ui/primitives";

export default function BudgetsLoading() {
  return (
    <div className={budgetStyles.page.container}>
      {/* Header Skeleton */}
      <header className={budgetStyles.loading.header}>
        <div className={budgetStyles.loading.title} />
      </header>

      {/* Main Content Loading States */}
      <main className={budgetStyles.page.main}>
        <div className={budgetStyles.loading.content}>
          {/* Budget Selector Skeleton */}
          <BudgetSelectorSkeleton />

          {/* Budget Card Skeleton */}
          <BudgetCardSkeleton />

          {/* Budget Details Skeleton */}
          <div className={budgetStyles.loading.details}>
            <SkeletonBox height="h-12" variant="medium" />
            <SkeletonList count={5} height="h-16" spacing="space-y-2" variant="light" />
          </div>
        </div>
      </main>
    </div>
  );
}
