import type { CategoryBreakdownItem, Transaction } from '@/lib/types';
import {
  formatDateSmart,
  toDateTime,
} from '@/lib/utils/date-utils';
import { FinanceLogicService } from './finance-logic.service';

/**
 * Report metrics calculated from transactions
 */
export interface ReportMetrics {
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
  categories: CategoryMetric[];
}

/**
 * Category spending metrics
 */
export interface CategoryMetric {
  name: string;
  amount: number;
  percentage: number;
  trend?: 'up' | 'down' | 'stable';
}

/**
 * Transaction Logic
 * Pure functions for transaction calculations, safe for Client Components
 */
export class TransactionLogic {
  /**
   * Calculate report metrics from transactions
   */
  static calculateReportMetrics(
    transactions: Transaction[],
    userId?: string
  ): ReportMetrics {
    const userIdFilter = userId || undefined;
    const breakdown = FinanceLogicService.calculateCategoryBreakdown(
      transactions.filter(t => !userIdFilter || t.user_id === userIdFilter)
    );

    const income = breakdown
      .filter((item: CategoryBreakdownItem) => item.received > 0)
      .reduce((sum: number, item: CategoryBreakdownItem) => sum + item.received, 0);

    const expenses = breakdown
      .filter((item: CategoryBreakdownItem) => item.spent > 0)
      .reduce((sum: number, item: CategoryBreakdownItem) => sum + item.spent, 0);

    const netSavings = income - expenses;
    const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

    return {
      income,
      expenses,
      netSavings,
      savingsRate,
      categories: breakdown.map((item: CategoryBreakdownItem) => ({
        name: item.category,
        amount: item.spent,
        percentage: item.percentage
      }))
    };
  }

  /**
   * Group transactions by date
   */
  static groupTransactionsByDate(
    transactions: Transaction[],
    locale: string = 'it-IT'
  ): Record<string, Transaction[]> {
    return transactions.reduce(
      (groups: Record<string, Transaction[]>, transaction) => {
        const txDate = toDateTime(transaction.date);
        if (!txDate) return groups;

        const dateLabel = formatDateSmart(txDate, locale);

        if (!groups[dateLabel]) {
          groups[dateLabel] = [];
        }

        groups[dateLabel].push(transaction);
        return groups;
      },
      {}
    );
  }

  /**
   * Calculate daily totals from grouped transactions
   */
  static calculateDailyTotals(
    groupedTransactions: Record<string, Transaction[]>
  ): Record<string, { income: number; expense: number }> {
    const totals: Record<string, { income: number; expense: number }> = {};

    Object.entries(groupedTransactions).forEach(([date, transactions]) => {
      totals[date] = transactions.reduce(
        (acc, t) => {
          if (t.type === 'income') {
            acc.income += t.amount;
          } else if (t.type === 'expense') {
            acc.expense += t.amount;
          }
          return acc;
        },
        { income: 0, expense: 0 }
      );
    });

    return totals;
  }
}
