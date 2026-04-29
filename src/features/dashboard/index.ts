/**
 * Dashboard Feature - Public API
 */

// Components
export {
  DashboardHeaderSkeleton,
  UserSelectorSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
  DashboardPageSkeleton,
} from './components';

// Hooks
export { useDashboardContent } from './hooks';
export type { UseDashboardContentParams, UseDashboardContentReturn } from './hooks';

// Theme
export {
  dashboardStyles,
  getAccountCardStyles,
  getBalanceTextStyle,
  getBudgetStatusStyle,
} from './theme';
