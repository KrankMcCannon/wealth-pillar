import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { PageTabsSkeleton } from '@/components/shared/page-tabs';

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
  <section className="px-4 py-1.5">
    <SkeletonList
      count={3}
      spacing="flex gap-1.5 overflow-x-auto"
      renderItem={() => (
        <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2 py-1">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      )}
    />
  </section>
);

export const TransactionCardSkeleton = () => (
  <div className="flex min-h-10 items-center justify-between gap-3 py-1">
    <div className="min-w-0 flex-1 flex flex-col gap-1.5">
      <Skeleton className="h-4 w-[55%]" />
      <Skeleton className="h-3 w-20" />
    </div>
    <Skeleton className="h-4 w-16 shrink-0" />
  </div>
);

export const TransactionDayGroupSkeleton = () => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-baseline justify-between gap-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
    <SkeletonList
      count={3}
      spacing="flex flex-col"
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

export const TabNavigationSkeleton = () => <PageTabsSkeleton className="py-2" />;

export const TransactionsToolbarSkeleton = () => (
  <div className="flex flex-col gap-2 px-4">
    <Skeleton className="h-11 w-full rounded-2xl" />
    <div className="flex gap-1.5">
      <Skeleton className="h-7 w-14 rounded-full" />
      <Skeleton className="h-7 w-16 rounded-full" />
      <Skeleton className="h-7 w-20 rounded-full" />
    </div>
  </div>
);

export const RecurringSeriesSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-10 w-40" />
    <SkeletonList
      count={2}
      spacing="flex flex-col gap-4"
      renderItem={() => (
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3 w-20" />
          <SkeletonList
            count={2}
            spacing="flex flex-col"
            renderItem={() => <TransactionCardSkeleton />}
          />
        </div>
      )}
    />
  </div>
);

export const FullTransactionsPageSkeleton = () => (
  <div className="flex min-h-screen flex-col bg-background">
    <TransactionHeaderSkeleton />
    <TabNavigationSkeleton />
    <TransactionsToolbarSkeleton />
    <main className="flex-1 px-4 pb-24">
      <TransactionListSkeleton />
    </main>
  </div>
);

export default FullTransactionsPageSkeleton;
