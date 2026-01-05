/**
 * Account Skeleton Components
 * Progressive loading placeholders with smooth animations
 */

import { SkeletonList } from "@/components/ui/primitives";
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

/**
 * Header skeleton loader for accounts page
 */
export function AccountHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-primary/10 rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-primary/15 rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-primary/15 rounded animate-pulse" />
          </div>
        </div>
        <div className="w-9 h-9 bg-primary/10 rounded-lg animate-pulse" />
      </div>
    </header>
  );
}

/**
 * Total balance card skeleton
 */
export function BalanceCardSkeleton() {
  return (
    <div className={`px-4 py-6`}>
      <div className={`bg-card rounded-2xl p-6 border border-primary/20 shadow-xl space-y-4 ${SHIMMER_BASE}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-3 w-20 bg-primary/15 rounded mb-2" />
            <div className="h-8 w-32 bg-primary/15 rounded" />
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-full" />
        </div>

        {/* Statistics grid */}
        <SkeletonList
          count={3}
          spacing="grid grid-cols-3 gap-3 mt-6"
          renderItem={() => (
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-primary/15 rounded" />
                <div className="h-2 w-12 bg-primary/15 rounded" />
              </div>
              <div className="h-5 w-8 bg-primary/15 rounded" />
            </div>
          )}
        />
      </div>
    </div>
  );
}

/**
 * Account list skeleton
 */
export function AccountListSkeleton() {
  return (
    <div className="px-4">
      <div className="h-5 w-32 bg-primary/15 rounded animate-pulse mb-4" />
    <SkeletonList
      count={3}
      spacing="space-y-3"
      renderItem={() => (
        <div className={`p-4 rounded-lg border border-primary/20 bg-card ${SHIMMER_BASE}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-primary/10 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-primary/15 rounded mb-2" />
                <div className="h-3 w-16 bg-primary/15 rounded" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-4 w-20 bg-primary/15 rounded mb-1" />
              <div className="h-3 w-16 bg-primary/15 rounded" />
            </div>
          </div>
        </div>
      )}
    />
  </div>
);
}

/**
 * Account slider skeleton (for dashboard balance section)
 */
export function BalanceSectionSliderSkeleton() {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-4">
      <SkeletonList
        count={3}
        spacing="flex gap-3 pb-2"
        height="h-24"
        width="w-60"
        className="shrink-0 border border-primary/20 bg-primary/10"
      />
    </div>
  );
}

/**
 * Full accounts page skeleton
 */
export function AccountsPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-14">
      <AccountHeaderSkeleton />
      <BalanceCardSkeleton />
      <AccountListSkeleton />
    </div>
  );
}

export default AccountsPageSkeleton;
