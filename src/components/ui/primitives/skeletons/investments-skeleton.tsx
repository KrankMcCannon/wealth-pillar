'use client';

import { investmentsStyles } from '@/features/investments/theme/investments-styles';
import { PageContainer, Header, BottomNavigation } from '@/components/layout';
import TabNavigation from '@/components/shared/tab-navigation';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { useTranslations } from 'next-intl';

export function InvestmentsSkeleton() {
  const t = useTranslations('InvestmentsContent');
  const s = investmentsStyles.skeletons;

  return (
    <PageContainer>
      <div className={stitchBudgets.decorWrap}>
        <div className={stitchBudgets.decorBlobTL} />
        <div className={stitchBudgets.decorBlobBR} />
      </div>

      <Header title={t('headerTitle')} showBack showActions={false} />

      <div className="sticky z-30 bg-background/90 pb-3 pt-1 backdrop-blur-sm shadow-sm border-b border-primary/15">
        <div className="px-4 space-y-3">
          <div className="h-10 w-full rounded-xl bg-primary/10 animate-pulse" />
          <TabNavigation
            tabs={[
              { id: 'personal', label: t('tabs.personal') },
              { id: 'sandbox', label: t('tabs.sandbox') },
            ]}
            activeTab="personal"
            onTabChange={() => {}}
            variant="stitch"
          />
        </div>
      </div>

      <main className={transactionStyles.page.main} aria-busy="true" aria-live="polite">
        <div className={investmentsStyles.container}>
          {/* Wealth Header Skeleton */}
          <div className={s.header}>
            <div className="h-3 w-32 rounded bg-primary/20" />
            <div className="h-12 w-64 rounded bg-primary/30" />
            <div className="h-7 w-48 rounded-full bg-primary/20 ring-1 ring-inset ring-primary/20" />
          </div>

          {/* Asset Allocation Card Skeleton */}
          <div className={s.allocation}>
            <div className={s.donut}>
              <div className="flex flex-col items-center">
                <div className="h-3 w-20 rounded bg-primary/20 mb-2" />
                <div className="h-8 w-32 rounded bg-primary/30" />
              </div>
            </div>
            <div className={s.legend}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={s.legendItem}>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-primary/30" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-24 rounded bg-primary/20" />
                      <div className="h-2 w-32 rounded-full bg-primary/10" />
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded bg-primary/20" />
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section Skeleton */}
          <div className={investmentsStyles.charts.grid}>
            <div className={s.chart} />
            <div className={s.chart} />
          </div>

          {/* Investment List Skeleton */}
          <div className={s.list}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={s.listItem}>
                <div>
                  <div className={s.itemPrimary} />
                  <div className={s.itemSecondary} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className={s.itemAmount} />
                  <div className="h-3 w-16 rounded bg-primary/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />

      {/* FAB Placeholder */}
      <div className="fixed bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] right-4 h-14 w-14 rounded-2xl bg-primary/30 animate-pulse shadow-lg" />
    </PageContainer>
  );
}

export default InvestmentsSkeleton;
