/**
 * Dashboard Feature - Public API
 */

// Components
export {
  UserSelectorSkeleton,
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  RecurringSeriesSkeleton,
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
