/**
 * Reports Page Loading State
 * Skeleton that mirrors reports layout (header, summary cards, chart area)
 * to reduce layout shift and align with other loading states.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { reportsStyles } from '@/features/reports/theme/reports-styles';

export default function ReportsLoading() {
  return (
    <PageContainer>
      <div className={reportsStyles.main.container}>
        <div className={reportsStyles.header.container}>
          <div className={reportsStyles.header.title}>
            <SkeletonBox height="h-8" width="w-48" variant="medium" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox height="h-10" width="w-24" variant="light" />
            <SkeletonBox height="h-10" width="w-28" variant="light" />
          </div>
        </div>
        <div className={reportsStyles.summary.grid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} height="h-28" variant="light" className="rounded-xl" />
          ))}
        </div>
        <div className={reportsStyles.charts.container}>
          <SkeletonBox height="h-[250px]" variant="light" className="rounded-xl" />
        </div>
        <div className={reportsStyles.charts.container}>
          <SkeletonBox height="h-[200px]" variant="light" className="rounded-xl" />
        </div>
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
