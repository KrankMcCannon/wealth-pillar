/**
 * Budget Calculation Utilities
 * Centralized logic for budget metrics, grouping, and analysis
 * Follows DRY principle - eliminates duplicate calculation logic
 */

import { Budget, BudgetPeriod, Transaction, User } from "@/lib";

export interface BudgetWithMetrics extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  transactionCount: number;
  relevantTransactions: Transaction[];
  currentPeriod: BudgetPeriod | null;
  periodStartDate: string | null;
  periodEndDate: string | null;
}

/**
 * Calculate comprehensive metrics for a single budget
 * Uses O(1) category lookup with Map for optimal performance
 *
 * @param budget - Budget to calculate metrics for
 * @param transactions - All transactions (will be filtered)
 * @param currentPeriod - Current active budget period (if any)
 * @returns Budget with calculated metrics
 */
export function calculateBudgetMetrics(
  budget: Budget,
  transactions: Transaction[],
  currentPeriod: BudgetPeriod | null
): BudgetWithMetrics {
  // Determine date range
  let periodStartDate: string | null = null;
  let periodEndDate: string | null = null;

  if (currentPeriod) {
    periodStartDate = typeof currentPeriod.start_date === 'string'
      ? currentPeriod.start_date
      : currentPeriod.start_date.toISOString();
    periodEndDate = currentPeriod.end_date
      ? (typeof currentPeriod.end_date === 'string'
        ? currentPeriod.end_date
        : currentPeriod.end_date.toISOString())
      : null;
  }

  // Filter transactions by budget's user and date range
  const relevantTransactions = transactions.filter(t => {
    // Must match user
    if (t.user_id !== budget.user_id) return false;

    // Must be expense type
    if (t.type !== 'expense') return false;

    // Must be in budget categories
    if (!budget.categories.includes(t.category)) return false;

    // Must be in date range if period exists
    if (periodStartDate && new Date(t.date).toISOString() < periodStartDate) return false;
    if (periodEndDate && new Date(t.date).toISOString() > periodEndDate) return false;

    return true;
  });

  // Calculate spent amount - O(n) single pass
  const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);

  // Budget.amount is the total budget amount (not per-category)
  const totalBudgeted = budget.amount;

  // Calculate metrics
  const remaining = Math.max(0, totalBudgeted - spent);
  const percentage = totalBudgeted > 0 ? (spent / totalBudgeted) * 100 : 0;

  return {
    ...budget,
    spent: Math.round(spent * 100) / 100, // Round to 2 decimals
    remaining: Math.round(remaining * 100) / 100,
    percentage: Math.round(percentage * 100) / 100,
    transactionCount: relevantTransactions.length,
    relevantTransactions,
    currentPeriod,
    periodStartDate,
    periodEndDate,
  };
}

/**
 * Calculate metrics for multiple budgets efficiently
 * Pre-builds transaction map for O(1) lookup per budget
 *
 * @param budgets - Array of budgets to process
 * @param transactions - All transactions
 * @param budgetPeriods - All budget periods
 * @returns Array of budgets with metrics
 */
export function calculateMultipleBudgetMetrics(
  budgets: Budget[],
  transactions: Transaction[],
  budgetPeriods: BudgetPeriod[]
): BudgetWithMetrics[] {
  // Build category map for O(1) lookups - O(n)
  const transactionsByCategory = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    if (tx.type === 'expense') {
      if (!transactionsByCategory.has(tx.category)) {
        transactionsByCategory.set(tx.category, []);
      }
      transactionsByCategory.get(tx.category)!.push(tx);
    }
  }

  // Build period map for O(1) lookups - O(p)
  const periodsByUser = new Map<string, BudgetPeriod | null>();
  for (const period of budgetPeriods) {
    if (period.is_active) {
      periodsByUser.set(period.user_id, period);
    }
  }

  // Calculate metrics for each budget - O(budgets * categories)
  return budgets.map(budget => {
    const currentPeriod = periodsByUser.get(budget.user_id) || null;

    // Get relevant transactions using category map
    const relevantTransactions: Transaction[] = [];

    for (const category of budget.categories) {
      const categoryTransactions = transactionsByCategory.get(category) || [];

      for (const tx of categoryTransactions) {
        // Filter by user
        if (tx.user_id !== budget.user_id) continue;

        // Filter by date range if period exists
        if (currentPeriod) {
          const txDate = new Date(tx.date);
          const periodStart = new Date(currentPeriod.start_date);
          const periodEnd = currentPeriod.end_date ? new Date(currentPeriod.end_date) : null;

          if (txDate < periodStart) continue;
          if (periodEnd && txDate > periodEnd) continue;
        }

        relevantTransactions.push(tx);
      }
    }

    const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalBudgeted = budget.amount;

    const remaining = Math.max(0, totalBudgeted - spent);
    const percentage = totalBudgeted > 0 ? (spent / totalBudgeted) * 100 : 0;

    // Convert dates to strings for consistency
    const periodStartDate = currentPeriod
      ? (typeof currentPeriod.start_date === 'string'
        ? currentPeriod.start_date
        : currentPeriod.start_date.toISOString())
      : null;

    const periodEndDate = currentPeriod?.end_date
      ? (typeof currentPeriod.end_date === 'string'
        ? currentPeriod.end_date
        : currentPeriod.end_date.toISOString())
      : null;

    return {
      ...budget,
      spent: Math.round(spent * 100) / 100,
      remaining: Math.round(remaining * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      transactionCount: relevantTransactions.length,
      relevantTransactions,
      currentPeriod,
      periodStartDate,
      periodEndDate,
    };
  });
}

/**
 * Group budgets by user
 * Returns a Map for O(1) user lookup
 *
 * @param budgets - Array of budgets with metrics
 * @param users - Array of users
 * @returns Map of user ID to their budgets
 */
export function groupBudgetsByUser(
  budgets: BudgetWithMetrics[],
  users: User[]
): Map<string, BudgetWithMetrics[]> {
  const grouped = new Map<string, BudgetWithMetrics[]>();

  // Initialize with all users - O(u)
  for (const user of users) {
    grouped.set(user.id, []);
  }

  // Group budgets - O(b)
  for (const budget of budgets) {
    const userBudgets = grouped.get(budget.user_id) || [];
    userBudgets.push(budget);
    grouped.set(budget.user_id, userBudgets);
  }

  return grouped;
}

/**
 * Calculate total budget metrics across all budgets
 *
 * @param budgets - Array of budgets with metrics
 * @returns Aggregated metrics
 */
export function calculateTotalBudgetMetrics(budgets: BudgetWithMetrics[]): {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
  budgetCount: number;
  transactionCount: number;
} {
  let totalBudgeted = 0;
  let totalSpent = 0;
  let transactionCount = 0;

  for (const budget of budgets) {
    totalBudgeted += budget.amount;
    totalSpent += budget.spent;
    transactionCount += budget.transactionCount;
  }

  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  return {
    totalBudgeted: Math.round(totalBudgeted * 100) / 100,
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalRemaining: Math.round(totalRemaining * 100) / 100,
    overallPercentage: Math.round(overallPercentage * 100) / 100,
    budgetCount: budgets.length,
    transactionCount,
  };
}
