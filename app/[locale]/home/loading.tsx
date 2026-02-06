/**
 * Home Page Loading State
 * Shown while dashboard data is being prefetched and hydrated
 *
 * Uses centralized skeleton components from features/dashboard
 * Follows consistent design system and spacing patterns
 */

import {
  DashboardHeaderSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
} from '@/features/dashboard';
import { dashboardStyles } from '@/features/dashboard/theme/dashboard-styles';

export default function HomePageLoading() {
  return (
    <div className={dashboardStyles.page.container}>
      {/* Header Loading State */}
      <DashboardHeaderSkeleton />

      {/* Main Content Loading States */}
      <main className={dashboardStyles.page.main}>
        <div className={dashboardStyles.loading.content}>
          {/* Balance Section Skeleton */}
          <BalanceSectionSkeleton />

          {/* Budget Section Skeleton */}
          <BudgetSectionSkeleton />

          {/* Recurring Series Section Skeleton */}
          <RecurringSeriesSkeleton />
        </div>
      </main>
    </div>
  );
}
