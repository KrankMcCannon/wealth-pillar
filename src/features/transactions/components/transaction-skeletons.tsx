"use client";

/**
 * Modern skeleton components for transactions pages
 * Uses project palette and smooth animations
 */

import { SkeletonList } from "@/components/ui/primitives";
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

export const TransactionHeaderSkeleton = () => (
  <header className={`sticky top-0 z-20 bg-card/70 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${SHIMMER_BASE}`}>
    <div className="flex items-center justify-between">
      <div className="w-10 h-10 bg-muted rounded-xl" />
      <div className="h-6 bg-muted rounded w-24" />
      <div className="w-10 h-10 bg-muted rounded-xl" />
    </div>
  </header>
);

export const UserSelectorSkeleton = () => (
  <section className={`sticky top-[60px] z-10 bg-card/80 backdrop-blur-sm border-b border-primary/20 px-3 sm:px-4 py-2 ${SHIMMER_BASE}`}>
    <SkeletonList
      count={3}
      spacing="flex items-center gap-2"
      style={{ height: 44 }}
      renderItem={() => (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-muted">
          <div className="w-5 h-5 bg-muted-foreground/30 rounded-full" />
          <div className="w-12 h-3 bg-muted-foreground/30 rounded" />
        </div>
      )}
    />
  </section>
);

export const TransactionCardSkeleton = () => (
  <div className={`p-3 sm:p-4 rounded-lg border border-primary/20 bg-card ${SHIMMER_BASE}`}>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary/10 rounded-lg shrink-0" />
      <div className="flex-1">
        <div className="h-4 bg-muted rounded w-3/4 mb-1" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
      <div className="text-right shrink-0">
        <div className="h-4 bg-muted rounded w-16 mb-1" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
    </div>
  </div>
);

export const TransactionDayGroupSkeleton = () => (
  <div className="space-y-3">
    {/* Day header */}
    <div className="flex items-center justify-between mb-2 px-1">
      <div className="h-5 bg-muted rounded w-24" />
      <div className="text-right">
        <div className="h-4 bg-muted rounded w-16 mb-1" />
        <div className="h-3 bg-muted rounded w-12" />
      </div>
    </div>

    {/* Transaction cards */}
    <SkeletonList
      count={3}
      spacing="space-y-3"
      renderItem={() => <TransactionCardSkeleton />}
    />
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={3}
    spacing="space-y-6"
    renderItem={() => <TransactionDayGroupSkeleton />}
  />
);

export const SearchFilterSkeleton = () => (
  <div className={`flex items-center gap-3 ${SHIMMER_BASE}`}>
    {/* Search input */}
    <div className="flex-1 h-12 bg-muted rounded-2xl" />
    {/* Filter button */}
    <div className="w-12 h-12 bg-muted rounded-xl" />
  </div>
);

export const TabNavigationSkeleton = () => (
  <div className={`flex gap-2 border-b border-primary/20 px-3 py-2 ${SHIMMER_BASE}`}>
    <SkeletonList
      count={2}
      spacing="flex gap-2 w-full"
      height="h-10"
      width="w-24"
      className="bg-muted rounded-lg"
    />
  </div>
);

export const RecurringSeriesSkeleton = () => (
  <div className={`p-4 rounded-lg border border-primary/20 bg-card space-y-4 ${SHIMMER_BASE}`}>
    <SkeletonList
      count={3}
      spacing="space-y-4"
      renderItem={() => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-muted rounded w-3/4 mb-1" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          <div className="w-8 h-8 bg-muted rounded-lg shrink-0" />
        </div>
      )}
    />
  </div>
);

export const FullTransactionsPageSkeleton = () => (
  <div className="flex flex-col min-h-dvh bg-card">
    {/* Header skeleton */}
    <TransactionHeaderSkeleton />

    {/* User selector skeleton */}
    <UserSelectorSkeleton />

    {/* Tab navigation skeleton */}
    <TabNavigationSkeleton />

    {/* Main content skeleton */}
    <main className="flex-1 p-3 space-y-6 pb-20">
      {/* Search and filter section */}
      <SearchFilterSkeleton />

      {/* Transactions list */}
      <TransactionListSkeleton />
    </main>
  </div>
);

export default FullTransactionsPageSkeleton;
