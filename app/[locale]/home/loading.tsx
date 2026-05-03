import {
  BottomNavigation,
  HomeDashboardMain,
  PageContainer,
  SkipToMainLink,
} from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { stitchHome } from '@/styles/home-design-foundation';
import { getTranslations } from 'next-intl/server';

function HomeHeaderSkeleton() {
  return (
    <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
      <div className={headerStyles.inner}>
        <div className={headerStyles.slotLeft}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
        <div className={headerStyles.slotCenter}>
          <SkeletonBox height="h-5" width="w-36" variant="medium" />
        </div>
        <div className={headerStyles.slotRight}>
          <SkeletonBox height="h-9" width="w-9" variant="light" className="rounded-full" />
        </div>
      </div>
    </header>
  );
}

function BalanceBlockSkeleton() {
  return (
    <section className={stitchHome.balanceSection} aria-hidden>
      <div className="flex gap-2 overflow-hidden pb-1">
        <SkeletonBox
          height="h-[4.125rem]"
          width="w-[8.75rem]"
          variant="light"
          className="shrink-0 rounded-lg"
        />
        <SkeletonBox
          height="h-[4.125rem]"
          width="w-[8.75rem]"
          variant="light"
          className="shrink-0 rounded-lg"
        />
      </div>
      <div className="mt-2 flex items-center gap-3 rounded-b-2xl border-t border-[#3359c5]/20 bg-[#11295f]/50 px-2.5 py-3.5">
        <SkeletonBox height="h-12" width="w-12" variant="light" className="shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBox height="h-2.5" width="w-24" variant="light" />
          <SkeletonBox height="h-8" width="w-40" variant="medium" className="max-w-full" />
        </div>
        <SkeletonBox height="h-10" width="w-16" variant="light" className="shrink-0 rounded-full" />
      </div>
    </section>
  );
}

function BudgetBlockSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-2">
          <SkeletonBox height="h-5" width="w-40" variant="medium" />
          <SkeletonBox height="h-3" width="w-28" variant="light" />
        </div>
        <SkeletonBox height="h-6" width="w-20" variant="light" className="shrink-0 rounded-full" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className={stitchHome.budgetUserCard}>
            <div className="flex items-center gap-3">
              <SkeletonBox
                height="h-11"
                width="w-11"
                variant="light"
                className="shrink-0 rounded-full"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBox height="h-4" width="w-32" variant="light" />
                <SkeletonBox height="h-3" width="w-24" variant="light" />
                <SkeletonBox height="h-2" width="w-full" variant="light" className="rounded-full" />
              </div>
              <SkeletonBox height="h-6" width="w-14" variant="medium" className="shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RecurringBlockSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBox height="h-5" width="w-44" variant="medium" />
        <SkeletonBox height="h-8" width="w-8" variant="light" className="rounded-full" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={stitchHome.listRow}>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SkeletonBox
                height="h-9"
                width="w-9"
                variant="light"
                className="shrink-0 rounded-lg"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <SkeletonBox height="h-4" width="w-[70%]" variant="light" />
                <SkeletonBox height="h-3" width="w-20" variant="light" />
              </div>
            </div>
            <SkeletonBox height="h-4" width="w-16" variant="medium" className="shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RecentActivityBlockSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <div className="mb-3 flex items-center justify-between">
        <SkeletonBox height="h-5" width="w-36" variant="medium" />
        <SkeletonBox height="h-4" width="w-14" variant="light" />
      </div>
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className={stitchHome.listRow}>
            <SkeletonBox height="h-8" width="w-8" variant="light" className="shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBox height="h-4" width="w-[60%]" variant="light" />
              <SkeletonBox height="h-3" width="w-20" variant="light" />
            </div>
            <SkeletonBox height="h-4" width="w-16" variant="medium" className="shrink-0" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function HomePageLoading() {
  const t = await getTranslations('HomeContent');

  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{t('skipToContent')}</SkipToMainLink>
      <HomeHeaderSkeleton />
      <HomeDashboardMain ariaBusy>
        <BalanceBlockSkeleton />
        <BudgetBlockSkeleton />
        <RecurringBlockSkeleton />
        <RecentActivityBlockSkeleton />
      </HomeDashboardMain>
      <BottomNavigation />
    </PageContainer>
  );
}
