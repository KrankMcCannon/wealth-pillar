import { Skeleton } from '@/components/ui/skeleton';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchReports } from '@/styles/home-design-foundation';

export function ReportsSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className={stitchReports.stickyFilterBar}>
        <div className={stitchReports.chipRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-9 w-20 shrink-0 rounded-full" />
          ))}
        </div>
      </div>

      <HomeDashboardMain id="main-reports-skeleton">
        <div className={stitchReports.sectionStack}>
          <Skeleton className="h-11 w-full rounded-full" />

          <Skeleton className="h-40 w-full rounded-xl" />
          <div className={stitchReports.savingsGrid}>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-44" />
            <div className="rounded-xl border border-border/25 bg-card/90 p-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 border-b border-border/25 py-3 last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <div className={stitchReports.snapshotGrid}>
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className={stitchReports.accountCard}>
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className={stitchReports.accountMetricGrid}>
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </div>
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </section>
        </div>
      </HomeDashboardMain>
    </div>
  );
}
