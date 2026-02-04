/**
 * Dashboard Skeleton Components
 * Progressive loading placeholders with enhanced shimmer animation
 * Prevents Cumulative Layout Shift (CLS) with accurate dimensions
 */

import { SkeletonList } from '@/components/ui/primitives';
import { dashboardStyles } from '../theme/dashboard-styles';

/**
 * Skeleton shimmer animation class
 * Uses the existing shimmer animation from globals.css for consistent loading states
 * The liquid-shimmer class provides a smooth, performant gradient effect
 */
const skeletonClasses = {
  shimmer: dashboardStyles.skeletons.shimmer,
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
          <div className={`${dashboardStyles.skeletons.headerIcon} ${skeletonClasses.shimmer}`} />
          <div className={dashboardStyles.skeletons.headerTextGroup}>
            <div
              className={`${dashboardStyles.skeletons.headerLinePrimary} ${skeletonClasses.shimmer}`}
            />
            <div
              className={`${dashboardStyles.skeletons.headerLineSecondary} ${skeletonClasses.shimmer}`}
            />
          </div>
        </div>
        <div className={dashboardStyles.header.section.right}>
          <div className={`${dashboardStyles.skeletons.headerIcon} ${skeletonClasses.shimmer}`} />
          <div className={`${dashboardStyles.skeletons.headerIcon} ${skeletonClasses.shimmer}`} />
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
          <div className={`${dashboardStyles.skeletons.userPill} ${skeletonClasses.shimmer}`} />
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
            <div className={dashboardStyles.skeletons.accountRow}>
              <div
                className={`${dashboardStyles.skeletons.accountLinePrimary} ${skeletonClasses.shimmer}`}
              />
              <div
                className={`${dashboardStyles.skeletons.accountLineSecondary} ${skeletonClasses.shimmer}`}
              />
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
            <div className={dashboardStyles.skeletons.budgetRow}>
              <div
                className={`${dashboardStyles.skeletons.budgetIcon} ${skeletonClasses.shimmer}`}
              />
              <div className={dashboardStyles.skeletons.budgetText}>
                <div
                  className={`${dashboardStyles.skeletons.budgetLinePrimary} ${skeletonClasses.shimmer}`}
                />
                <div
                  className={`${dashboardStyles.skeletons.budgetLineSecondary} ${skeletonClasses.shimmer}`}
                />
              </div>
            </div>
            <div
              className={`${dashboardStyles.skeletons.budgetProgress} ${skeletonClasses.shimmer}`}
            />
            <div className={dashboardStyles.skeletons.budgetStats}>
              <div
                className={`${dashboardStyles.skeletons.budgetStat} ${skeletonClasses.shimmer}`}
              />
              <div
                className={`${dashboardStyles.skeletons.budgetStat} ${skeletonClasses.shimmer}`}
              />
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
            <div className={dashboardStyles.skeletons.recurringRow}>
              <div
                className={`${dashboardStyles.skeletons.recurringLinePrimary} ${skeletonClasses.shimmer}`}
              />
              <div
                className={`${dashboardStyles.skeletons.recurringLineSecondary} ${skeletonClasses.shimmer}`}
              />
            </div>
            <div
              className={`${dashboardStyles.skeletons.recurringLineTertiary} ${skeletonClasses.shimmer}`}
            />
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
