import { budgetCacheKeys, CACHE_TAGS, cached, cacheOptions } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import type { Budget, BudgetPeriod, BudgetType, Transaction, User } from '@/lib/types';
import {
  DateTime,
  formatDateShort,
  nowISO,
  toDateTime,
} from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';
import { FinanceLogicService } from './finance-logic.service';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }
  }
}

/**
 * Input data for creating a new budget
 */
export interface CreateBudgetInput {
  description: string;
  amount: number;
  type: BudgetType;
  icon?: string | null;
  categories: string[];
  user_id: string;
  group_id?: string; // Optional for backward compatibility
}

/**
 * Input data for updating an existing budget
 */
export type UpdateBudgetInput = Partial<CreateBudgetInput>;

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
   * Create a new budget
   * Used for adding new budgets to the database
   *
   * @param data - Budget data to create
   * @returns Created budget or error
   *
   * @example
   * const { data: budget, error } = await BudgetService.createBudget({
   *   description: 'Monthly groceries',
   *   amount: 500.00,
   *   type: 'monthly',
   *   categories: ['food', 'groceries'],
   *   user_id: userId
   * });
   */
  static async createBudget(
    data: CreateBudgetInput
  ): Promise<ServiceResult<Budget>> {
    try {
      // Input validation
      if (!data.description || data.description.trim() === '') {
        return { data: null, error: 'Description is required' };
      }

      if (data.description.trim().length < 2) {
        return { data: null, error: 'Description must be at least 2 characters' };
      }

      if (!data.amount || data.amount <= 0) {
        return { data: null, error: 'Amount must be greater than zero' };
      }

      if (!data.type) {
        return { data: null, error: 'Budget type is required' };
      }

      if (!['monthly', 'annually'].includes(data.type)) {
        return { data: null, error: 'Invalid budget type' };
      }

      if (!data.categories || data.categories.length === 0) {
        return { data: null, error: 'At least one category is required' };
      }

      if (!data.user_id || data.user_id.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      // Get user's group_id if not provided
      let groupId = data.group_id;
      if (!groupId) {
        // Import UserService dynamically to avoid circular dependency
        const { UserService } = await import('./user.service');
        const { data: user, error: userError } = await UserService.getUserById(data.user_id);
        if (userError || !user) {
          return { data: null, error: 'Failed to get user group' };
        }
        groupId = user.group_id;
      }

      // Insert budget
      const insertData: Database['public']['Tables']['budgets']['Insert'] = {
        description: data.description.trim(),
        amount: data.amount,
        type: data.type,
        icon: data.icon || null,
        categories: data.categories,
        user_id: data.user_id,
        group_id: groupId,
      };

      const { data: budget, error } = await supabaseServer
        .from('budgets')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!budget) {
        return { data: null, error: 'Failed to create budget' };
      }

      // Invalidate relevant caches
      const tagsToInvalidate: string[] = [
        CACHE_TAGS.BUDGETS,
        `user:${data.user_id}:budgets`,
      ];
      await revalidateCacheTags(tagsToInvalidate);

      return { data: budget as Budget, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create budget',
      };
    }
  }

  /**
   * Update an existing budget
   * Used for modifying budget details
   *
   * @param id - Budget ID
   * @param data - Updated budget data
   * @returns Updated budget or error
   *
   * @example
   * const { data: budget, error } = await BudgetService.updateBudget(
   *   budgetId,
   *   { description: 'Updated description', amount: 600.00 }
   * );
   */
  static async updateBudget(
    id: string,
    data: UpdateBudgetInput
  ): Promise<ServiceResult<Budget>> {
    try {
      // Input validation
      if (!id || id.trim() === '') {
        return { data: null, error: 'Budget ID is required' };
      }

      // Validate updated fields if provided
      if (data.description !== undefined && data.description.trim() === '') {
        return { data: null, error: 'Description cannot be empty' };
      }

      if (data.description !== undefined && data.description.trim().length < 2) {
        return { data: null, error: 'Description must be at least 2 characters' };
      }

      if (data.amount !== undefined && data.amount <= 0) {
        return { data: null, error: 'Amount must be greater than zero' };
      }

      if (data.type !== undefined && !['monthly', 'annually'].includes(data.type)) {
        return { data: null, error: 'Invalid budget type' };
      }

      if (data.categories?.length === 0) {
        return { data: null, error: 'At least one category is required' };
      }

      if (data.user_id !== undefined && data.user_id.trim() === '') {
        return { data: null, error: 'User ID cannot be empty' };
      }

      // Check if budget exists and get current data for cache invalidation
      const { data: existingBudget, error: fetchError } =
        await supabaseServer
          .from('budgets')
          .select('*')
          .eq('id', id)
          .single();

      if (fetchError || !existingBudget) {
        return { data: null, error: 'Budget not found' };
      }

      // Cast to Budget type for proper typing
      const existing = existingBudget as Budget;

      // Build update object with only provided fields
      const updateData: Database['public']['Tables']['budgets']['Update'] = {
        updated_at: nowISO(),
      };

      if (data.description !== undefined) updateData.description = data.description.trim();
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.categories !== undefined) updateData.categories = data.categories;
      if (data.user_id !== undefined) updateData.user_id = data.user_id;

      // Update budget
      const { data: updatedBudget, error } = await supabaseServer
        .from('budgets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!updatedBudget) {
        return { data: null, error: 'Failed to update budget' };
      }

      // Invalidate relevant caches (both old and new values)
      const tagsToInvalidate: string[] = [
        CACHE_TAGS.BUDGETS,
        CACHE_TAGS.BUDGET(id),
        `user:${existing.user_id}:budgets`,
      ];

      // Invalidate new user cache if changed
      if (data.user_id && data.user_id !== existing.user_id) {
        tagsToInvalidate.push(`user:${data.user_id}:budgets`);
      }

      await revalidateCacheTags(tagsToInvalidate);

      return { data: updatedBudget as Budget, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update budget',
      };
    }
  }

  /**
   * Delete a budget
   * Used for removing budgets from the database
   *
   * @param id - Budget ID to delete
   * @returns Deleted budget ID or error
   *
   * @example
   * const { data, error } = await BudgetService.deleteBudget(budgetId);
   * if (!error) {
   *   console.log('Budget deleted:', data.id);
   * }
   */
  static async deleteBudget(
    id: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      // Input validation
      if (!id || id.trim() === '') {
        return { data: null, error: 'Budget ID is required' };
      }

      // Get budget before deleting for cache invalidation
      const { data: existingBudget, error: fetchError } =
        await supabaseServer
          .from('budgets')
          .select('*')
          .eq('id', id)
          .single();

      if (fetchError || !existingBudget) {
        return { data: null, error: 'Budget not found' };
      }

      // Cast to Budget type for proper typing
      const existing = existingBudget as Budget;

      // Delete budget
      const { error } = await supabaseServer
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Invalidate relevant caches
      const tagsToInvalidate: string[] = [
        CACHE_TAGS.BUDGETS,
        CACHE_TAGS.BUDGET(id),
        `user:${existing.user_id}:budgets`,
      ];

      await revalidateCacheTags(tagsToInvalidate);

      return { data: { id }, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete budget',
      };
    }
  }

  /**
   * Get current budget period dates from user's active budget period
   * Fetches from the budget_periods table and uses the active period's dates
   *
   * @param userId - User ID
   * @returns Promise with periodStart and periodEnd dates, or null dates if no active period
   *
   * @example
   * const { periodStart, periodEnd } = await BudgetService.getBudgetPeriodDates(userId);
   */
  static async getBudgetPeriodDates(userId: string): Promise<{
    periodStart: DateTime | null;
    periodEnd: DateTime | null;
  }> {
    const { BudgetPeriodService } = await import('./budget-period.service');

    // Fetch the active budget period from the database
    const { data: activePeriod } = await BudgetPeriodService.getActivePeriod(userId);

    if (!activePeriod) {
      return { periodStart: null, periodEnd: null };
    }

    const periodStart = toDateTime(activePeriod.start_date);
    const periodEnd = activePeriod.end_date
      ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? null)
      : null;

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
    periodStart: DateTime | null,
    periodEnd: DateTime | null
  ): Transaction[] {
    if (!periodStart) return [];

    // 1. Filter by period
    const periodTransactions = FinanceLogicService.filterTransactionsByPeriod(
      transactions,
      periodStart,
      periodEnd
    );

    // 2. Filter by budget categories
    return FinanceLogicService.filterByCategories(periodTransactions, budget.categories);
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

    // FIXED: Calculate remaining correctly for overspent budgets
    // If budget is overpassed (spent > amount), show how much it's overpassed
    // Example: budget=200, spent=427.23 → remaining=-227.23 (overpassed by 227.23)
    // The UI can then display this as "Exceeded by €227.23"
    const remaining = budget.amount - effectiveSpent;

    // Calculate actual percentage (can exceed 100% when overspent)
    const percentage = budget.amount > 0 ? (effectiveSpent / budget.amount) * 100 : 0;

    return {
      id: budget.id,
      description: budget.description,
      amount: budget.amount,
      spent: effectiveSpent,
      remaining, // Can be negative when overspent - indicates how much over budget
      percentage, // Not capped - shows true percentage (e.g., 213% for 427.23/200)
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
    periodStart: DateTime | null,
    periodEnd: DateTime | null
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
   * @param activePeriod - Optional active budget period (if not provided, will fetch from DB)
   * @returns Complete user budget summary
   *
   * @example
   * // With period data already available:
   * const summary = await BudgetService.calculateUserBudgetSummary(user, userBudgets, transactions, activePeriod);
   * // Without period data (will fetch):
   * const summary = await BudgetService.calculateUserBudgetSummary(user, userBudgets, transactions);
   */
  static async calculateUserBudgetSummary(
    user: User,
    budgets: Budget[],
    transactions: Transaction[], // Now receives pre-filtered user transactions
    activePeriod?: BudgetPeriod | null
  ): Promise<UserBudgetSummary> {
    let period: BudgetPeriod | null | undefined = activePeriod;

    // Fetch period if not provided
    if (activePeriod === undefined) {
      const { BudgetPeriodService } = await import('./budget-period.service');
      const { data } = await BudgetPeriodService.getActivePeriod(user.id);
      period = data;
    }

    // Calculate period dates from the period
    const periodStart = period ? toDateTime(period.start_date) : null;
    const periodEnd = period?.end_date
      ? (toDateTime(period.end_date)?.endOf('day') ?? null)
      : null;

    // OPTIMIZATION: Transactions are already filtered by user_id in buildBudgetsByUser
    // No need to filter again - reduces one O(p) operation per user
    // Use transactions directly (already filtered)

    // Calculate progress for all budgets with pre-filtered transactions
    const budgetProgress = this.calculateBudgetsWithProgress(
      budgets,
      transactions, // Already filtered by user
      periodStart,
      periodEnd
    );

    // Calculate totals
    const totalBudget = budgetProgress.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgetProgress.reduce((sum, b) => sum + b.spent, 0);
    // FIXED: totalRemaining can be negative when overspent (coherent with individual budget.remaining)
    const totalRemaining = totalBudget - totalSpent;
    // FIXED: overallPercentage not capped - shows true percentage (coherent with individual budget.percentage)
    // Example: If totalBudget=500, totalSpent=650 → overallPercentage=130%, totalRemaining=-150
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      user,
      budgets: budgetProgress,
      activePeriod: period || undefined,
      periodStart: periodStart?.toISO() || null,
      periodEnd: periodEnd?.toISO() || null,
      totalBudget,
      totalSpent,
      totalRemaining, // Can be negative - shows remaining availability under 0
      overallPercentage, // Not capped - shows true percentage for consistency
    };
  }

  /**
   * Build budgetsByUser object for all users in a group
   * Main method for dashboard BudgetSection integration
   *
   * @param groupUsers - All users in the group
   * @param budgets - All group budgets
   * @param transactions - All group transactions
   * @param budgetPeriods - Optional map of user ID to BudgetPeriod (if not provided, will fetch from DB)
   * @returns Promise with record of user ID to budget summary
   *
   * @example
   * // With budget periods already available:
   * const budgetsByUser = await BudgetService.buildBudgetsByUser(groupUsers, budgets, transactions, budgetPeriods);
   * // Without budget periods (will fetch):
   * const budgetsByUser = await BudgetService.buildBudgetsByUser(groupUsers, budgets, transactions);
   */
  static async buildBudgetsByUser(
    groupUsers: User[],
    budgets: Budget[],
    transactions: Transaction[],
    budgetPeriods?: Record<string, BudgetPeriod | null>
  ): Promise<Record<string, UserBudgetSummary>> {
    // OPTIMIZATION: Pre-group budgets and transactions by user_id
    // Reduces complexity from O(n × m) to O(m + p + n) where:
    // n=users, m=budgets, p=transactions

    // Create budget map: O(m)
    const budgetsByUserId = new Map<string, Budget[]>();
    for (const budget of budgets) {
      const userId = budget.user_id;
      if (!budgetsByUserId.has(userId)) {
        budgetsByUserId.set(userId, []);
      }
      budgetsByUserId.get(userId)!.push(budget);
    }

    // Create transaction map: O(p)
    const transactionsByUserId = new Map<string, Transaction[]>();
    for (const transaction of transactions) {
      if (!transaction.user_id) continue; // Skip transactions without user_id
      const userId = transaction.user_id;
      if (!transactionsByUserId.has(userId)) {
        transactionsByUserId.set(userId, []);
      }
      transactionsByUserId.get(userId)!.push(transaction);
    }

    // Build result: O(n) with O(1) lookups - now async
    const summaryPromises = groupUsers.map(async (user) => {
      const userBudgets = budgetsByUserId.get(user.id) || [];
      const userTransactions = transactionsByUserId.get(user.id) || [];
      const userPeriod = budgetPeriods?.[user.id];

      // Calculate summary with pre-filtered data
      const summary = await this.calculateUserBudgetSummary(
        user,
        userBudgets,
        userTransactions, // Pass only user's transactions instead of all
        userPeriod
      );

      return [user.id, summary] as const;
    });

    // Wait for all summaries to be calculated
    const summaries = await Promise.all(summaryPromises);

    // Convert to object
    const result: Record<string, UserBudgetSummary> = {};
    for (const [userId, summary] of summaries) {
      result[userId] = summary;
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

      for (const summary of Object.values(budgetsByUser)) {
        allBudgets.push(...summary.budgets);
        totalBudget += summary.totalBudget;
        totalSpent += summary.totalSpent;
      }

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
    periodStart: DateTime | string,
    periodEnd: DateTime | string
  ): { start: string; end: string } {
    return {
      start: formatDateShort(periodStart),
      end: formatDateShort(periodEnd),
    };
  }

  /**
   * Format period date for display
   * Returns formatted date string

   * @param date - Date to format
   * @returns Formatted date string
   */
  static formatPeriodDate(date: string | Date): string {
    const dt = toDateTime(date);
    if (!dt) return "Data non valida";

    const day = dt.day;
    const month = dt.toFormat("LLL", { locale: "it" });
    const year = dt.year;
    return `${day} ${month} ${year}`;
  }

  /**
   * Update cached budget balance for a budget
   * Recalculates balance from transactions and caches it in the database
   * Called when transactions change or balance becomes stale
   *
   * @param budgetId - Budget ID to update
   * @param transactions - All transactions to calculate from
   * @param periodStart - Active period start date
   * @param periodEnd - Active period end date (null for open period)
   * @returns Updated budget with cached balance
   *
   * @example
   * const { data: updatedBudget } = await BudgetService.updateBudgetBalance(
   *   budgetId,
   *   transactions,
   *   periodStart,
   *   periodEnd
   * );
   */
  static async updateBudgetBalance(
    budgetId: string,
    transactions: Transaction[],
    periodStart: DateTime | null,
    periodEnd: DateTime | null
  ): Promise<ServiceResult<Budget>> {
    try {
      const { data: budget } = await this.getBudgetById(budgetId);
      if (!budget) {
        return { data: null, error: 'Budget not found' };
      }

      // Calculate fresh balance
      const budgetTransactions = this.filterTransactionsForBudget(
        transactions,
        budget,
        periodStart,
        periodEnd
      );

      const progress = this.calculateBudgetProgress(budget, budgetTransactions);

      // Update budget with cached balance
      const { data: updated, error } = await supabaseServer
        .from('budgets')
        .update({
          current_balance: progress.remaining,
          balance_updated_at: nowISO(),
          updated_at: nowISO(),
        })
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGETS,
        CACHE_TAGS.BUDGET(budgetId),
        `user:${budget.user_id}:budgets`,
      ]);

      return { data: updated as Budget, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Get budget balance with smart caching
   * Returns cached value if fresh (<5 min), otherwise recalculates
   *
   * @param budget - Budget to get balance for
   * @param transactions - All transactions
   * @param periodStart - Active period start date
   * @param periodEnd - Active period end date
   * @returns Balance (remaining amount)
   *
   * @example
   * const balance = await BudgetService.getBudgetBalance(
   *   budget,
   *   transactions,
   *   periodStart,
   *   periodEnd
   * );
   */
  static async getBudgetBalance(
    budget: Budget,
    transactions: Transaction[],
    periodStart: DateTime | null,
    periodEnd: DateTime | null
  ): Promise<number> {
    // Check if cached balance is fresh (< 5 minutes)
    const isFresh =
      budget.balance_updated_at &&
      budget.current_balance !== null &&
      budget.current_balance !== undefined &&
      DateTime.now().diff(toDateTime(budget.balance_updated_at)!, 'minutes')
        .minutes < 5;

    if (isFresh) {
      return budget.current_balance!;
    }

    // Recalculate if stale or not cached
    const { data: updated } = await this.updateBudgetBalance(
      budget.id,
      transactions,
      periodStart,
      periodEnd
    );

    return updated?.current_balance ?? 0;
  }
}
