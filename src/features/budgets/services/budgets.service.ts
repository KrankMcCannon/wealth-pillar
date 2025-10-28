/**
 * Budgets Service
 * Unified business logic for budgets feature
 * Handles data transformation, filtering, and calculations
 */

import {
  Budget,
  BudgetPeriod,
  Transaction,
} from '@/lib';
import { BudgetsViewModel, createBudgetsViewModel } from './budgets-view-model';

/**
 * Filter budgets based on user role and selection
 * Applies authorization logic to budget visibility
 */
export function filterBudgetsForUser(
  budgets: Budget[],
  userId: string,
  currentUser: { id: string; role: string; group_id: string } | null,
  users: { id: string; group_id: string }[]
): Budget[] {
  if (userId === 'all' && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')) {
    // Admin sees all budgets from users in their group
    return budgets.filter((budget) => {
      const budgetUser = users?.find((u) => u.id === budget.user_id);
      return budgetUser?.group_id === currentUser?.group_id;
    });
  }

  if (userId === 'all') {
    // Non-admin users see only their own budgets
    return budgets.filter((budget) => budget.user_id === currentUser?.id);
  }

  // Specific user selected
  return budgets.filter((budget) => budget.user_id === userId);
}

/**
 * Get active period for a user
 */
export function getUserActivePeriod(
  userId: string,
  periods: BudgetPeriod[]
): BudgetPeriod | null {
  return periods.find((p) => p.user_id === userId && p.is_active) || null;
}

/**
 * Create view model for a selected budget
 * Transforms raw data into UI-ready structure
 */
export function createBudgetDisplayModel(
  budget: Budget,
  transactions: Transaction[],
  period: BudgetPeriod | null
): BudgetsViewModel {
  return createBudgetsViewModel(budget, transactions, period);
}

/**
 * Calculate budget availability based on user and group
 */
export function isBudgetAvailable(
  budget: Budget,
  selectedViewUserId: string,
  currentUser: { id: string; role: string; group_id: string } | null,
  users: { id: string; group_id: string }[]
): boolean {
  const availableBudgets = filterBudgetsForUser(
    [budget],
    selectedViewUserId,
    currentUser,
    users
  );
  return availableBudgets.length > 0;
}

/**
 * Get first available budget for display
 * Falls back logic for budget selection
 */
export function getFirstAvailableBudget(
  budgets: Budget[],
  selectedViewUserId: string,
  currentUser: { id: string; role: string; group_id: string } | null,
  users: { id: string; group_id: string }[]
): Budget | null {
  const available = filterBudgetsForUser(budgets, selectedViewUserId, currentUser, users);
  return available[0] || null;
}

/**
 * Validate budget for operations
 * Ensures budget exists and is accessible to current user
 */
export function validateBudgetAccess(
  budgetId: string,
  budgets: Budget[],
  currentUser: { id: string; role: string; group_id: string } | null,
  users: { id: string; group_id: string }[]
): Budget | null {
  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) return null;

  // Check if user has access to this budget
  const userBudgets = filterBudgetsForUser(budgets, 'all', currentUser, users);
  return userBudgets.find((b) => b.id === budgetId) || null;
}

/**
 * Get budget with period information
 * Returns budget with its active period for display
 */
export function getBudgetWithPeriod(
  budget: Budget | null,
  periods: BudgetPeriod[]
): { budget: Budget | null; period: BudgetPeriod | null } {
  if (!budget) {
    return { budget: null, period: null };
  }

  const period = getUserActivePeriod(budget.user_id, periods);
  return { budget, period };
}
