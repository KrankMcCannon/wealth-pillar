import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';

export function UserSelectorSkeleton() {
  return (
    <div className="px-4 py-3">
      <Skeleton className="mb-3 h-3 w-24" />
      <SkeletonList
        count={3}
        spacing="flex gap-2 overflow-x-auto"
        renderItem={() => (
          <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
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
    <section className="px-4 py-2">
      <div className="flex gap-3 overflow-hidden pb-2">
        <Skeleton className="h-28 w-56 shrink-0 rounded-2xl" />
        <Skeleton className="h-28 w-56 shrink-0 rounded-2xl" />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-xl sm:size-14" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-8 w-40 max-w-full sm:h-9 sm:w-44" />
          </div>
        </div>
        <Skeleton className="h-10 w-28 shrink-0 rounded-full sm:h-11" />
      </div>
    </section>
  );
}

export function BudgetSectionSkeleton() {
  return (
    <div className="px-4">
      <div className="mb-4 border-b border-border/40 pb-4">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="mt-2 h-3 w-48" />
      </div>
      <SkeletonList
        count={2}
        spacing="flex flex-col gap-4 sm:gap-5"
        renderItem={() => (
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-3 flex gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        )}
      />
    </div>
  );
}

export function RecurringSeriesSkeleton() {
  return (
    <div className="px-4">
      <Skeleton className="mb-3 h-4 w-32" />
      <SkeletonList
        count={3}
        spacing="flex flex-col gap-3"
        renderItem={() => (
          <div className="rounded-xl border border-border bg-card p-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-2 h-3 w-28" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        )}
      />
    </div>
  );
}
