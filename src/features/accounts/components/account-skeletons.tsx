/**
 * Account Skeleton Components
 * Progressive loading placeholders with smooth animations
 */

const shimmerBase = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

/**
 * Header skeleton loader for accounts page
 */
export function AccountHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
          <div className="flex-1">
            <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
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
      <div className={`bg-card rounded-2xl p-6 border border-primary/20 shadow-xl space-y-4 ${shimmerBase}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-3 w-20 bg-muted rounded mb-2" />
            <div className="h-8 w-32 bg-muted rounded" />
          </div>
          <div className="w-14 h-14 bg-muted rounded-full" />
        </div>

        {/* Statistics grid */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-primary/5 rounded-lg p-3 border border-primary/10 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 bg-muted rounded" />
                <div className="h-2 w-12 bg-muted rounded" />
              </div>
              <div className="h-5 w-8 bg-muted rounded" />
            </div>
          ))}
        </div>
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
      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className={`p-4 rounded-lg border border-primary/20 bg-card ${shimmerBase}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-muted rounded mb-2" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 w-20 bg-muted rounded mb-1" />
                <div className="h-3 w-16 bg-muted rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Account slider skeleton (for dashboard balance section)
 */
export function BalanceSectionSliderSkeleton() {
  return (
    <div className="overflow-x-auto scrollbar-hide mb-4">
      <div className="flex gap-3 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="shrink-0 w-60 h-24 bg-primary/10 rounded-lg animate-pulse border border-primary/20"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Full accounts page skeleton
 */
export function AccountsPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <AccountHeaderSkeleton />
      <BalanceCardSkeleton />
      <AccountListSkeleton />
    </div>
  );
}

export default AccountsPageSkeleton;
