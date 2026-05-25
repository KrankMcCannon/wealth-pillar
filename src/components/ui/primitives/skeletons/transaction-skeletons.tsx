import { Skeleton } from '@/components/ui/skeleton';
import { SkeletonList } from '@/components/ui/primitives';
import { stitchRecurring, stitchTransactions } from '@/styles/home-design-foundation';

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
  <div className="rounded-xl border border-border/25 bg-card/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
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
      spacing="grid h-12 grid-cols-2 gap-1 rounded-full border border-border/35 bg-card/95 p-1"
      renderItem={() => <Skeleton className="h-9 w-full rounded-full" />}
    />
  </div>
);

export const TransactionsToolbarSkeleton = () => (
  <div className="flex flex-col gap-2 px-4">
    <Skeleton className="h-11 w-full rounded-2xl" />
    <div className="flex gap-2">
      <Skeleton className="h-9 w-16 rounded-full" />
      <Skeleton className="h-9 w-20 rounded-full" />
      <Skeleton className="h-9 w-24 rounded-full" />
    </div>
  </div>
);

export const RecurringSeriesSkeleton = () => (
  <div className="flex flex-col gap-4">
    <Skeleton className="h-36 w-full rounded-2xl" />
    <SkeletonList
      count={2}
      spacing="flex flex-col gap-4"
      renderItem={() => (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <div className={stitchTransactions.dayCard}>
            <SkeletonList
              count={2}
              spacing={stitchRecurring.listStack}
              renderItem={() => (
                <div className="flex items-center gap-3 rounded-xl bg-muted/90 px-3 py-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                  <Skeleton className="size-8 shrink-0 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-14 shrink-0" />
                </div>
              )}
            />
          </div>
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
