/**
 * Chart Data Service
 * Centralized chart data preparation logic
 * Follows DRY principle - eliminates ~180 lines from budgets/page.tsx
 *
 * Handles all chart data transformations for:
 * - Line charts (Revolut-style cumulative spending)
 * - Bar charts (daily/category spending)
 * - Category breakdown charts
 */

import type { Budget, Transaction } from '@/src/lib/types';
import { calculateCumulativeSpending } from './financial-calculations.service';

/**
 * Line chart data point
 */
export interface LineChartDataPoint {
  day: string;
  value: number;
  x: number;
  y: number;
  isFuture: boolean;
}

/**
 * Line chart data structure
 */
export interface LineChartData {
  data: LineChartDataPoint[];
  maxValue: number;
  currentTotal: number;
  pathD: string;
}

/**
 * Category chart data structure
 */
export interface CategoryChartData {
  categories: string[];
  values: number[];
  total: number;
  percentages: number[];
}

/**
 * Daily expense data for stacked bar charts
 */
export interface DailyExpenseData {
  day: string;
  [category: string]: number | string;
}

/**
 * Prepare Revolut-style line chart data
 * Shows cumulative spending over time with smooth curves
 *
 * @param transactions - Filtered transactions for the period
 * @param budget - Budget to compare against
 * @param periodDays - Number of days in the period (typically 30)
 * @param periodStart - Start date of the period
 * @returns Line chart data ready for SVG rendering
 */
export function prepareLineChartData(
  transactions: Transaction[],
  budget: Budget,
  periodDays: number,
  periodStart: Date
): LineChartData {
  // Calculate cumulative spending
  const cumulative = calculateCumulativeSpending(transactions, periodDays, periodStart);

  // Filter out future days
  const pointsUpToToday = cumulative.filter(point => !point.isFuture);

  // Transform to chart coordinates
  const chartWidth = 350;
  const chartHeight = 180;
  const maxValue = budget.amount || 1; // Prevent division by zero

  const data: LineChartDataPoint[] = cumulative.map((point, index) => {
    const percentage = (point.cumulative / maxValue) * 100;
    const cappedPercentage = Math.min(percentage, 100);
    
    // Prevent division by zero for x coordinate
    const xPosition = periodDays > 1 
      ? (index / (periodDays - 1)) * chartWidth 
      : chartWidth / 2;
    
    // Calculate y position with safety checks
    const yPosition = chartHeight - ((cappedPercentage / 100) * 170); // 170 = chartHeight - padding

    return {
      day: point.day,
      value: point.cumulative,
      x: xPosition,
      y: Number.isNaN(yPosition) ? chartHeight : yPosition,
      isFuture: point.isFuture
    };
  });

  // Create smooth path with cubic bezier curves
  const visiblePoints = data.filter(p => !p.isFuture);
  const pathD = createSmoothPath(visiblePoints);

  return {
    data,
    maxValue,
    currentTotal: pointsUpToToday.at(-1)?.cumulative || 0,
    pathD
  };
}

/**
 * Create smooth SVG path with cubic bezier curves
 *
 * @param points - Chart data points
 * @returns SVG path d attribute string
 */
function createSmoothPath(points: LineChartDataPoint[]): string {
  if (points.length === 0) return '';

  const pathSegments = points.map((point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }

    const prevPoint = points[index - 1];
    const controlX1 = prevPoint.x + (point.x - prevPoint.x) / 3;
    const controlY1 = prevPoint.y;
    const controlX2 = prevPoint.x + (point.x - prevPoint.x) * 2 / 3;
    const controlY2 = point.y;

    return `C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${point.x} ${point.y}`;
  });

  return pathSegments.join(' ');
}

/**
 * Prepare category spending breakdown for pie/donut charts
 * Includes percentages and sorted by amount
 *
 * @param transactions - Expense transactions to analyze
 * @param categories - Categories to include
 * @returns Category breakdown data
 */
export function prepareCategoryChartData(
  transactions: Transaction[],
  categories: string[]
): CategoryChartData {
  // Calculate totals per category
  const categoryTotals = new Map<string, number>();

  for (const tx of transactions) {
    if ((tx.type === 'expense' || tx.type === 'transfer') && categories.includes(tx.category)) {
      categoryTotals.set(
        tx.category,
        (categoryTotals.get(tx.category) || 0) + tx.amount
      );
    }
  }

  // Convert to arrays and calculate total
  const categoryArray = Array.from(categoryTotals.entries());
  const total = categoryArray.reduce((sum, [, amount]) => sum + amount, 0);

  // Sort by amount (descending)
  categoryArray.sort((a, b) => b[1] - a[1]);

  // Calculate percentages
  const percentages = categoryArray.map(([, amount]) =>
    total > 0 ? Math.round((amount / total) * 100 * 100) / 100 : 0
  );

  return {
    categories: categoryArray.map(([cat]) => cat),
    values: categoryArray.map(([, amount]) => Math.round(amount * 100) / 100),
    total: Math.round(total * 100) / 100,
    percentages
  };
}

/**
 * Prepare daily expense data for stacked bar charts
 * Shows spending breakdown by category per day
 *
 * @param transactions - Transactions to analyze
 * @param categories - Categories to track
 * @param periodDays - Number of days to show
 * @param startDate - Period start date
 * @returns Daily expense data array
 */
