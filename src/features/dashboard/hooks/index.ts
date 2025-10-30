/**
 * Dashboard Hooks Public API
 * Organized exports for data, state, and form controllers
 */

// Data Loading Hooks
export { useDashboardData, isSectionReady } from './useDashboardData';
export type { DashboardDataSection, DashboardDataState } from './useDashboardData';

// State Management Hook
export { useDashboardState } from './useDashboardState';
export type { DashboardPageState, DashboardPageActions } from './useDashboardState';

// Specialized Hooks (legacy - kept for backward compatibility)
export { useDashboardCore } from './use-dashboard-core';
export { default as useDashboardBudgets } from './use-dashboard-budgets';
export { useReportsController } from './use-reports-controller';
export { useSettingsController } from './use-settings-controller';
export { useInvestmentsController } from './use-investments-controller';
export { default as useDashboard } from './use-dashboard';
