"use client";

/**
 * Modern skeleton components for budget pages
 * Uses project palette and smooth animations
 */

import { SkeletonList } from "@/components/ui/primitives";
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

export const BudgetCardSkeleton = () => (
  <div className={`p-4 rounded-xl border border-primary/20 bg-card ${SHIMMER_BASE}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-primary/10 rounded-xl" />
      <div className="flex-1">
        <div className="h-4 bg-primary/15 rounded w-2/3 mb-2" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary/25 rounded-full" />
          <div className="h-3 bg-primary/15 rounded w-8" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 bg-primary/15 rounded w-16 mb-1" />
        <div className="h-3 bg-primary/15 rounded w-12" />
      </div>
    </div>
    <div className="w-full h-2 bg-primary/12 rounded-full" />
  </div>
);

export const BudgetListSkeleton = () => (
  <SkeletonList
    count={3}
    spacing="space-y-3"
    renderItem={() => <BudgetCardSkeleton />}
  />
);

export const BudgetDetailsSkeleton = () => (
  <div className={`p-6 rounded-xl border border-primary/20 bg-card space-y-4 ${SHIMMER_BASE}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="h-6 bg-primary/15 rounded w-32 mb-2" />
        <div className="h-4 bg-primary/15 rounded w-24" />
      </div>
      <div className="text-right">
        <div className="h-8 bg-primary/15 rounded w-20 mb-1" />
        <div className="h-3 bg-primary/15 rounded w-16" />
      </div>
    </div>

    {/* Progress bar */}
    <div className="w-full h-3 bg-primary/12 rounded-full" />

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/20">
      <div>
        <div className="h-3 bg-primary/15 rounded w-16 mb-1" />
        <div className="h-5 bg-primary/15 rounded w-20" />
      </div>
      <div>
        <div className="h-3 bg-primary/15 rounded w-16 mb-1" />
        <div className="h-5 bg-primary/15 rounded w-20" />
      </div>
    </div>
  </div>
);

export const TransactionListSkeleton = () => (
  <SkeletonList
    count={4}
    spacing="space-y-3"
    renderItem={() => (
      <div className={`p-3 rounded-lg border border-primary/20 bg-card ${SHIMMER_BASE}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-primary/15 rounded w-3/4 mb-1" />
            <div className="h-3 bg-primary/15 rounded w-1/2" />
          </div>
          <div className="text-right">
            <div className="h-4 bg-primary/15 rounded w-16 mb-1" />
            <div className="h-3 bg-primary/15 rounded w-12" />
          </div>
        </div>
      </div>
    )}
  />
);

export const BudgetPageSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-card">
    {/* Header skeleton */}
    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/12 rounded-xl animate-pulse" />
          <div>
            <div className="h-5 bg-primary/15 rounded w-16 mb-1 animate-pulse" />
            <div className="h-3 bg-primary/15 rounded w-20 animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 bg-primary/12 rounded-xl animate-pulse" />
      </div>
    </header>

    {/* User selector skeleton */}
    <section className="bg-card/80 backdrop-blur-xl py-3 border-b border-primary/20 shadow-sm">
      <SkeletonList
        count={3}
        spacing="flex items-center gap-2 pl-4"
        style={{ height: 44 }}
        renderItem={() => (
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-primary/10 animate-pulse">
            <div className="w-5 h-5 bg-primary/25 rounded-full" />
            <div className="w-12 h-3 bg-primary/20 rounded" />
          </div>
        )}
      />
    </section>

    {/* Main content skeleton */}
    <main className="flex-1 p-4 pb-20">
      <div className="space-y-6">
        {/* Section header */}
        <div>
          <div className="h-6 bg-muted rounded w-32 mb-2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
        </div>

        {/* Budget list */}
        <BudgetListSkeleton />

        {/* Details section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded-lg flex-1 animate-pulse" />
            <div className="h-10 bg-muted rounded-lg flex-1 animate-pulse" />
          </div>
          <BudgetDetailsSkeleton />
        </div>
      </div>
    </main>
  </div>
);

export default BudgetPageSkeleton;
