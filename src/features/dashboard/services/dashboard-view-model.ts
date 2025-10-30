/**
 * Dashboard View Model
 * Transforms raw dashboard data into ready-for-UI structured data
 * Follows MVVM pattern - separates complex calculations from presentation
 * Reuses view models from budgets and other features
 */

import { Account, BudgetPeriod } from '@/src/lib';

/**
 * Account display information
 */
export interface AccountDisplay {
  id: string;
  name: string;
  balance: number;
  percentage: number; // of total balance
  isExpanded: boolean;
}

/**
 * Dashboard summary metrics
 */
export interface DashboardMetrics {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  accountCount: number;
  budgetCount: number;
  activeBudgetCount: number;
}

/**
 * Budget display card for dashboard
 */
export interface BudgetCardDisplay {
  id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  icon?: string;
  categories: string[];
  activePeriod: BudgetPeriod | null;
}

/**
 * Recurring series display
 */
export interface RecurringSeriesDisplay {
  id: string;
  description: string;
  amount: number;
  frequency: string;
  category: string;
  nextDate?: string;
  isActive: boolean;
}

/**
 * Complete Dashboard View Model
 */
export interface DashboardViewModel {
  metrics: DashboardMetrics;
  accounts: AccountDisplay[];
  budgets: BudgetCardDisplay[];
  recurringCount: number;
}

/**
 * Create Dashboard View Model
 * Transform raw data into view model ready for UI
 *
 * @param accounts - All accessible accounts
 * @param accountBalances - Calculated balances per account
 * @param totalBalance - Total balance across accounts
 * @param budgetsByUser - Budgets organized by user
 * @param recurringCount - Count of active recurring series
 * @returns Complete view model for dashboard
 */
export function createDashboardViewModel(
  accounts: Account[],
  accountBalances: Record<string, number>,
  totalBalance: number,
  budgetsByUser: Record<string, unknown>,
  recurringCount: number
): DashboardViewModel {
  // ========================================
  // Transform accounts to display format
  // ========================================
  const accountDisplays: AccountDisplay[] = accounts.map(account => ({
    id: account.id,
    name: account.name,
    balance: accountBalances[account.id] || 0,
    percentage:
      totalBalance !== 0
        ? Math.round(((accountBalances[account.id] || 0) / totalBalance) * 100)
        : 0,
    isExpanded: false,
  }));

  // ========================================
  // Transform budgets to display format
  // ========================================
  const budgetDisplays: BudgetCardDisplay[] = [];

  // Iterate through budgets by user and transform them
  for (const userKey in budgetsByUser) {
    const userData = budgetsByUser[userKey] as Record<string, unknown>;
    if (userData?.budgets && Array.isArray(userData.budgets)) {
      for (const budget of userData.budgets) {
        budgetDisplays.push({
          id: budget.id,
          name: budget.description,
          amount: budget.amount,
          spent: budget.spent,
          remaining: budget.remaining,
          percentage: budget.percentage,
          icon: budget.icon,
          categories: budget.categories,
          activePeriod: (userData.activePeriod as BudgetPeriod | null) || null,
        });
      }
    }
  }

  // ========================================
  // Calculate metrics
  // ========================================
  const activeBudgetCount = budgetDisplays.filter(b => {
    // Check if budget has active period
    return b.activePeriod && b.activePeriod.is_active;
  }).length;

  const metrics: DashboardMetrics = {
    totalBalance,
    totalIncome: 0, // Would be calculated from transactions if needed
    totalExpenses: 0, // Would be calculated from transactions if needed
    netFlow: 0, // Would be calculated from transactions if needed
    accountCount: accounts.length,
    budgetCount: budgetDisplays.length,
    activeBudgetCount,
  };

  // ========================================
  // Assemble view model
  // ========================================
  return {
    metrics,
    accounts: accountDisplays,
    budgets: budgetDisplays,
    recurringCount,
  };
}

/**
 * Create empty dashboard view model
 * Used when no data is available
 */
export function createEmptyDashboardViewModel(): DashboardViewModel {
  return {
    metrics: {
      totalBalance: 0,
      totalIncome: 0,
      totalExpenses: 0,
      netFlow: 0,
      accountCount: 0,
      budgetCount: 0,
      activeBudgetCount: 0,
    },
    accounts: [],
    budgets: [],
    recurringCount: 0,
  };
}
