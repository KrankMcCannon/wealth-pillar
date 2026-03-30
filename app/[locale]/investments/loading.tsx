/**
 * Investments Page Loading State
 * Shell allineata a Header + UserSelector + main (riduce CLS vs contenuto reale).
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { getTranslations } from 'next-intl/server';

function InvestmentsHeaderSkeleton() {
  return (
    <header className={headerStyles.container} aria-busy="true">
      <div className={headerStyles.inner}>
        <div className={headerStyles.left}>
          <div
            className={`${headerStyles.subpage.backButton} bg-muted/40 animate-pulse pointer-events-none`}
            aria-hidden
          />
          <SkeletonBox height="h-5" width="w-36" variant="medium" className="max-w-[55vw]" />
        </div>
        <div className={headerStyles.actions.wrapper}>
          <SkeletonBox
            height="h-10"
            width="w-10"
            variant="light"
            className="shrink-0 rounded-full"
          />
        </div>
      </div>
    </header>
  );
}

export default async function InvestmentsLoading() {
  const t = await getTranslations('InvestmentsContent');

  return (
    <PageContainer>
      <div className="flex-1">
        <InvestmentsHeaderSkeleton />
        <UserSelectorSkeleton />
        <main
          className="px-3 pb-24 md:pb-8 space-y-6 max-w-7xl mx-auto pt-2"
          aria-busy="true"
          aria-label={t('mainLandmark')}
        >
          <div className="flex flex-col gap-4">
            <SkeletonBox height="h-8" width="w-40" variant="medium" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonBox key={i} height="h-20" variant="light" className="rounded-xl" />
              ))}
            </div>
          </div>
          <div className="rounded-xl overflow-hidden">
            <SkeletonBox height="h-[300px]" variant="light" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
            <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
          </div>
        </main>
      </div>
      <BottomNavigation />
    </PageContainer>
  );
}
