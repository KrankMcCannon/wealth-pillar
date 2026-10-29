import { Skeleton } from '@/components/ui/skeleton';
import { HomeDashboardMain } from '@/components/layout/home-dashboard-layout';
import { stitchHome } from '@/styles/home-design-foundation';

function PlainRowSkeleton() {
  return (
    <li className={stitchHome.plainRow}>
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-[55%]" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </li>
  );
}

function ScanSectionSkeleton({ rows }: Readonly<{ rows: number }>) {
  return (
    <section className={stitchHome.scanSection}>
      <Skeleton className="h-4 w-28" />
      <ul className={stitchHome.plainList}>
        {Array.from({ length: rows }, (_, i) => (
          <PlainRowSkeleton key={i} />
        ))}
      </ul>
    </section>
  );
}

export function AccountsPageSkeleton() {
  return (
    <HomeDashboardMain id="main-accounts-skeleton" ariaBusy className="gap-5 pt-3">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-11 w-48" />
      </header>
      <ScanSectionSkeleton rows={3} />
      <ScanSectionSkeleton rows={2} />
    </HomeDashboardMain>
  );
}
