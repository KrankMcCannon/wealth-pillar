import { Skeleton } from '@/components/ui/skeleton';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchReports } from '@/styles/home-design-foundation';

export function ReportsSkeleton() {
  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className={stitchReports.stickyFilterBar}>
        <div className={stitchReports.chipRow}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-7 w-16 shrink-0 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-8 w-48 rounded-full" />
      </div>

      <HomeDashboardMain id="main-reports-skeleton" className="pt-2">
        <div className={stitchReports.sectionStack}>
          <Skeleton className="h-36 w-full rounded-2xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          <section className="flex flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 py-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </section>

          <section className="flex flex-col gap-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </section>
        </div>
      </HomeDashboardMain>
    </div>
  );
}
