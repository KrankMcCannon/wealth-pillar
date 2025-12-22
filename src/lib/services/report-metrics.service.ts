/**
 * Report Metrics Service
 * Comprehensive financial metrics calculations for reports page
 * Provides both account-based and budget-based perspectives
 * Note: This service now wraps FinanceLogicService to centralize business logic.
 */

import type { Transaction } from '@/lib/types';
import { FinanceLogicService } from './finance-logic.service';
import type {
  OverviewMetrics,
  AccountBasedMetrics,
  BudgetBasedMetrics
} from './finance-logic.service';

// Re-export types for backward compatibility
export type { OverviewMetrics, AccountBasedMetrics, BudgetBasedMetrics };

/**
 * Report Metrics Service
 * Wraps FinanceLogicService for consistent metrics calculation on the reports page.
 */
export class ReportMetricsService {
  /**
   * Calculate overall metrics across all transactions
   */
  static calculateOverviewMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): OverviewMetrics {
    return FinanceLogicService.calculateOverviewMetrics(transactions, userAccountIds, userId);
  }

  /**
   * Calculate account-based metrics (excludes internal transfers)
   */
  static calculateAccountBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): AccountBasedMetrics {
    return FinanceLogicService.calculateAccountBasedMetrics(transactions, userAccountIds, userId);
  }

  /**
   * Calculate budget-based metrics (includes all transfers)
   */
  static calculateBudgetBasedMetrics(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): BudgetBasedMetrics {
    return FinanceLogicService.calculateBudgetBasedMetrics(transactions, userAccountIds, userId);
  }

  /**
   * Calculate total transferred amount
   */
  static calculateTotalTransferred(
    transactions: Transaction[],
    userAccountIds: string[],
    userId?: string
  ): number {
    const metrics = FinanceLogicService.calculateOverviewMetrics(transactions, userAccountIds, userId);
    return metrics.totalTransferred;
  }
}
