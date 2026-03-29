/**
 * Budgets Page Loading State
 * Matches accounts/reports shell: PageContainer, main rhythm, BottomNavigation
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { BudgetSelectorSkeleton, BudgetCardSkeleton } from '@/features/budgets/components';
import { SkeletonBox, SkeletonList } from '@/components/ui/primitives';
import { budgetStyles, reportsStyles } from '@/styles/system';

export default function BudgetsLoading() {
  return (
    <PageContainer>
      <header className={budgetStyles.loading.header}>
        <div className={budgetStyles.loading.title} />
      </header>

      <main className={reportsStyles.main.container}>
        <div className="rounded-2xl border border-primary/15 bg-card/90 p-3 shadow-sm ring-1 ring-black/4 dark:ring-white/6 sm:p-4 md:p-5">
          <div className="mb-4 space-y-2">
            <SkeletonBox height="h-4" variant="medium" className="max-w-[40%]" />
            <SkeletonBox height="h-3" variant="light" className="max-w-[65%]" />
          </div>
          <div className={budgetStyles.loading.content}>
            <BudgetSelectorSkeleton />
            <BudgetCardSkeleton />
            <div className={budgetStyles.loading.details}>
              <SkeletonBox height="h-12" variant="medium" />
              <SkeletonList count={5} height="h-16" spacing="space-y-2" variant="light" />
            </div>
          </div>
        </div>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
