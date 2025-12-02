/**
 * Reports Feature - Centralized Public API
 *
 * This feature provides comprehensive financial reporting and analytics
 * for the Wealth Pillar application, including budget period analysis,
 * transaction splitting (earned vs spent), and category breakdowns.
 *
 * Active Components:
 * - TransactionSplitCard: Side-by-side earned vs spent display
 * - BudgetPeriodsSection: All budget periods with metrics and charts
 * - BudgetPeriodCard: Individual period card with expandable chart
 * - CategoryBreakdownSection: Top 5 categories per budget period
 *
 * Utilities:
 * - period-calculations: Earned/spent/gain calculation logic
 *
 * Theme:
 * - reportsTokens: Design system tokens
 * - reportsStyles: Centralized style utilities
 */

// Components
export * from './components';

// Theme
export { reportsTokens, reportsStyles } from './theme';
