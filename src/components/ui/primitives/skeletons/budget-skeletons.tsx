import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';

export const BudgetCardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 shrink-0 rounded-2xl" />
      <div className="min-w-0 flex-1 flex flex-col gap-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    <Skeleton className="mt-4 h-2 w-full rounded-full" />
  </div>
);

export const BudgetListSkeleton = () => (
  <SkeletonList count={3} spacing="flex flex-col gap-3" renderItem={() => <BudgetCardSkeleton />} />
);

export const BudgetDetailsSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card p-4">
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
    </div>
    <Skeleton className="mt-4 h-2 w-full rounded-full" />
    <div className="mt-4 grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={4}
    spacing="flex flex-col gap-3"
    renderItem={() => (
      <div className="rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
    )}
  />
);

export const BudgetPageSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <header className="border-b border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </header>

    <section className="px-4 py-3">
      <SkeletonList
        count={3}
        spacing="flex gap-2 overflow-hidden"
        renderItem={() => <Skeleton className="h-10 w-24 shrink-0 rounded-full" />}
      />
    </section>

    <main className="flex-1 px-4 pb-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
        <BudgetListSkeleton />
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <BudgetDetailsSkeleton />
        </div>
      </div>
    </main>
  </div>
);

export default BudgetPageSkeleton;
