/**
 * Report Calculations Service
 * Calculates financial metrics and data for report generation
 * Handles aggregations, trends, and comparisons across time periods
 */

import { Account, Budget, BudgetPeriod, Transaction } from '@/lib/types';

/**
 * Category breakdown with metrics
 */
export interface CategoryMetrics {
  category: string;
  spent: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

/**
 * Monthly financial summary
 */
export interface MonthlySummary {
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
  savingsRate: number;
}

/**
 * Account breakdown data
 */
export interface AccountMetrics {
  accountId: string;
  accountName: string;
  accountType: string;
  balance: number;
  percentage: number;
}

/**
 * Report calculations service
 */
export class ReportCalculationsService {
  /**
   * Calculate category breakdown with spending metrics
   * @param transactions All transactions
   * @param currentMonthStart Start of current month
   * @param currentMonthEnd End of current month
   * @param previousMonthStart Start of previous month
   * @param previousMonthEnd End of previous month
   */
  static calculateCategoryBreakdown(
    transactions: Transaction[],
    currentMonthStart: Date,
    currentMonthEnd: Date,
    previousMonthStart: Date,
    previousMonthEnd: Date
  ): CategoryMetrics[] {
    // Filter current month expenses
    const currentMonthExpenses = transactions.filter(
      t =>
        t.type === 'expense' &&
        new Date(t.date) >= currentMonthStart &&
        new Date(t.date) <= currentMonthEnd
    );

    // Filter previous month expenses
    const previousMonthExpenses = transactions.filter(
      t =>
        t.type === 'expense' &&
        new Date(t.date) >= previousMonthStart &&
        new Date(t.date) <= previousMonthEnd
    );

    // Group by category
    const currentByCategory = this.groupByCategory(currentMonthExpenses);
    const previousByCategory = this.groupByCategory(previousMonthExpenses);

    // Calculate totals
    const totalCurrent = Object.values(currentByCategory).reduce((sum, amount) => sum + amount, 0);

    // Build metrics
    return Object.entries(currentByCategory)
      .map(([category, spent]) => {
        const percentage = totalCurrent > 0 ? (spent / totalCurrent) * 100 : 0;
        const previousSpent = previousByCategory[category] || 0;
        const trendPercent = previousSpent > 0 ? ((spent - previousSpent) / previousSpent) * 100 : 0;
        
        let trend: 'up' | 'down' | 'stable';
        if (Math.abs(trendPercent) < 5) {
          trend = 'stable';
        } else if (trendPercent > 0) {
          trend = 'up';
        } else {
          trend = 'down';
        }

        return {
          category,
          spent,
          percentage,
          trend,
          trendPercent,
        };
      })
      .sort((a, b) => b.spent - a.spent);
  }

  /**
   * Calculate 12-month trend data
   * @param transactions All transactions
   * @param endDate Current date (usually today)
   */
  static calculate12MonthTrend(
    transactions: Transaction[],
    endDate: Date = new Date()
  ): MonthlySummary[] {
    const months: MonthlySummary[] = [];

    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);

      const monthTransactions = transactions.filter(
        t =>
          new Date(t.date) >= monthStart &&
          new Date(t.date) <= monthEnd
      );

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netSavings = income - expenses;
      const savingsRate = income > 0 ? (netSavings / income) * 100 : 0;

