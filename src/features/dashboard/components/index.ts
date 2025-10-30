/**
 * Dashboard Components Public API
 * Organized exports for all dashboard components
 */

// Layout Components
export * from './dashboard-grid';
export * from './metric-card';
export * from './stats-section';

// Skeleton Components
export {
  DashboardHeaderSkeleton,
  UserSelectorSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
  DashboardPageSkeleton,
} from './dashboard-skeletons';

// Legacy skeleton (kept for backward compatibility)
export * from './dashboard-skeleton';
