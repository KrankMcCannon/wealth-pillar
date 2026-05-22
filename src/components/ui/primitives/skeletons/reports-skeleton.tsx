import { Skeleton } from '@/components/ui/skeleton';
import { BottomNavigation, PageContainer, HomeDashboardMain } from '@/components/layout';
import { cn } from '@/lib/utils';
import { STICKY_HEADER_BASE } from '@/lib/utils/ui-constants';
import { headerStyles } from '@/components/layout/theme/header-styles';

export function ReportsSkeleton() {
  return (
    <PageContainer>
      <header className={cn(STICKY_HEADER_BASE, headerStyles.container)}>
        <div className={headerStyles.inner}>
          <div className={headerStyles.slotLeft}>
            <Skeleton className="size-8 rounded-full" />
          </div>
          <div className={headerStyles.slotCenter}>
            <Skeleton className="h-5 w-32 rounded-lg" />
          </div>
          <div className={headerStyles.slotRight}>
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <HomeDashboardMain id="main-reports-skeleton">
        <div className="flex flex-col gap-8 px-4 pt-4">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-36" />
            <div className="rounded-2xl border border-border bg-card p-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border-b border-border py-3 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-lg" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-44" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
          </section>

          <div className="flex flex-col gap-3 pb-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </HomeDashboardMain>

      <BottomNavigation />
    </PageContainer>
  );
}
