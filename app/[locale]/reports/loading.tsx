/**
 * Reports Page Loading State
 * Skeleton che rispecchia la struttura reale della pagina
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';

export default function ReportsLoading() {
  return (
    <PageContainer>
      {/* Header skeleton */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <SkeletonBox height="h-8" width="w-8" variant="light" className="rounded-xl" />
          <SkeletonBox height="h-6" width="w-32" variant="medium" />
        </div>
      </div>

      <div className="px-3 sm:px-4 py-4 pb-20 space-y-4 sm:space-y-6">
        {/* TimeRangeSelector skeleton */}
        <div className="flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonBox
              key={i}
              height="h-7"
              width="w-20"
              variant="light"
              className="rounded-full"
            />
          ))}
        </div>

        {/* SummarySection skeleton — 4 card compatte */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} height="h-20" variant="light" className="rounded-xl" />
          ))}
        </div>

        {/* Charts grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="col-span-1 md:col-span-8">
            <SkeletonBox height="h-[280px]" variant="light" className="rounded-xl" />
          </div>
          <div className="col-span-1 md:col-span-4">
            <SkeletonBox height="h-[280px]" variant="light" className="rounded-xl" />
          </div>
        </div>

        {/* BudgetFlowVisualizer skeleton */}
        <SkeletonBox height="h-[220px]" variant="light" className="rounded-xl" />

        {/* PeriodsSection skeleton */}
        <div className="space-y-4">
          <SkeletonBox height="h-6" width="w-40" variant="medium" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <SkeletonBox key={i} height="h-52" variant="light" className="rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
