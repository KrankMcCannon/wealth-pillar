/**
 * Financial Calculations Service
 * Centralized financial computation logic
 * Follows DRY principle - eliminates 200+ lines of duplicate calculations
 *
 * All calculations include proper rounding and safety checks
 */

import type { Transaction, Budget, InvestmentHolding } from '@/lib/types';

/**
 * Budget progress data
 */
export interface BudgetProgress {
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning' | 'danger';
}

/**
 * Portfolio metrics data
 */
export interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGain: number;
  totalGainPercentage: number;
  dayGain: number;
  dayGainPercentage: number;
}

/**
 * Monthly financial summary
 */
export interface MonthlyFinancials {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netIncome: number;
  savingsRate: number;
  transactionCount: number;
}

/**
 * Cumulative spending data point
 */
export interface CumulativeDataPoint {
  day: string;
  cumulative: number;
  date: Date;
  isFuture: boolean;
}

/**
 * Calculate budget progress with status indicators
 * Includes safety checks and proper rounding
 *
 * @param budget - Budget to analyze
 * @param spent - Amount spent
 * @returns Budget progress metrics
 */
export function calculateBudgetProgress(
  budget: Budget,
  spent: number
): BudgetProgress {
  const remaining = Math.max(0, budget.amount - spent);
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  const isOverBudget = spent > budget.amount;

  // Determine status
  let status: 'safe' | 'warning' | 'danger' = 'safe';
  if (percentage >= 100) {
    status = 'danger';
  } else if (percentage >= 80) {
    status = 'warning';
  }

  return {
    spent: roundToTwoDecimals(spent),
    remaining: roundToTwoDecimals(remaining),
    percentage: roundToTwoDecimals(percentage),
    isOverBudget,
    status
  };
}

/**
 * Calculate portfolio metrics from holdings
 * Includes total value, gains, and percentages
 *
 * @param holdings - Investment holdings
 * @returns Portfolio performance metrics
 */
export function calculatePortfolioMetrics(
  holdings: InvestmentHolding[]
): PortfolioMetrics {
  let totalValue = 0;
  let totalCost = 0;
  let dayGain = 0;

  for (const holding of holdings) {
    const currentValue = holding.quantity * holding.current_price;
    const costBasis = holding.quantity * holding.purchase_price;

    totalValue += currentValue;
    totalCost += costBasis;

    // Day gain calculation (if available)
    // Note: day_change_percentage is not in base type but may be added by external APIs
    const holdingWithDayChange = holding as InvestmentHolding & { day_change_percentage?: number };
    if (holdingWithDayChange.day_change_percentage !== undefined) {
      const previousValue = currentValue / (1 + holdingWithDayChange.day_change_percentage / 100);
      dayGain += (currentValue - previousValue);
    }
  }

  const totalGain = totalValue - totalCost;
  const totalGainPercentage = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const dayGainPercentage = totalValue > 0 ? (dayGain / totalValue) * 100 : 0;

  return {
    totalValue: roundToTwoDecimals(totalValue),
    totalCost: roundToTwoDecimals(totalCost),
    totalGain: roundToTwoDecimals(totalGain),
    totalGainPercentage: roundToTwoDecimals(totalGainPercentage),
    dayGain: roundToTwoDecimals(dayGain),
    dayGainPercentage: roundToTwoDecimals(dayGainPercentage)
  };
}

/**
 * Calculate monthly financial summary
 * Aggregates income, expenses, transfers for a month
 *
 * @param transactions - Transactions (should be filtered to current month)
 * @returns Monthly financial metrics
 */
export function calculateMonthlyFinancials(
  transactions: Transaction[]
): MonthlyFinancials {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalTransfers = 0;

  for (const tx of transactions) {
    switch (tx.type) {
      case 'income':
        totalIncome += tx.amount;
        break;
      case 'expense':
        totalExpenses += tx.amount;
        break;
      case 'transfer':
        totalTransfers += tx.amount;
        break;
    }
  }

  const netIncome = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

  return {
    totalIncome: roundToTwoDecimals(totalIncome),
    totalExpenses: roundToTwoDecimals(totalExpenses),
    totalTransfers: roundToTwoDecimals(totalTransfers),
    netIncome: roundToTwoDecimals(netIncome),
    savingsRate: roundToTwoDecimals(savingsRate),
    transactionCount: transactions.length
  };
}

