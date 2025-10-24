/**
 * Budgets View Model
 * Transforms raw budget data into ready-for-UI structured data
 * Follows MVVM pattern - separates complex budget calculations from presentation
 */

import { Budget, BudgetPeriod, BudgetProgress, calculateBudgetProgress, calculateDaysRemaining, calculatePeriodComparison, CategoryChartData, DayGroup, filterByBudgetScope, groupTransactionsByDay, LineChartData, prepareCategoryChartData, prepareLineChartData, Transaction } from '@/src/lib';

/**
 * Budget info (simplified budget data)
 */
export interface BudgetInfo {
  id: string;
  description: string;
  amount: number;
  categories: string[];
  userId: string;
  icon?: string;
  type: string;
}

/**
 * Period info (formatted period data)
 */
export interface PeriodInfo {
  startDate: string;
  endDate: string | null;
  daysRemaining: number;
  daysElapsed: number;
  isActive: boolean;
  formattedDateRange: string;
}

/**
 * Financial metrics (budget spending summary)
 */
export interface FinancialMetrics {
  totalBudgeted: number;
  totalSpent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  status: 'safe' | 'warning' | 'danger';
  projectedSpending: number;
  dailyBurnRate: number;
}

/**
 * Period comparison data
 */
export interface PeriodComparison {
  currentTotal: number;
  previousTotal: number;
  difference: number;
  percentageChange: number;
  isHigher: boolean;
}

/**
 * Complete Budgets View Model
 */
export interface BudgetsViewModel {
  budgetInfo: BudgetInfo;
  financialMetrics: FinancialMetrics;
  periodInfo: PeriodInfo | null;
  chartData: LineChartData;
  categoryBreakdown: CategoryChartData;
  groupedTransactions: DayGroup[];
  transactionCount: number;
  periodComparison: PeriodComparison | null;
  progressData: BudgetProgress;
}

/**
 * Create Budgets View Model
 * Main factory function that transforms raw budget data into complete view model
 *
 * @param budget - Budget to analyze
 * @param allTransactions - All transactions from API
 * @param currentPeriod - Current active budget period (if any)
 * @returns Complete view model ready for UI
 */