export function prepareDailyExpenseData(
  transactions: Transaction[],
  categories: string[],
  periodDays: number,
  startDate: Date
): DailyExpenseData[] {
  const dailyData: DailyExpenseData[] = [];

  for (let i = 0; i < periodDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    // Filter transactions for this day
    const dayTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === date.getTime();
    });

    // Create expense data for this day
    const expenseData: Record<string, number | string> = {
      day: formatDayLabel(date, i, startDate)
    };

    for (const tx of dayTransactions) {
      if (tx.type === 'expense' && categories.includes(tx.category)) {
        expenseData[tx.category] = (expenseData[tx.category] as number || 0) + tx.amount;
      }
    }

    dailyData.push(expenseData as DailyExpenseData);
  }

  return dailyData;
}

/**
 * Prepare daily income data for comparison charts
 *
 * @param transactions - Transactions to analyze
 * @param periodDays - Number of days to show
 * @param startDate - Period start date
 * @returns Daily income data array
 */
export function prepareDailyIncomeData(
  transactions: Transaction[],
  periodDays: number,
  startDate: Date
): DailyExpenseData[] {
  const dailyData: DailyExpenseData[] = [];

  // Group by day
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    date.setHours(0, 0, 0, 0);

    const dayTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === date.getTime();
    });

    const incomeData: Record<string, number | string> = {
      day: formatDayLabel(date, i, startDate)
    };

    for (const tx of dayTransactions) {
      if (tx.type === 'income') {
        incomeData[tx.category] = (incomeData[tx.category] as number || 0) + tx.amount;
      }
    }

    dailyData.push(incomeData as DailyExpenseData);
  }

  return dailyData;
}

/**
 * Format day label for charts
 * Shows month on first day or when month changes
 *
 * @param date - Date to format
 * @param index - Day index in period
 * @param startDate - Period start date
 * @returns Formatted day label
 */
function formatDayLabel(date: Date, index: number, startDate: Date): string {
  const prevDate = index > 0 ? new Date(startDate) : null;
  if (prevDate) {
    prevDate.setDate(prevDate.getDate() + (index - 1));
  }

  const showMonth = index === 0 || !prevDate || date.getMonth() !== prevDate.getMonth();

  return showMonth
    ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
    : date.toLocaleDateString('it-IT', { day: 'numeric' });
}

/**
 * Calculate comparison with previous period
 * Used for showing trend indicators
 *
 * @param currentTransactions - Current period transactions
 * @param previousTransactions - Previous period transactions
 * @param type - Transaction type to compare
 * @returns Comparison data
 */
export function calculatePeriodComparison(
  currentTransactions: Transaction[],
  previousTransactions: Transaction[],
  type: 'expense' | 'income' | 'all' = 'all'
): {
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentageChange: number;
  isHigher: boolean;
} {
  const filterByType = (txs: Transaction[]) =>
    type === 'all' ? txs : txs.filter(tx => tx.type === type);

  const currentTotal = filterByType(currentTransactions)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const previousTotal = filterByType(previousTransactions)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const difference = currentTotal - previousTotal;
  let percentageChange: number;
  if (previousTotal > 0) {
    percentageChange = (difference / previousTotal) * 100;
  } else {
    percentageChange = currentTotal > 0 ? 100 : 0;
  }

  return {
    currentTotal: Math.round(currentTotal * 100) / 100,
    previousTotal: Math.round(previousTotal * 100) / 100,
    difference: Math.round(difference * 100) / 100,
    percentageChange: Math.round(percentageChange * 100) / 100,
    isHigher: difference > 0
  };
}

/**
 * Prepare spending trend data
 * Shows daily average and trajectory
 *
 * @param transactions - Transactions to analyze
 * @param periodDays - Number of days in period
 * @returns Trend analysis data
 */
export function prepareSpendingTrendData(
  transactions: Transaction[],
  periodDays: number
): {
  dailyAverage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  weeklyAverages: number[];
} {
  const expenses = transactions.filter(tx => tx.type === 'expense');
  const totalSpent = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const dailyAverage = periodDays > 0 ? totalSpent / periodDays : 0;

  // Calculate weekly averages for trend detection
  const weeksCount = Math.ceil(periodDays / 7);
  const weeklyAverages: number[] = [];

  for (let week = 0; week < weeksCount; week++) {
    const weekStart = week * 7;
    const weekEnd = Math.min((week + 1) * 7, periodDays);
    const weekDays = weekEnd - weekStart;

    const weekExpenses = expenses.filter(tx => {
      const txDate = new Date(tx.date);
      const dayIndex = Math.floor((txDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return dayIndex >= weekStart && dayIndex < weekEnd;
    });

    const weekTotal = weekExpenses.reduce((sum, tx) => sum + tx.amount, 0);
    weeklyAverages.push(weekDays > 0 ? weekTotal / weekDays : 0);
  }

  // Determine trend
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  if (weeklyAverages.length >= 2) {
    const firstHalf = weeklyAverages.slice(0, Math.floor(weeklyAverages.length / 2));
    const secondHalf = weeklyAverages.slice(Math.floor(weeklyAverages.length / 2));

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const changePercent = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;

    if (changePercent > 10) trend = 'increasing';
    else if (changePercent < -10) trend = 'decreasing';
  }

  return {
    dailyAverage: Math.round(dailyAverage * 100) / 100,
    trend,
    weeklyAverages: weeklyAverages.map(val => Math.round(val * 100) / 100)
  };
}
