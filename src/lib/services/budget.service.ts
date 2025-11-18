import { supabaseServer } from '@/lib/database/server';
import { cached, budgetCacheKeys, cacheOptions } from '@/lib/cache';
import type { ServiceResult } from './user.service';
import type { Budget, Transaction, User, BudgetPeriod } from '@/lib/types';

/**
 * Budget progress data for a single budget
 */
export interface BudgetProgress {
  id: string;
  description: string;
  amount: number;
  spent: number;
  remaining: number;
  percentage: number;
  categories: string[];
  transactionCount: number;
}

/**
 * Complete budget summary for a user
 */
export interface UserBudgetSummary {
  user: User;
  budgets: BudgetProgress[];
  activePeriod: BudgetPeriod | undefined;
  periodStart: string | null;
  periodEnd: string | null;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  overallPercentage: number;
}

/**
 * Budget Service
 * Handles all budget-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class BudgetService {
  /**
   * Retrieves a budget by ID
   *
   * @param budgetId - Budget ID
   * @returns Budget data or error
   *
   * @example
   * const { data: budget, error } = await BudgetService.getBudgetById(budgetId);
   */
  static async getBudgetById(
    budgetId: string
  ): Promise<ServiceResult<Budget>> {
    try {
      if (!budgetId || budgetId.trim() === '') {
        return {
          data: null,
          error: 'Budget ID is required',
        };
      }

      const getCachedBudget = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('budgets')
            .select('*')
            .eq('id', budgetId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        budgetCacheKeys.byId(budgetId),
        cacheOptions.budget(budgetId)
      );

      const budget = await getCachedBudget();

      if (!budget) {
        return {
          data: null,
          error: 'Budget not found',
        };
      }

      return {
        data: budget as Budget,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve budget',
      };
    }
  }

  /**
   * Retrieves all budgets for a specific user
   *
   * @param userId - User ID
   * @returns Array of budgets or error
   *
   * @example
   * const { data: budgets, error } = await BudgetService.getBudgetsByUser(userId);
   */
  static async getBudgetsByUser(
    userId: string
  ): Promise<ServiceResult<Budget[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const getCachedBudgets = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('budgets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        budgetCacheKeys.byUser(userId),
        cacheOptions.budgetsByUser(userId)
      );

      const budgets = await getCachedBudgets();

      return {
        data: (budgets || []) as Budget[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user budgets',
      };
    }
  }

  /**
   * Retrieves all budgets for a specific group
   *
   * @param groupId - Group ID
   * @returns Array of budgets or error
   *
   * @example
   * const { data: budgets, error } = await BudgetService.getBudgetsByGroup(groupId);
   */
  static async getBudgetsByGroup(
    groupId: string
  ): Promise<ServiceResult<Budget[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      const getCachedBudgets = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('budgets')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        budgetCacheKeys.byGroup(groupId),
        cacheOptions.budgetsByGroup(groupId)
      );

      const budgets = await getCachedBudgets();

      return {
        data: (budgets || []) as Budget[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group budgets',
      };
    }
  }

  /**
   * Get current budget period dates from user's budget_periods
   * Uses the active period's start_date and end_date
   *
   * @param user - User with budget_periods array
   * @returns Object with periodStart and periodEnd dates, or null dates if no active period
   *
   * @example
   * const { periodStart, periodEnd } = BudgetService.getBudgetPeriodDates(user);
   */
  static getBudgetPeriodDates(user: User): {
    periodStart: Date | null;
    periodEnd: Date | null;
  } {
    // Find the active budget period
    const activePeriod = user.budget_periods?.find((p) => p.is_active);

    if (!activePeriod) {
      return { periodStart: null, periodEnd: null };
    }

    const periodStart = new Date(activePeriod.start_date);
    const periodEnd = activePeriod.end_date ? new Date(activePeriod.end_date) : null;

    return { periodStart, periodEnd };
  }

  /**
   * Filter transactions that belong to a specific budget
   * Matches transactions by category and date range
   * Includes expense, transfer, and income types (based on category)
   * Income transactions refill the budget balance
   *
   * @param transactions - All transactions to filter
   * @param budget - Budget with categories array
   * @param periodStart - Period start date
   * @param periodEnd - Period end date (null means no end limit)
   * @returns Filtered transactions for the budget
   *
   * @example
   * const budgetTransactions = BudgetService.filterTransactionsForBudget(
   *   transactions, budget, periodStart, periodEnd
   * );
   */
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date | null,
    periodEnd: Date | null
  ): Transaction[] {
    // If no active period, return empty array
    if (!periodStart) return [];

    // Normalize start date to beginning of day for comparison
    const normalizedStart = new Date(periodStart);
    normalizedStart.setHours(0, 0, 0, 0);

    return transactions.filter((t) => {
      // Check if transaction category is in budget categories
      if (!budget.categories.includes(t.category)) return false;

      // Check if transaction date is within period
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);

      // Include transactions on or after start date
      if (txDate < normalizedStart) return false;

      // Exclude transactions on or after end date (if end date exists)
      if (periodEnd) {
        const normalizedEnd = new Date(periodEnd);
        normalizedEnd.setHours(0, 0, 0, 0);
        if (txDate >= normalizedEnd) return false;
      }

      return true;
    });
  }

  /**
   * Calculate progress for a single budget
   * Pure function - no database calls
   * Income transactions refill the budget (subtract from spent)
   *
   * @param budget - Budget to calculate progress for
   * @param transactions - Filtered transactions for this budget
   * @returns Budget progress with spent, remaining, percentage
   *
   * @example
   * const progress = BudgetService.calculateBudgetProgress(budget, filteredTransactions);
   */
  static calculateBudgetProgress(
    budget: Budget,
    transactions: Transaction[]
  ): BudgetProgress {
    // Calculate spent: expenses and transfers add to spent, income subtracts (refills budget)
    const spent = transactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum - t.amount; // Income refills budget
      }
      return sum + t.amount; // Expense and transfer consume budget
    }, 0);

    // Ensure spent doesn't go negative (can't have negative spending)
    const effectiveSpent = Math.max(0, spent);
    const remaining = budget.amount - effectiveSpent;
    const percentage = budget.amount > 0 ? (effectiveSpent / budget.amount) * 100 : 0;

    return {
      id: budget.id,
      description: budget.description,
      amount: budget.amount,
      spent: effectiveSpent,
      remaining,
      percentage: Math.min(percentage, 100), // Cap at 100%
      categories: budget.categories,
      transactionCount: transactions.length,
    };
  }

  /**
   * Calculate progress for multiple budgets
   * Pure function - processes budgets with their transactions
   * Filters out budgets with 0€ amount
   *
   * @param budgets - Array of budgets
   * @param transactions - All transactions to match against
   * @param periodStart - Period start date (null if no active period)
   * @param periodEnd - Period end date (null if no end limit)
   * @returns Array of budget progress data (excluding 0€ budgets)
   *
   * @example
   * const progress = BudgetService.calculateBudgetsWithProgress(
   *   budgets, transactions, periodStart, periodEnd
   * );
   */
  static calculateBudgetsWithProgress(
    budgets: Budget[],
    transactions: Transaction[],
    periodStart: Date | null,
    periodEnd: Date | null
  ): BudgetProgress[] {
    // Filter out budgets with 0€ amount
    const validBudgets = budgets.filter((b) => b.amount > 0);

    return validBudgets.map((budget) => {
      const budgetTransactions = this.filterTransactionsForBudget(
        transactions,
        budget,
        periodStart,
        periodEnd
      );
      return this.calculateBudgetProgress(budget, budgetTransactions);
    });
  }

  /**
   * Build complete budget summary for a user
   * Used by BudgetSection component in dashboard
   *
   * @param user - User to build summary for
   * @param budgets - User's budgets
   * @param transactions - All transactions to calculate spending
   * @returns Complete user budget summary
   *
   * @example
   * const summary = BudgetService.calculateUserBudgetSummary(user, userBudgets, transactions);
   */
  static calculateUserBudgetSummary(
    user: User,
    budgets: Budget[],
    transactions: Transaction[]
  ): UserBudgetSummary {
    // Get budget period dates from user's budget_periods
    const { periodStart, periodEnd } = this.getBudgetPeriodDates(user);

    // Filter transactions for this user only
    const userTransactions = transactions.filter((t) => t.user_id === user.id);

    // Calculate progress for all budgets
    const budgetProgress = this.calculateBudgetsWithProgress(
      budgets,
      userTransactions,
      periodStart,
      periodEnd
    );

    // Calculate totals
    const totalBudget = budgetProgress.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Get active budget period from user
    const activePeriod = user.budget_periods?.find((p) => p.is_active);

    return {
      user,
      budgets: budgetProgress,
      activePeriod,
      periodStart: periodStart?.toISOString() || null,
      periodEnd: periodEnd?.toISOString() || null,
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage: Math.min(overallPercentage, 100),
    };
  }

  /**
   * Build budgetsByUser object for all users in a group
   * Main method for dashboard BudgetSection integration
   *
   * @param groupUsers - All users in the group
   * @param budgets - All group budgets
   * @param transactions - All group transactions
   * @returns Record of user ID to budget summary
   *
   * @example
   * const budgetsByUser = BudgetService.buildBudgetsByUser(groupUsers, budgets, transactions);
   */
  static buildBudgetsByUser(
    groupUsers: User[],
    budgets: Budget[],
    transactions: Transaction[]
  ): Record<string, UserBudgetSummary> {
    const result: Record<string, UserBudgetSummary> = {};

    for (const user of groupUsers) {
      // Get budgets for this user
      const userBudgets = budgets.filter((b) => b.user_id === user.id);

      // Calculate summary for this user
      result[user.id] = this.calculateUserBudgetSummary(
        user,
        userBudgets,
        transactions
      );
    }

    return result;
  }

  /**
   * Filter budgets by selected user
   * Returns all group budgets if userId is 'all', otherwise filters by user
   *
   * @param budgets - All budgets
   * @param selectedUserId - 'all' or specific user ID
   * @returns Filtered budgets
   *
   * @example
   * const filtered = BudgetService.filterBudgetsByUser(budgets, selectedUserId);
   */
  static filterBudgetsByUser(
    budgets: Budget[],
    selectedUserId: string
  ): Budget[] {
    if (selectedUserId === 'all') {
      return budgets;
    }
    return budgets.filter((b) => b.user_id === selectedUserId);
  }

  /**
   * Get budget summary for selected view
   * Returns combined or single user summary based on selection
   *
   * @param budgetsByUser - Complete budgets by user data
   * @param selectedUserId - 'all' or specific user ID
   * @returns Summary for selected view
   *
   * @example
   * const summary = BudgetService.getSummaryForSelectedView(budgetsByUser, 'all');
   */
  static getSummaryForSelectedView(
    budgetsByUser: Record<string, UserBudgetSummary>,
    selectedUserId: string
  ): {
    budgets: BudgetProgress[];
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
    overallPercentage: number;
  } {
    if (selectedUserId === 'all') {
      // Combine all users' budgets
      const allBudgets: BudgetProgress[] = [];
      let totalBudget = 0;
      let totalSpent = 0;

      Object.values(budgetsByUser).forEach((summary) => {
        allBudgets.push(...summary.budgets);
        totalBudget += summary.totalBudget;
        totalSpent += summary.totalSpent;
      });

      const totalRemaining = totalBudget - totalSpent;
      const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

      return {
        budgets: allBudgets,
        totalBudget,
        totalSpent,
        totalRemaining,
        overallPercentage: Math.min(overallPercentage, 100),
      };
    }

    // Return specific user's summary
    const userSummary = budgetsByUser[selectedUserId];
    if (!userSummary) {
      return {
        budgets: [],
        totalBudget: 0,
        totalSpent: 0,
        totalRemaining: 0,
        overallPercentage: 0,
      };
    }

    return {
      budgets: userSummary.budgets,
      totalBudget: userSummary.totalBudget,
      totalSpent: userSummary.totalSpent,
      totalRemaining: userSummary.totalRemaining,
      overallPercentage: userSummary.overallPercentage,
    };
  }

  /**
   * Format period dates for display
   * Returns formatted start and end date strings
   *
   * @param periodStart - Period start date
   * @param periodEnd - Period end date
   * @param locale - Locale for formatting (default: 'it-IT')
   * @returns Formatted date strings
   *
   * @example
   * const { start, end } = BudgetService.formatPeriodDates(periodStart, periodEnd);
   */
  static formatPeriodDates(
    periodStart: Date | string,
    periodEnd: Date | string,
    locale: string = 'it-IT'
  ): { start: string; end: string } {
    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
    };

    return {
      start: startDate.toLocaleDateString(locale, options),
      end: endDate.toLocaleDateString(locale, options),
    };
  }
}
