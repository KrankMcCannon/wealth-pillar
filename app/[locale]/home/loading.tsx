import {
  DashboardHeaderSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
} from '@/features/dashboard';
import { HomeDashboardMain, PageContainer, SkipToMainLink } from '@/components/layout';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { getTranslations } from 'next-intl/server';

function RecentActivitySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <SkeletonBox height="h-4" width="w-32" variant="medium" />
        <SkeletonBox height="h-4" width="w-14" variant="light" />
      </div>
      <div className="card-soft divide-y divide-border/40 overflow-hidden">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <SkeletonBox
              height="h-8"
              width="w-8"
              variant="medium"
              className="shrink-0 rounded-xl"
            />
            <div className="flex flex-1 flex-col gap-1.5">
              <SkeletonBox height="h-4" width="w-36" variant="medium" className="max-w-[60%]" />
              <SkeletonBox height="h-3" width="w-20" variant="light" />
            </div>
            <SkeletonBox height="h-4" width="w-16" variant="medium" className="shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePageLoading() {
  const t = await getTranslations('HomeContent');

  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{t('skipToContent')}</SkipToMainLink>
      <DashboardHeaderSkeleton />
      <HomeDashboardMain ariaBusy>
        <BalanceSectionSkeleton />
        <BudgetSectionSkeleton />
        <RecurringSeriesSkeleton />
        <RecentActivitySkeleton />
      </HomeDashboardMain>
    </PageContainer>
  );
}
