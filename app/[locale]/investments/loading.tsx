/**
 * Investments Page Loading State
 * Skeleton that mirrors investments layout (header, portfolio summary, chart)
 * to reduce layout shift and align with other loading states.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';

export default function InvestmentsLoading() {
  return (
    <PageContainer>
      <div className="px-3 sm:px-4 py-4 pb-24 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-4">
          <SkeletonBox height="h-8" width="w-40" variant="medium" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonBox key={i} height="h-20" variant="light" className="rounded-xl" />
            ))}
          </div>
        </div>
        <div className="rounded-xl overflow-hidden">
          <SkeletonBox height="h-[300px]" variant="light" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
          <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
        </div>
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
