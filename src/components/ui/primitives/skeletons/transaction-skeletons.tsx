import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';

export const TransactionHeaderSkeleton = () => (
  <header className="border-b border-border px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <Skeleton className="size-9 rounded-full" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="size-9 rounded-full" />
    </div>
  </header>
);

export const UserSelectorSkeleton = () => (
  <section className="px-4 py-3">
    <SkeletonList
      count={3}
      spacing="flex gap-2 overflow-x-auto"
      renderItem={() => (
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-2">
          <Skeleton className="size-2 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
      )}
    />
  </section>
);

export const TransactionCardSkeleton = () => (
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
);

export const TransactionDayGroupSkeleton = () => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between px-1">
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-col items-end gap-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
    <SkeletonList
      count={3}
      spacing="flex flex-col gap-2"
      renderItem={() => <TransactionCardSkeleton />}
    />
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={3}
    spacing="flex flex-col gap-6"
    renderItem={() => <TransactionDayGroupSkeleton />}
  />
);

export const TabNavigationSkeleton = () => (
  <div className="px-4 py-2">
    <SkeletonList
      count={2}
      spacing="flex gap-2"
      renderItem={() => <Skeleton className="h-10 w-28 rounded-xl" />}
    />
  </div>
);

export const RecurringSeriesSkeleton = () => (
  <div className="px-4">
    <SkeletonList
      count={3}
      spacing="flex flex-col gap-3"
      renderItem={() => (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="size-8 rounded-lg" />
        </div>
      )}
    />
  </div>
);

export const FullTransactionsPageSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <TransactionHeaderSkeleton />
    <UserSelectorSkeleton />
    <TabNavigationSkeleton />
    <main className="flex-1 px-4 pb-24">
      <TransactionListSkeleton />
    </main>
  </div>
);

export default FullTransactionsPageSkeleton;
