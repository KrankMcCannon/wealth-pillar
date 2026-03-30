/**
 * Investments Page Loading State
 * Shell allineata a transazioni: Header + controlsCard (UserSelector + tab) + main.
 */

import { BottomNavigation, PageContainer } from '@/components/layout';
import { headerStyles } from '@/components/layout/theme/header-styles';
import { SkeletonBox } from '@/components/ui/primitives/skeleton-box';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { transactionStyles } from '@/styles/system';
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
    <PageContainer className={transactionStyles.page.container}>
      <InvestmentsHeaderSkeleton />
      <div className={transactionStyles.layout.controlsStack}>
        <div className={transactionStyles.layout.controlsCard}>
          <UserSelectorSkeleton />
          <div className={`${transactionStyles.tabNavigation.wrapper} flex gap-2`} aria-hidden>
            <SkeletonBox height="h-10" width="w-[45%]" variant="medium" className="rounded-lg" />
            <SkeletonBox height="h-10" width="w-[45%]" variant="light" className="rounded-lg" />
          </div>
        </div>
      </div>
      <main className={transactionStyles.page.main} aria-busy="true" aria-label={t('mainLandmark')}>
        <div className="flex flex-col gap-4">
          <SkeletonBox height="h-36" width="w-full" variant="light" className="rounded-xl" />
          <SkeletonBox height="h-[300px]" width="w-full" variant="light" className="rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
            <SkeletonBox height="h-64" variant="light" className="rounded-xl" />
          </div>
        </div>
      </main>
      <BottomNavigation />
    </PageContainer>
  );
}
