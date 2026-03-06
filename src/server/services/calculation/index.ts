/**
 * Calculation Module
 *
 * Pure business logic for financial calculations.
 * No side effects, no database calls, fully testable.
 */

export {
  // Classification
  classifyTransaction,
  type TransactionClassification,
  type TransactionClassificationType,

  // Account Impact
  calculateAccountImpact,
  calculateBalanceFromTransactions,
  type AccountImpact,

  // Period Aggregation
  filterTransactionsByDateRange,
  aggregateTransactionsForPeriod,
  aggregateTransactionsForDateRange,
  type PeriodAggregation,

  // Budget Aggregation
  aggregateTransactionsForBudget,
  type BudgetAggregation,

  // Historical Balance
  calculateHistoricalBalance,

  // Overview Metrics
  calculateOverviewMetrics,
  type OverviewMetrics,

  // Utilities
  toAccountIdSet,
} from './transaction-impact';

// Recurring Series
export {
  calculateNextExecutionDate,
  calculateDaysUntilDue,
  isSeriesDue,
  getFrequencyLabel,
  formatDueDate,
  groupSeriesByUser,
  calculateMonthlyAmount,
  calculateTotals as calculateRecurringTotals,
  hasAccess as hasSeriesAccess,
  getAssociatedUsers as getSeriesAssociatedUsers,
} from './recurring-series';