export function createBudgetsViewModel(
  budget: Budget,
  allTransactions: Transaction[],
  currentPeriod: BudgetPeriod | null
): BudgetsViewModel {
  // ========================================
  // Step 1: Filter transactions by budget scope
  // ========================================
  const periodDates = currentPeriod
    ? { start: currentPeriod.start_date, end: currentPeriod.end_date }
    : undefined;

  const budgetTransactions = filterByBudgetScope(
    allTransactions,
    budget,
    periodDates
  );

  // ========================================
  // Step 2: Calculate total spent (expenses, transfers - income)
  // ========================================
  const totalSpent = budgetTransactions.reduce((sum, tx) => {
    if (tx.type === 'expense' || tx.type === 'transfer') return sum + tx.amount;
    if (tx.type === 'income') return sum - tx.amount;
    return sum;
  }, 0);

  // ========================================
  // Step 3: Calculate budget progress
  // ========================================
  const progressData = calculateBudgetProgress(budget, totalSpent);

  // ========================================
  // Step 4: Calculate period metrics
  // ========================================
  let periodInfo: PeriodInfo | null = null;
  let dailyBurnRate = 0;
  let projectedSpending = 0;

  if (currentPeriod) {
    const startDate = new Date(currentPeriod.start_date);
    const now = new Date();

    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = currentPeriod.end_date
      ? calculateDaysRemaining(currentPeriod.end_date)
      : 0;

    dailyBurnRate = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
    projectedSpending = dailyBurnRate * (daysElapsed + daysRemaining);

    periodInfo = {
      startDate: typeof currentPeriod.start_date === 'string'
        ? currentPeriod.start_date
        : currentPeriod.start_date.toISOString(),
      endDate: currentPeriod.end_date
        ? (typeof currentPeriod.end_date === 'string'
          ? currentPeriod.end_date
          : currentPeriod.end_date.toISOString())
        : null,
      daysRemaining,
      daysElapsed,
      isActive: currentPeriod.is_active,
      formattedDateRange: formatPeriodDateRange(
        currentPeriod.start_date,
        currentPeriod.end_date
      )
    };
  }

  // ========================================
  // Step 5: Prepare chart data
  // ========================================
  const periodStart = currentPeriod?.start_date
    ? new Date(currentPeriod.start_date)
    : new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);

  const chartData = prepareLineChartData(
    budgetTransactions,
    budget,
    30,
    periodStart
  );

  // ========================================
  // Step 6: Prepare category breakdown
  // ========================================
  const categoryBreakdown = prepareCategoryChartData(
    budgetTransactions,
    budget.categories
  );

  // ========================================
  // Step 7: Group transactions by day
  // ========================================
  const groupedTransactions = groupTransactionsByDay(budgetTransactions);

  // ========================================
  // Step 8: Calculate period comparison
  // ========================================
  let periodComparison: PeriodComparison | null = null;

  if (currentPeriod?.start_date) {
    const currentStart = new Date(currentPeriod.start_date);
    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - 30);
    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);

    const previousTransactions = filterByBudgetScope(
      allTransactions,
      budget,
      {
        start: previousStart,
        end: previousEnd
      }
    );

    const currentSpendingTransactions = budgetTransactions.filter(tx => tx.type === 'expense' || tx.type === 'transfer');
    const previousSpendingTransactions = previousTransactions.filter(tx => tx.type === 'expense' || tx.type === 'transfer');

    periodComparison = calculatePeriodComparison(
      currentSpendingTransactions,
      previousSpendingTransactions,
      'all'
    );
  }

  // ========================================
  // Step 9: Assemble view model
  // ========================================
  return {
    budgetInfo: {
      id: budget.id,
      description: budget.description,
      amount: budget.amount,
      categories: budget.categories,
      userId: budget.user_id,
      icon: budget.icon,
      type: budget.type
    },
    financialMetrics: {
      totalBudgeted: budget.amount,
      totalSpent: progressData.spent,
      remaining: progressData.remaining,
      percentage: progressData.percentage,
      isOverBudget: progressData.isOverBudget,
      status: progressData.status,
      projectedSpending: roundToTwoDecimals(projectedSpending),
      dailyBurnRate: roundToTwoDecimals(dailyBurnRate)
    },
    periodInfo,
    chartData,
    categoryBreakdown,
    groupedTransactions,
    transactionCount: budgetTransactions.length,
    periodComparison,
    progressData
  };
}

/**
 * Create empty budgets view model
 * Used when no budget is selected
 */
export function createEmptyBudgetsViewModel(): BudgetsViewModel {
  return {
    budgetInfo: {
      id: '',
      description: '',
      amount: 0,
      categories: [],
      userId: '',
      type: 'monthly'
    },
    financialMetrics: {
      totalBudgeted: 0,
      totalSpent: 0,
      remaining: 0,
      percentage: 0,
      isOverBudget: false,
      status: 'safe',
      projectedSpending: 0,
      dailyBurnRate: 0
    },
    periodInfo: null,
    chartData: {
      data: [],
      maxValue: 0,
      currentTotal: 0,
      pathD: ''
    },
    categoryBreakdown: {
      categories: [],
      values: [],
      total: 0,
      percentages: []
    },
    groupedTransactions: [],
    transactionCount: 0,
    periodComparison: null,
    progressData: {
      spent: 0,
      remaining: 0,
      percentage: 0,
      isOverBudget: false,
      status: 'safe'
    }
  };
}

/**
 * Format period date range for display
 */
function formatPeriodDateRange(
  startDate: string | Date,
  endDate: string | Date | null
): string {
  const start = new Date(startDate);
  const startFormatted = start.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short'
  });

  if (!endDate) {
    return `${startFormatted} - In corso`;
  }

  const end = new Date(endDate);
  const endFormatted = end.toLocaleDateString('it-IT', {
    day: 'numeric',
    month: 'short'
  });

  return `${startFormatted} - ${endFormatted}`;
}

/**
 * Helper: Round to 2 decimal places
 */
function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
