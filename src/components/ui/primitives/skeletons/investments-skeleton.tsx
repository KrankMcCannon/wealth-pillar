'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { PageContainer, Header, BottomNavigation } from '@/components/layout';
import TabNavigation from '@/components/shared/tab-navigation';
import { useTranslations } from 'next-intl';

export function InvestmentsSkeleton() {
  const t = useTranslations('InvestmentsContent');

  return (
    <PageContainer>
      <Header title={t('headerTitle')} showBack showActions={false} />

      <div className="sticky z-30 border-b border-border bg-background/90 pb-3 pt-1 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col gap-3 px-4">
          <Skeleton className="h-10 w-full rounded-xl" />
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

      <main className="flex-1 px-4 pb-24 pt-4" aria-busy="true" aria-live="polite">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-3 py-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-7 w-48 rounded-full" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Skeleton className="size-40 rounded-full" />
              <div className="flex w-full flex-col gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-3 rounded-full" />
                      <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-2 w-32 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-20" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>

          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNavigation />
      <Skeleton className="fixed bottom-[max(5.5rem,calc(4.5rem+env(safe-area-inset-bottom)))] right-4 size-14 rounded-2xl shadow-lg" />
    </PageContainer>
  );
}

export default InvestmentsSkeleton;
