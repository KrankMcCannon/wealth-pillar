import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { stitchHome, stitchDashboardGroupedList } from '@/styles/home-design-foundation';

export function UserSelectorSkeleton() {
  return (
    <div className="px-4 py-3">
      <Skeleton className="mb-3 h-3 w-24" />
      <SkeletonList
        count={3}
        spacing="flex gap-2 overflow-x-auto"
        renderItem={() => (
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border/35 bg-muted/80 px-3 py-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        )}
      />
    </div>
  );
}

export function BalanceSectionSkeleton() {
  return (
    <section className={stitchHome.balanceSection} aria-hidden>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-2xl" />
          <div className="flex min-w-0 flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-36 max-w-full" />
          </div>
        </div>
        <Skeleton className="size-8 shrink-0 rounded-full" />
      </div>
    </section>
  );
}

export function BudgetSectionSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <Skeleton className="h-3 w-28" />
      <div className="mb-3 flex flex-col gap-1">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <SkeletonList
        count={2}
        spacing="flex flex-col gap-2"
        renderItem={() => (
          <div className={stitchHome.listRow}>
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-16 shrink-0" />
          </div>
        )}
      />
    </section>
  );
}

export function RecurringSeriesSkeleton() {
  return (
    <section className={stitchHome.sectionCard} aria-hidden>
      <Skeleton className="h-3 w-32" />
      <Skeleton className="mb-3 h-5 w-40" />
      <div className={stitchDashboardGroupedList}>
        <SkeletonList
          count={3}
          spacing="flex flex-col gap-2"
          renderItem={() => (
            <div className={stitchHome.listRow}>
              <Skeleton className="size-8 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-4 w-[60%]" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
          )}
        />
      </div>
    </section>
  );
}
