"use client";

/**
 * Modern skeleton components for budget pages
 * Uses project palette and smooth animations
 */

const shimmerBase = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export const BudgetCardSkeleton = () => (
  <div className={`p-4 rounded-xl border border-slate-200 bg-white ${shimmerBase}`}>
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 rounded-xl" />
      <div className="flex-1">
        <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-slate-300 rounded-full" />
          <div className="h-3 bg-slate-200 rounded w-8" />
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 bg-slate-200 rounded w-16 mb-1" />
        <div className="h-3 bg-slate-200 rounded w-12" />
      </div>
    </div>
    <div className="w-full h-2 bg-slate-200 rounded-full" />
  </div>
);

export const BudgetListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map(i => (
      <BudgetCardSkeleton key={i} />
    ))}
  </div>
);

export const BudgetDetailsSkeleton = () => (
  <div className={`p-6 rounded-xl border border-slate-200 bg-white space-y-4 ${shimmerBase}`}>
    <div className="flex items-center justify-between">
      <div>
        <div className="h-6 bg-slate-200 rounded w-32 mb-2" />
        <div className="h-4 bg-slate-200 rounded w-24" />
      </div>
      <div className="text-right">
        <div className="h-8 bg-slate-200 rounded w-20 mb-1" />
        <div className="h-3 bg-slate-200 rounded w-16" />
      </div>
    </div>

    {/* Progress bar */}
    <div className="w-full h-3 bg-slate-200 rounded-full" />

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
      <div>
        <div className="h-3 bg-slate-200 rounded w-16 mb-1" />
        <div className="h-5 bg-slate-200 rounded w-20" />
      </div>
      <div>
        <div className="h-3 bg-slate-200 rounded w-16 mb-1" />
        <div className="h-5 bg-slate-200 rounded w-20" />
      </div>
    </div>
  </div>
);

export const TransactionListSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className={`p-3 rounded-lg border border-slate-200 bg-white ${shimmerBase}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7578EC]/10 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-1" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="text-right">
            <div className="h-4 bg-slate-200 rounded w-16 mb-1" />
            <div className="h-3 bg-slate-200 rounded w-12" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const BudgetPageSkeleton = () => (
  <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
    {/* Header skeleton */}
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
          <div>
            <div className="h-5 bg-slate-200 rounded w-16 mb-1 animate-pulse" />
            <div className="h-3 bg-slate-200 rounded w-20 animate-pulse" />
          </div>
        </div>
        <div className="w-8 h-8 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    </header>

    {/* User selector skeleton */}
    <section className="bg-white/80 backdrop-blur-xl py-3 border-b border-slate-200/50 shadow-sm">
      <div className="flex items-center gap-2 pl-4" style={{ height: '44px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 animate-pulse">
            <div className="w-5 h-5 bg-slate-300 rounded-full" />
            <div className="w-12 h-3 bg-slate-300 rounded" />
          </div>
        ))}
      </div>
    </section>

    {/* Main content skeleton */}
    <main className="flex-1 p-4 pb-20">
      <div className="space-y-6">
        {/* Section header */}
        <div>
          <div className="h-6 bg-slate-200 rounded w-32 mb-2 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-24 animate-pulse" />
        </div>

        {/* Budget list */}
        <BudgetListSkeleton />

        {/* Details section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="h-10 bg-slate-200 rounded-lg flex-1 animate-pulse" />
            <div className="h-10 bg-slate-200 rounded-lg flex-1 animate-pulse" />
          </div>
          <BudgetDetailsSkeleton />
        </div>
      </div>
    </main>
  </div>
);

export default BudgetPageSkeleton;