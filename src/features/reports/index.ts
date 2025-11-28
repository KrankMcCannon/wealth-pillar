/**
 * Reports Feature - Centralized Public API
 *
 * This feature provides comprehensive financial reporting and analytics
 * for the Wealth Pillar application, including spending analysis, savings
 * tracking, and account distribution visualization.
 *
 * Components:
 * - ReportHeader: Month/year selector with export button
 * - SpendingOverviewCard: Income, expenses, and savings summary
 * - CategoryBreakdownSection: Top spending categories with trends
 * - SavingsGoalCard: Annual savings goal progress and projections
 * - AccountDistributionCard: Fund distribution across account types
 *
 * Services:
 * - ReportCalculationsService: Financial metrics and trend calculations
 *
 * Theme:
 * - reportsTokens: Design system tokens
 * - reportsStyles: Centralized style utilities
 */

// Components
export * from './components';

// Theme
export { reportsTokens, reportsStyles } from './theme';
