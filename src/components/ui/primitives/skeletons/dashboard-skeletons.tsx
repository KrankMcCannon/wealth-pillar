import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { stitchHome } from '@/styles/home-design-foundation';

function BriefingSectionSkeleton({ rows }: { rows: number }) {
  return (
    <section aria-hidden className={stitchHome.scanSection}>
      <div className={stitchHome.scanSectionHeader}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <SkeletonList
        count={rows}
        spacing="flex flex-col"
        renderItem={() => (
          <div className="flex min-h-10 items-center justify-between gap-3 py-1">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-[55%]" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        )}
      />
    </section>
  );
}

export function BalanceSectionSkeleton() {
  return (
    <section aria-hidden className={stitchHome.balanceSection}>
      <div className={stitchHome.scanSectionHeader}>
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="h-10 w-48 max-w-full" />
      <Skeleton className="h-4 w-36" />
    </section>
  );
}

export function BudgetSectionSkeleton() {
  return (
    <section aria-hidden className={stitchHome.scanSection}>
      <div className={stitchHome.scanSectionHeader}>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-4 w-16 shrink-0" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </section>
  );
}

export function RecurringSeriesSkeleton() {
  return <BriefingSectionSkeleton rows={3} />;
}

export function RecentActivitySectionSkeleton() {
  return <BriefingSectionSkeleton rows={3} />;
}

export function HomePageSectionsSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <BalanceSectionSkeleton />
      <BudgetSectionSkeleton />
      <RecurringSeriesSkeleton />
      <RecentActivitySectionSkeleton />
    </div>
  );
}