      months.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
        income,
        expenses,
        netSavings,
        savingsRate,
      });
    }

    return months;
  }

  /**
   * Calculate month-over-month comparison
   * @param transactions All transactions
   */
  static calculateMonthComparison(
    transactions: Transaction[]
  ): {
    current: MonthlySummary;
    previous: MonthlySummary;
    changePercent: number;
  } {
    const now = new Date();
    const trend = this.calculate12MonthTrend(transactions, now);

    if (trend.length < 2) {
      return {
        current: trend[0] || { month: '', income: 0, expenses: 0, netSavings: 0, savingsRate: 0 },
        previous: { month: '', income: 0, expenses: 0, netSavings: 0, savingsRate: 0 },
        changePercent: 0,
      };
    }

    const current = trend.at(-1) || { month: '', income: 0, expenses: 0, netSavings: 0, savingsRate: 0 };
    const previous = trend.at(-2) || { month: '', income: 0, expenses: 0, netSavings: 0, savingsRate: 0 };

    const changePercent =
      previous.expenses > 0 ? ((current.expenses - previous.expenses) / previous.expenses) * 100 : 0;

    return { current, previous, changePercent };
  }

  /**
   * Calculate projected savings for the year
   * @param transactions All transactions
   * @param currentMonthDay Current day of month
   * @param daysInMonth Total days in current month
   */
  static calculateProjectedYearlySavings(
    transactions: Transaction[],
    currentMonthDay: number = new Date().getDate(),
    daysInMonth: number = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  ): {
    projectedYearly: number;
    currentMonthSavings: number;
    projectedMonthly: number;
  } {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthTransactions = transactions.filter(
      t =>
        new Date(t.date) >= monthStart &&
        new Date(t.date) <= monthEnd
    );

    const currentMonthIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthSavings = currentMonthIncome - currentMonthExpenses;

    // Project full month
    const projectedMonthly = (currentMonthSavings / currentMonthDay) * daysInMonth;

    // Project yearly
    const projectedYearly = projectedMonthly * 12;

    return {
      projectedYearly,
      currentMonthSavings,
      projectedMonthly,
    };
  }

  /**
   * Calculate account distribution
   * @param accounts All accounts with user access
   * @param transactions All transactions
   */
  static calculateAccountDistribution(
    accounts: Account[],
    transactions: Transaction[]
  ): AccountMetrics[] {
    const accountBalances: Record<string, number> = {};

    // Initialize account balances
    for (const account of accounts) {
      accountBalances[account.id] = 0;
    }

    // Calculate balances from transactions
    for (const transaction of transactions) {
      if (transaction.type === 'transfer' && transaction.to_account_id) {
        accountBalances[transaction.account_id] = (accountBalances[transaction.account_id] || 0) - transaction.amount;
        accountBalances[transaction.to_account_id] = (accountBalances[transaction.to_account_id] || 0) + transaction.amount;
      } else if (transaction.type === 'income') {
        accountBalances[transaction.account_id] = (accountBalances[transaction.account_id] || 0) + transaction.amount;
      } else if (transaction.type === 'expense') {
        accountBalances[transaction.account_id] = (accountBalances[transaction.account_id] || 0) - transaction.amount;
      }
    }

    const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + Math.abs(balance), 0);

    return accounts
      .map(account => ({
        accountId: account.id,
        accountName: account.name,
        accountType: account.type,
        balance: accountBalances[account.id] || 0,
        percentage: totalBalance > 0 ? (Math.abs(accountBalances[account.id] || 0) / totalBalance) * 100 : 0,
      }))
      .filter(a => a.balance >= 0)
      .sort((a, b) => b.balance - a.balance);
  }

  /**
   * Calculate budget vs spending for current period
   * @param budgets All budgets
   * @param transactions All transactions
   * @param budgetPeriods All budget periods
   */
  static calculateBudgetMetrics(
    budgets: Budget[],
    transactions: Transaction[],
    budgetPeriods: BudgetPeriod[]
  ) {
    const now = new Date();
    const activePeriods = budgetPeriods.filter(p => p.is_active);

    // Use the most recent active period, or default to current month
    const activePeriod = activePeriods.length > 0 ? activePeriods[0] : null;
    const periodStart = activePeriod ? new Date(activePeriod.start_date) : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = activePeriod?.end_date ? new Date(activePeriod.end_date) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const metrics = budgets.map(budget => {
      const spent = transactions
        .filter(
          t =>
            t.type === 'expense' &&
            budget.categories.includes(t.category) &&
            new Date(t.date) >= periodStart &&
            new Date(t.date) <= periodEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = Math.max(0, budget.amount - spent);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      let status: 'exceeded' | 'warning' | 'safe';
      if (percentage > 100) {
        status = 'exceeded';
      } else if (percentage > 75) {
        status = 'warning';
      } else {
        status = 'safe';
      }

      return {
        budgetId: budget.id,
        description: budget.description,
        amount: budget.amount,
        spent,
        remaining,
        percentage,
        status,
      };
    });

    return metrics.filter(m => m !== null);
  }

  /**
   * Helper: Group transactions by category
   */
  private static groupByCategory(transactions: Transaction[]): Record<string, number> {
    return transactions.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Helper: Calculate percentage change
   */
  static calculatePercentageChange(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }
}