/**
 * Calculate cumulative spending over time
 * Used for line charts and spending trends
 *
 * @param transactions - Transactions (should be sorted by date)
 * @param periodDays - Number of days to calculate over
 * @param startDate - Period start date
 * @returns Array of cumulative data points
 */
export function calculateCumulativeSpending(
  transactions: Transaction[],
  periodDays: number,
  startDate: Date
): CumulativeDataPoint[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cumulativeData: CumulativeDataPoint[] = [];
  let cumulativeTotal = 0;

  for (let i = 0; i < periodDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    // Find transactions for this day
    const dayTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === date.getTime();
    });

    // Calculate day total
    const dayTotal = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    cumulativeTotal += dayTotal;

    // Format day label
    const showMonth = i === 0 || date.getDate() === 1;
    const dayLabel = showMonth
      ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
      : date.toLocaleDateString('it-IT', { day: 'numeric' });

    cumulativeData.push({
      day: dayLabel,
      cumulative: roundToTwoDecimals(cumulativeTotal),
      date,
      isFuture: date > today
    });
  }

  return cumulativeData;
}

/**
 * Calculate average daily spending
 *
 * @param transactions - Transactions to analyze
 * @param days - Number of days in period
 * @returns Average daily spending
 */
export function calculateAverageDailySpending(
  transactions: Transaction[],
  days: number
): number {
  if (days <= 0) return 0;

  const total = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return roundToTwoDecimals(total / days);
}

/**
 * Calculate savings rate
 *
 * @param income - Total income
 * @param expenses - Total expenses
 * @returns Savings rate as percentage
 */
export function calculateSavingsRate(income: number, expenses: number): number {
  if (income <= 0) return 0;
  const savings = income - expenses;
  return roundToTwoDecimals((savings / income) * 100);
}

/**
 * Calculate budget utilization percentage
 *
 * @param spent - Amount spent
 * @param budgeted - Budgeted amount
 * @returns Utilization percentage
 */
export function calculateBudgetUtilization(spent: number, budgeted: number): number {
  if (budgeted <= 0) return 0;
  return roundToTwoDecimals((spent / budgeted) * 100);
}

/**
 * Calculate days remaining in period
 *
 * @param endDate - Period end date
 * @returns Number of days remaining (0 if past)
 */
export function calculateDaysRemaining(endDate: Date | string): number {
  const end = new Date(endDate);
  const now = new Date();

  const diff = end.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(0, days);
}

/**
 * Calculate monthly burn rate (daily spending rate)
 *
 * @param totalSpent - Total amount spent
 * @param daysElapsed - Number of days in period
 * @param daysRemaining - Days remaining in period
 * @returns Projected month-end spending
 */
export function calculateMonthlyBurnRate(
  totalSpent: number,
  daysElapsed: number,
  daysRemaining: number
): number {
  if (daysElapsed <= 0) return 0;

  const dailyRate = totalSpent / daysElapsed;
  const projectedTotal = dailyRate * (daysElapsed + daysRemaining);

  return roundToTwoDecimals(projectedTotal);
}

/**
 * Round number to 2 decimal places
 * Consistent rounding across all financial calculations
 *
 * @param value - Number to round
 * @returns Rounded number
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Format number as currency (EUR)
 * Can be moved to utils if needed elsewhere
 *
 * @param value - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

/**
 * Calculate percentage change between two values
 *
 * @param previous - Previous value
 * @param current - Current value
 * @returns Percentage change
 */
export function calculatePercentageChange(previous: number, current: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return roundToTwoDecimals(((current - previous) / previous) * 100);
}
