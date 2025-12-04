/**
 * Dashboard Skeleton Components
 * Progressive loading placeholders with enhanced shimmer animation
 * Prevents Cumulative Layout Shift (CLS) with accurate dimensions
 */

import { SkeletonList } from "@/components/ui/primitives";

import { dashboardStyles } from '../theme/dashboard-styles';

/**
 * Skeleton shimmer animation class
 * Uses the existing shimmer animation from globals.css for consistent loading states
 * The liquid-shimmer class provides a smooth, performant gradient effect
 */
const skeletonClasses = {
  // Use liquid-shimmer class which is defined in globals.css for consistent branding
  shimmer: 'liquid-shimmer bg-primary/12',
  pulse: 'animate-pulse',
};

/**
 * Header skeleton loader
 * Matches exact dimensions of actual header to prevent CLS
 */
export function DashboardHeaderSkeleton() {
  return (
    <header className={dashboardStyles.header.container}>
      <div className={dashboardStyles.header.inner}>
        <div className={dashboardStyles.header.section.left}>
          <div className={`w-8 h-8 rounded-xl ${skeletonClasses.shimmer}`} />
          <div className="flex flex-col gap-1">
            <div className={`h-4 w-24 rounded ${skeletonClasses.shimmer}`} />
            <div className={`h-3 w-20 rounded ${skeletonClasses.shimmer}`} />
          </div>
        </div>
        <div className={dashboardStyles.header.section.right}>
          <div className={`w-8 h-8 rounded-xl ${skeletonClasses.shimmer}`} />
          <div className={`w-8 h-8 rounded-xl ${skeletonClasses.shimmer}`} />
        </div>
      </div>
    </header>
  );
}

/**
 * User selector skeleton loader
 * Shows 3 placeholder pills while user data loads
 */
export function UserSelectorSkeleton() {
  return (
    <div className={dashboardStyles.userSelector.container}>
      <SkeletonList
        count={3}
        spacing={dashboardStyles.userSelector.inner}
        renderItem={() => (
          <div className={`shrink-0 h-8 w-20 rounded-full ${skeletonClasses.shimmer}`} />
        )}
      />
    </div>
  );
}

/**
 * Balance section skeleton loader
 * Displays loading state for accounts and total balance
 */
export function BalanceSectionSkeleton() {
  return (
    <div className={dashboardStyles.balanceSection.container}>
      <div className={dashboardStyles.balanceSection.header}>
        <div className={`h-4 w-32 rounded ${skeletonClasses.shimmer}`} />
      </div>

      {/* Total balance card */}
      <div className={dashboardStyles.balanceSection.totalBalance.container}>
        <div className={`h-3 w-24 rounded mb-2 ${skeletonClasses.shimmer}`} />
        <div className={`h-8 w-32 rounded ${skeletonClasses.shimmer}`} />
      </div>

      {/* Account cards */}
      <SkeletonList
        count={2}
        spacing={dashboardStyles.balanceSection.grid}
        renderItem={() => (
          <div className={dashboardStyles.balanceSection.accountCard.container}>
            <div className="flex justify-between gap-2">
              <div className={`h-4 w-24 rounded flex-1 ${skeletonClasses.shimmer}`} />
              <div className={`h-4 w-20 rounded ${skeletonClasses.shimmer}`} />
            </div>
          </div>
        )}
      />
    </div>
  );
}

/**
 * Budget section skeleton loader
 * Shows loading state for budget cards with progress indicators
 */
export function BudgetSectionSkeleton() {
  return (
    <div className={dashboardStyles.budgetSection.container}>
      <div className={dashboardStyles.budgetSection.header}>
        <div className={`h-4 w-32 rounded ${skeletonClasses.shimmer}`} />
      </div>

      <SkeletonList
        count={2}
        spacing={dashboardStyles.budgetSection.grid}
        renderItem={() => (
          <div className={dashboardStyles.budgetSection.budgetCard.container}>
            <div className="flex gap-3 mb-3">
              <div className={`w-8 h-8 rounded ${skeletonClasses.shimmer}`} />
              <div className="flex-1 space-y-1">
                <div className={`h-4 w-24 rounded ${skeletonClasses.shimmer}`} />
                <div className={`h-3 w-20 rounded ${skeletonClasses.shimmer}`} />
              </div>
            </div>
            <div className={`h-2 rounded-full mb-3 ${skeletonClasses.shimmer}`} />
            <div className="grid grid-cols-2 gap-2">
              <div className={`h-8 rounded ${skeletonClasses.shimmer}`} />
              <div className={`h-8 rounded ${skeletonClasses.shimmer}`} />
            </div>
          </div>
        )}
      />
    </div>
  );
}

/**
 * Recurring series section skeleton loader
 * Shows loading state for recurring transaction cards
 */
export function RecurringSeriesSkeleton() {
  return (
    <div className={dashboardStyles.recurringSection.container}>
      <div className={dashboardStyles.recurringSection.header}>
        <div className={`h-4 w-32 rounded ${skeletonClasses.shimmer}`} />
      </div>

      <SkeletonList
        count={3}
        spacing={dashboardStyles.recurringSection.grid}
        renderItem={() => (
          <div className={dashboardStyles.recurringSection.seriesCard.container}>
            <div className="flex justify-between mb-2 gap-2">
              <div className={`h-4 w-24 rounded flex-1 ${skeletonClasses.shimmer}`} />
              <div className={`h-6 w-16 rounded ${skeletonClasses.shimmer}`} />
            </div>
            <div className={`h-3 w-32 rounded ${skeletonClasses.shimmer}`} />
          </div>
        )}
      />
    </div>
  );
}

/**
 * Page-level loading skeleton
 */
export function DashboardPageSkeleton() {
  return (
    <div className={dashboardStyles.page.container}>
      <DashboardHeaderSkeleton />
      <UserSelectorSkeleton />
      <main className={dashboardStyles.page.main}>
        <BalanceSectionSkeleton />
        <div className={dashboardStyles.divider} />
        <BudgetSectionSkeleton />
        <RecurringSeriesSkeleton />
      </main>
    </div>
  );
}
