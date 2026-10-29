'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { HomeDashboardMain } from '@/components/layout';
import { PageTabsSticky } from '@/components/shared/page-tabs';
import { useTranslations } from 'next-intl';
import { stitchHome, stitchInvestments } from '@/styles/home-design-foundation';

export function InvestmentsSkeleton() {
  const t = useTranslations('InvestmentsContent');

  return (
    <>
      <PageTabsSticky
        value="personal"
        ariaLabel={t('mainLandmark')}
        className="pointer-events-none"
        items={[
          { value: 'personal', label: t('tabs.personal') },
          { value: 'sandbox', label: t('tabs.sandbox') },
        ]}
        leading={<Skeleton className="h-8 w-48 rounded-full" />}
      />

      <HomeDashboardMain id="main-investments" ariaBusy aria-label={t('mainLandmark')}>
        <div className={stitchInvestments.mainStack}>
          <div className={stitchInvestments.heroSection}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>

          <section className={stitchInvestments.chartCard}>
            <div className={stitchInvestments.chartCardHeader}>
              <Skeleton className="h-3 w-24" />
            </div>
            <div className={stitchInvestments.chartCardContent}>
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
          </section>

          <section className={stitchHome.scanSection}>
            <Skeleton className="h-4 w-28" />
            <ul className={stitchHome.plainList}>
              {[1, 2, 3, 4].map((i) => (
                <li key={i} className={stitchInvestments.holdingRow}>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-16 shrink-0" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </HomeDashboardMain>
    </>
  );
}

export default InvestmentsSkeleton;
