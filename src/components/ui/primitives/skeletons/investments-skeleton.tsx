'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer, Header, BottomNavigation } from '@/components/layout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { stitchTransactions } from '@/styles/home-design-foundation';

export function InvestmentsSkeleton() {
  const t = useTranslations('InvestmentsContent');

  return (
    <PageContainer>
      <Header title={t('headerTitle')} showBack />

      <div className={stitchTransactions.tabsStickyBar}>
        <div className="flex flex-col gap-3 px-4 pt-1">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Tabs value="personal" className="pointer-events-none">
            <TabsList className={stitchTransactions.tabsList}>
              <TabsTrigger className={stitchTransactions.tabsTrigger} value="personal">
                {t('tabs.personal')}
              </TabsTrigger>
              <TabsTrigger className={stitchTransactions.tabsTrigger} value="sandbox">
                {t('tabs.sandbox')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main
        id="main-investments"
        className="flex flex-col gap-5 px-4 pb-[max(7rem,calc(5.5rem+env(safe-area-inset-bottom)))] pt-4"
        aria-busy="true"
        aria-live="polite"
        aria-label={t('mainLandmark')}
      >
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/20 bg-card/90 p-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-7 w-40 rounded-full" />
        </div>

        <div className="rounded-2xl border border-border/20 bg-card/90 p-4">
          <Skeleton className="mb-4 h-5 w-36" />
          <Skeleton className="mx-auto size-40 rounded-full" />
          <div className="mt-6 flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>

        <Skeleton className="h-[220px] w-full rounded-2xl" />
        <Skeleton className="h-[220px] w-full rounded-2xl" />

        <div className="flex flex-col overflow-hidden rounded-2xl border border-border/20 bg-card/90">
          <Skeleton className="m-4 h-5 w-28" />
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-t border-border/15 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </main>

      <BottomNavigation />
      <Skeleton
        className="fixed bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] right-4 size-14 rounded-2xl shadow-lg"
        aria-hidden
      />
    </PageContainer>
  );
}

export default InvestmentsSkeleton;
