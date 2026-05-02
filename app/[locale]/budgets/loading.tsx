/**
 * Budgets Page Loading State — Stitch-style shell
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox, SkeletonList } from '@/components/ui/primitives';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { budgetStyles } from '@/styles/system';

export default function BudgetsLoading() {
  return (
    <PageContainer>
      <header className={budgetStyles.loading.header}>
        <div className={budgetStyles.loading.title} />
      </header>

      <main className="flex flex-col gap-4 px-4 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))] pt-4">
        <SkeletonBox height="h-8" variant="medium" className="max-w-[55%]" />
        <SkeletonBox height="h-4" variant="light" className="max-w-[85%]" />

        <div className={`${stitchBudgets.heroSection} animate-pulse`}>
          <SkeletonBox height="h-3" variant="light" className="max-w-[40%]" />
          <SkeletonBox height="h-10" variant="medium" className="mt-3 max-w-[70%]" />
          <div className="mt-4 flex gap-8 border-t border-[#3359c5]/20 pt-4">
            <div className="flex-1 space-y-2">
              <SkeletonBox height="h-3" variant="light" className="max-w-[50%]" />
              <SkeletonBox height="h-6" variant="medium" className="max-w-[80%]" />
            </div>
            <div className="flex-1 space-y-2">
              <SkeletonBox height="h-3" variant="light" className="max-w-[50%]" />
              <SkeletonBox height="h-6" variant="medium" className="max-w-[80%]" />
            </div>
          </div>
        </div>

        <SkeletonBox height="h-12" variant="light" className="w-full rounded-lg" />

        <SkeletonList count={4} height="h-32" spacing="space-y-3" variant="light" />
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
