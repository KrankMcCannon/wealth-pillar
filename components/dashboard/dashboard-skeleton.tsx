"use client";

import { Card } from '@/components/ui/card';

/**
 * Modern skeleton components with shimmer effects
 * Uses project palette and follows DRY principles
 */

// Base shimmer animation class for consistency
const shimmerBase = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

interface SkeletonCardProps {
  className?: string;
  children: React.ReactNode;
}

const SkeletonCard = ({ className = "", children }: SkeletonCardProps) => (
  <Card className={`p-4 border-primary/20 bg-card backdrop-blur-sm ${className}`}>
    {children}
  </Card>
);

// Header skeleton with modern design
export const DashboardHeaderSkeleton = () => (
  <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-primary/20 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className={`flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-sm ${shimmerBase}`}>
          <div className="h-4 w-4 sm:h-5 sm:w-5 bg-primary/20 rounded"></div>
        </div>
        <div className="flex flex-col space-y-2">
          <div className={`h-4 bg-primary/20 rounded w-24 ${shimmerBase}`}></div>
          <div className={`h-3 bg-primary/20 rounded w-16 ${shimmerBase}`}></div>
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <div className={`w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl ${shimmerBase}`}></div>
        <div className={`w-10 h-10 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl ${shimmerBase}`}></div>
      </div>
    </div>
  </header>
);

// User selector skeleton
export const UserSelectorSkeleton = () => (
  <section className="bg-card/80 backdrop-blur-xl p-2 border-b border-primary/20 shadow-sm">
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex-shrink-0 flex items-center gap-3 p-2 rounded-2xl bg-gradient-to-r from-primary/10 to-white border border-primary/20 min-w-[120px] ${shimmerBase}`}
        >
          <div className="w-6 h-6 bg-primary/20 rounded-full"></div>
          <div className="w-16 h-4 bg-primary/20 rounded"></div>
        </div>
      ))}
    </div>
  </section>
);

// Balance section skeleton with enhanced design
export const BalanceSectionSkeleton = () => (
  <section className="bg-card p-3 shadow-sm">
    <div className="flex items-end justify-between mb-3">
      <div>
        <div className={`h-4 w-20 bg-primary/20 rounded mb-1 ${shimmerBase}`}></div>
        <div className={`h-8 w-32 bg-gradient-to-r from-accent/30 to-accent/10 rounded ${shimmerBase}`}></div>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-primary/20 rounded"></div>
        <div className={`w-6 h-4 bg-primary/20 rounded ${shimmerBase}`}></div>
      </div>
    </div>

    {/* Bank accounts horizontal slider */}
    <div className="overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="flex-shrink-0 w-60 bg-gradient-to-br from-white to-primary/5 border border-primary/20 transition-all duration-300">
            <div className={`h-6 w-3/4 bg-primary/20 rounded mb-2 ${shimmerBase}`}></div>
            <div className={`h-8 w-1/2 bg-gradient-to-r from-accent/30 to-accent/10 rounded mb-1 ${shimmerBase}`}></div>
            <div className={`h-3 w-2/3 bg-primary/20 rounded ${shimmerBase}`}></div>
          </SkeletonCard>
        ))}
      </div>
    </div>
  </section>
);

// Budget section skeleton with user grouping
export const BudgetSectionSkeleton = () => (
  <section className="bg-background px-3 pt-3">
    <div className={`h-6 w-20 bg-muted rounded mb-3 ${shimmerBase}`}></div>

    <div className="space-y-4">
      {[1, 2].map((userIndex) => (
        <SkeletonCard key={userIndex} className="bg-card shadow-sm border border-primary/20 rounded-lg overflow-hidden">
          {/* User header */}
          <div className="bg-gradient-to-r from-muted/50 to-muted px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                  <div className="w-4 h-4 bg-primary/30 rounded-full"></div>
                </div>
                <div>
                  <div className={`h-5 w-20 bg-muted rounded mb-1 ${shimmerBase}`}></div>
                  <div className={`h-3 w-24 bg-muted rounded ${shimmerBase}`}></div>
                </div>
              </div>
              <div className="text-right">
                <div className={`h-4 w-24 bg-muted rounded mb-1 ${shimmerBase}`}></div>
                <div className={`h-3 w-12 bg-muted rounded ${shimmerBase}`}></div>
              </div>
            </div>
          </div>

          {/* Budget items */}
          <div className="divide-y divide-border">
            {[1, 2, 3].map((budgetIndex) => (
              <div key={budgetIndex} className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg">
                      <div className="w-6 h-6 bg-primary/30 rounded"></div>
                    </div>
                    <div>
                      <div className={`h-4 w-24 bg-muted rounded mb-1 ${shimmerBase}`}></div>
                      <div className={`h-3 w-16 bg-muted rounded ${shimmerBase}`}></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`h-4 w-20 bg-muted rounded mb-1 ${shimmerBase}`}></div>
                    <div className={`h-3 w-12 bg-muted rounded ${shimmerBase}`}></div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div className={`h-2 bg-gradient-to-r from-primary to-primary/80 rounded-full ${shimmerBase}`} style={{ width: '45%' }}></div>
                </div>
              </div>
            ))}
          </div>
        </SkeletonCard>
      ))}
    </div>
  </section>
);

// Recurring series section skeleton
export const RecurringSeriesSkeleton = () => (
  <SkeletonCard className="bg-card/80 backdrop-blur-sm shadow-xl shadow-primary/10 rounded-2xl sm:rounded-3xl border border-primary/20 m-3">
    <div className={`h-6 w-32 bg-muted rounded mb-4 ${shimmerBase}`}></div>

    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`h-16 bg-gradient-to-r from-muted to-card rounded-xl border border-border ${shimmerBase}`}>
          <div className="flex items-center gap-3 p-4 h-full">
            <div className="w-8 h-8 bg-primary/20 rounded-lg"></div>
            <div className="flex-1">
              <div className={`h-4 w-24 bg-muted rounded mb-1 ${shimmerBase}`}></div>
              <div className={`h-3 w-16 bg-muted rounded ${shimmerBase}`}></div>
            </div>
            <div className={`h-6 w-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded ${shimmerBase}`}></div>
          </div>
        </div>
      ))}
    </div>
  </SkeletonCard>
);

// Complete dashboard skeleton
export const CompleteDashboardSkeleton = () => (
  <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-primary/5 via-white to-primary/10" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
    <DashboardHeaderSkeleton />
    <UserSelectorSkeleton />

    <main className="pb-16">
      <BalanceSectionSkeleton />
      <div className="h-px bg-primary/20 mx-4"></div>
      <BudgetSectionSkeleton />
      <RecurringSeriesSkeleton />
    </main>
  </div>
);

// CSS for shimmer animation (to be added to global styles)
export const shimmerStyles = `
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
`;
