/**
 * Dashboard Skeleton Components
 * Progressive loading placeholders with shimmer animation
 */

import { dashboardStyles } from '../theme/dashboard-styles';

/**
 * Header skeleton loader
 */
export function DashboardHeaderSkeleton() {
  return (
    <header className={dashboardStyles.header.container}>
      <div className={dashboardStyles.header.inner}>
        <div className={dashboardStyles.header.section.left}>
          <div className="w-8 h-8 bg-muted rounded-xl animate-pulse" />
          <div className="flex flex-col gap-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-3 w-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className={dashboardStyles.header.section.right}>
          <div className="w-8 h-8 bg-muted rounded-xl animate-pulse" />
          <div className="w-8 h-8 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </header>
  );
}

/**
 * User selector skeleton loader
 */
export function UserSelectorSkeleton() {
  return (
    <div className={dashboardStyles.userSelector.container}>
      <div className={dashboardStyles.userSelector.inner}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 h-8 w-20 bg-muted rounded-full animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Balance section skeleton loader
 */
export function BalanceSectionSkeleton() {
  return (
    <div className={dashboardStyles.balanceSection.container}>
      <div className={dashboardStyles.balanceSection.header}>
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>

      {/* Total balance card */}
      <div className={`${dashboardStyles.balanceSection.totalBalance.container} animate-pulse`}>
        <div className="h-3 w-24 bg-muted/50 rounded mb-2" />
        <div className="h-8 w-32 bg-muted/50 rounded" />
      </div>

      {/* Account cards */}
      <div className={dashboardStyles.balanceSection.grid}>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`${dashboardStyles.balanceSection.accountCard.container} animate-pulse`}
          >
            <div className="flex justify-between">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Budget section skeleton loader
 */
export function BudgetSectionSkeleton() {
  return (
    <div className={dashboardStyles.budgetSection.container}>
      <div className={dashboardStyles.budgetSection.header}>
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>

      <div className={dashboardStyles.budgetSection.grid}>
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className={`${dashboardStyles.budgetSection.budgetCard.container} animate-pulse`}
          >
            <div className="flex gap-3 mb-3">
              <div className="w-8 h-8 bg-muted rounded animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-muted rounded mb-1" />
                <div className="h-3 w-20 bg-muted/50 rounded" />
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-8 bg-muted/50 rounded animate-pulse" />
              <div className="h-8 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Recurring series section skeleton loader
 */
export function RecurringSeriesSkeleton() {
  return (
    <div className={dashboardStyles.recurringSection.container}>
      <div className={dashboardStyles.recurringSection.header}>
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
      </div>

      <div className={dashboardStyles.recurringSection.grid}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`${dashboardStyles.recurringSection.seriesCard.container} animate-pulse`}
          >
            <div className="flex justify-between mb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-6 w-16 bg-muted rounded" />
            </div>
            <div className="h-3 w-32 bg-muted/50 rounded" />
          </div>
        ))}
      </div>
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
