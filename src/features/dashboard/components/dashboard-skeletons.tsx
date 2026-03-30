/**
 * Dashboard Skeleton Components
 * Progressive loading placeholders with enhanced shimmer animation
 * Prevents Cumulative Layout Shift (CLS) with accurate dimensions
 */

import { PageContainer } from '@/components/layout';
import { userSelectorStyles } from '@/components/shared/theme/user-selector-styles';
import { SkeletonList } from '@/components/ui/primitives';
import { accountStyles } from '@/features/accounts';
import { budgetStyles } from '@/styles/system';
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
    <div className={userSelectorStyles.loading.container}>
      <div className="mb-2 h-3 w-28 rounded bg-muted/50 animate-pulse" aria-hidden />
      <SkeletonList
        count={3}
        spacing="flex gap-2 overflow-x-auto pb-1"
        renderItem={() => (
          <div
            className={`flex min-h-[44px] min-w-30 shrink-0 items-center gap-2 rounded-2xl border border-border/40 bg-muted/30 px-3 py-2 ${skeletonClasses.shimmer}`}
          >
            <div className="size-8 shrink-0 rounded-full bg-muted/60" />
            <div className="h-3.5 flex-1 rounded bg-muted/50" />
          </div>
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
    <section className={accountStyles.balanceSection.container}>
      <div className={accountStyles.slider.container}>
        <div className={accountStyles.slider.inner}>
          <div
            className={`${accountStyles.slider.skeletonCard} ${skeletonClasses.shimmer}`}
            aria-hidden
          />
          <div
            className={`${accountStyles.slider.skeletonCard} ${skeletonClasses.shimmer}`}
            aria-hidden
          />
        </div>
      </div>

      <div className={accountStyles.totalBalanceLink.embeddedContainer} aria-hidden>
        <div
          className={`flex min-w-0 flex-1 items-center gap-3 sm:gap-4 ${skeletonClasses.shimmer}`}
        >
          <div className="size-12 shrink-0 rounded-xl bg-muted/60 sm:size-14" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-2.5 w-24 rounded bg-muted/50" />
            <div className="h-8 w-40 max-w-full rounded-md bg-muted/50 sm:h-9 sm:w-44" />
          </div>
        </div>
        <div
          className={`h-10 w-28 shrink-0 rounded-full bg-muted/50 sm:h-11 ${skeletonClasses.shimmer}`}
        />
      </div>
    </section>
  );
}

/**
 * Budget section skeleton loader
 * Shows loading state for budget cards with progress indicators
 */
export function BudgetSectionSkeleton() {
  return (
    <div className={budgetStyles.section.container}>
      <div className="mb-4 border-b border-border/40 pb-4 dark:border-border/35">
        <div className={`h-5 w-36 rounded-md ${skeletonClasses.shimmer}`} />
        <div className={`mt-2 h-3 w-48 rounded-md ${skeletonClasses.shimmer}`} />
      </div>

      <SkeletonList
        count={2}
        spacing="flex flex-col gap-4 sm:gap-5"
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
        spacing={dashboardStyles.recurringSection.skeletonListSpacing}
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
    <PageContainer>
      <DashboardHeaderSkeleton />
      <UserSelectorSkeleton />
      <main className={dashboardStyles.page.main}>
        <BalanceSectionSkeleton />
        <div className={dashboardStyles.divider} />
        <BudgetSectionSkeleton />
        <RecurringSeriesSkeleton />
      </main>
    </PageContainer>
  );
}
