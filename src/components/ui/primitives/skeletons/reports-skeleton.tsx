import { Skeleton } from '@/components/ui/skeleton';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';

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

      <HomeDashboardMain id="main-reports-skeleton" className="pt-2" ariaBusy>
        <div className={stitchReports.sectionStack}>
          <div className={stitchReports.heroNetCard}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-2 h-8 w-40" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </div>

          <section className={stitchHome.scanSection}>
            <Skeleton className="h-5 w-44" />
            <ul className={stitchHome.plainList}>
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i} className={stitchHome.plainRow}>
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                </li>
              ))}
            </ul>
          </section>

          <section className={stitchHome.scanSection}>
            <Skeleton className="h-5 w-40" />
            <ul className={stitchHome.plainList}>
              {[1, 2, 3].map((i) => (
                <li key={i} className={stitchHome.plainRow}>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16 shrink-0" />
                </li>
              ))}
            </ul>
          </section>

          <section className={stitchHome.scanSection}>
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </section>
        </div>
      </HomeDashboardMain>
    </div>
  );
}
