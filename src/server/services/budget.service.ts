import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { budgetCacheKeys } from '@/lib/cache/keys';
import { BudgetRepository, UserRepository } from '@/server/dal';
import type { Budget, BudgetPeriod, BudgetType, Transaction, User, BudgetProgress, UserBudgetSummary } from '@/lib/types';
import { toDateTime } from '@/lib/utils';
import { DateTime } from 'luxon';
import { FinanceLogicService } from './finance-logic.service';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';
import { serialize } from '@/lib/utils/serializer';

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
 * Budget Service
 */
export class BudgetService {
  /**
   * Retrieves a budget by ID
   */
  static async getBudgetById(budgetId: string): Promise<Budget> {
    if (!budgetId || budgetId.trim() === '') {
      throw new Error('Budget ID is required');
    }

    const getCachedBudget = cached(
      async () => {
        const budget = await BudgetRepository.getById(budgetId);
        if (!budget) return null;
        return serialize(budget) as unknown as Budget;
      },
      budgetCacheKeys.byId(budgetId),
      cacheOptions.budget(budgetId)
    );

    const budget = await getCachedBudget();

    if (!budget) {
      throw new Error('Budget not found');
    }

    return budget;
  }

  /**
   * Retrieves all budgets for a specific user
   */
  static async getBudgetsByUser(userId: string): Promise<Budget[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const getCachedBudgets = cached(
      async () => {
        const budgets = await BudgetRepository.getByUser(userId);
        return serialize(budgets || []) as unknown as Budget[];
      },
      budgetCacheKeys.byUser(userId),
      cacheOptions.budgetsByUser(userId)
    );

    const budgets = await getCachedBudgets();

    return (budgets || []) as Budget[];
  }

  /**
   * Retrieves all budgets for a specific group
   */
  static async getBudgetsByGroup(groupId: string): Promise<Budget[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const getCachedBudgets = cached(
      async () => {
        const budgets = await BudgetRepository.getByGroup(groupId);
        return serialize(budgets || []) as unknown as Budget[];
      },
      budgetCacheKeys.byGroup(groupId),
      cacheOptions.budgetsByGroup(groupId)
    );

    const budgets = await getCachedBudgets();

    return (budgets || []) as Budget[];
  }

  /**
   * Create a new budget
   */
  static async createBudget(data: CreateBudgetInput): Promise<Budget> {
    // Input validation
    if (!data.description || data.description.trim() === '') {
      throw new Error('Description is required');
    }

    if (data.description.trim().length < 2) {
      throw new Error('Description must be at least 2 characters');
    }

    if (!data.amount || data.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    if (!data.type) {
      throw new Error('Budget type is required');
    }

    if (!['monthly', 'annually'].includes(data.type)) {
      throw new Error('Invalid budget type');
    }

    if (!data.categories || data.categories.length === 0) {
      throw new Error('At least one category is required');
    }

    if (!data.user_id || data.user_id.trim() === '') {
      throw new Error('User ID is required');
    }

    // Get user's group_id if not provided
    let groupId = data.group_id;
    if (!groupId) {
      const user = await UserRepository.getById(data.user_id);
      if (!user || !user.group_id) {
        throw new Error('Failed to get user group');
      }
      groupId = user.group_id;
    }

    const createData: Prisma.budgetsCreateInput = {
      description: data.description.trim(),
      amount: data.amount,
      type: data.type,
      icon: data.icon || null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    const budget = await BudgetRepository.create(createData);

    if (!budget) throw new Error('Failed to create budget');

    const createdBudget = budget as unknown as Budget;

    revalidateTag(CACHE_TAGS.BUDGETS, 'max');
    revalidateTag(`user:${data.user_id}:budgets`, 'max');

    return serialize(createdBudget) as unknown as Budget;
  }

  /**
   * Update an existing budget
   */
  static async updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    if (!id || id.trim() === '') {
      throw new Error('Budget ID is required');
    }

    // Validate updated fields
    if (data.description !== undefined && data.description.trim() === '') {
      throw new Error('Description cannot be empty');
    }
    if (data.description !== undefined && data.description.trim().length < 2) {
      throw new Error('Description must be at least 2 characters');
    }
    if (data.amount !== undefined && data.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (data.type !== undefined && !['monthly', 'annually'].includes(data.type)) {
      throw new Error('Invalid budget type');
    }
    if (data.categories?.length === 0) {
      throw new Error('At least one category is required');
    }
    if (data.user_id !== undefined && data.user_id.trim() === '') {
      throw new Error('User ID cannot be empty');
    }

    const existingBudget = await BudgetRepository.getById(id);

    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    const existing = existingBudget as unknown as Budget;
    const updateData: Prisma.budgetsUpdateInput = {
      updated_at: new Date(),
    };

    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.categories !== undefined) updateData.categories = data.categories as unknown as Prisma.InputJsonValue; // Cast for JSON
    if (data.user_id !== undefined) updateData.user_id = data.user_id;

    const updatedBudget = await BudgetRepository.update(id, updateData);

    if (!updatedBudget) throw new Error('Failed to update budget');

    revalidateTag(CACHE_TAGS.BUDGETS, 'max');
    revalidateTag(CACHE_TAGS.BUDGET(id), 'max');
    revalidateTag(`user:${existing.user_id}:budgets`, 'max');

    if (data.user_id && data.user_id !== existing.user_id) {
      revalidateTag(`user:${data.user_id}:budgets`, 'max');
    }

    return serialize(updatedBudget) as unknown as Budget;
  }

  /**
   * Delete a budget
   */
  static async deleteBudget(id: string): Promise<{ id: string }> {
    if (!id || id.trim() === '') {
      throw new Error('Budget ID is required');
    }

    const existingBudget = await BudgetRepository.getById(id);

    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    const existing = existingBudget as unknown as Budget;

    await BudgetRepository.delete(id);

    revalidateTag(CACHE_TAGS.BUDGETS, 'max');
    revalidateTag(CACHE_TAGS.BUDGET(id), 'max');
    revalidateTag(`user:${existing.user_id}:budgets`, 'max');

    return { id };
  }

  /**
   * Get current budget period dates from user's active budget period
   */
  static async getBudgetPeriodDates(userId: string): Promise<{
    periodStart: DateTime | null;
    periodEnd: DateTime | null;
  }> {
    const { BudgetPeriodService } = await import('./budget-period.service');
    const activePeriod = await BudgetPeriodService.getActivePeriod(userId);

    if (!activePeriod) {
      return { periodStart: null, periodEnd: null };
    }

    const periodStart = toDateTime(activePeriod.start_date);
    const periodEnd = activePeriod.end_date
      ? (toDateTime(activePeriod.end_date)?.endOf('day') ?? null)
      : null;

    return { periodStart, periodEnd };
  }

  // --- LOGIC METHODS (Delegated to FinanceLogicService) ---

  /**
   * Filter transactions that belong to a specific budget
   */
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: DateTime | null,
    periodEnd: DateTime | null
  ): Transaction[] {
    return FinanceLogicService.filterTransactionsForBudget(transactions, budget, periodStart, periodEnd);
  }

  /**
   * Calculate progress for a single budget
   */
  static calculateBudgetProgress(
    budget: Budget,
    transactions: Transaction[]
  ): BudgetProgress {
    return FinanceLogicService.calculateBudgetProgress(budget, transactions);
  }

  /**
   * Calculate progress for multiple budgets
   */
  static calculateBudgetsWithProgress(
    budgets: Budget[],
    transactions: Transaction[],
    periodStart: DateTime | null,
    periodEnd: DateTime | null
  ): BudgetProgress[] {
    return FinanceLogicService.calculateBudgetsWithProgress(budgets, transactions, periodStart, periodEnd);
  }

  /**
   * Build complete budget summary for a user
   * (Fetches period if missing)
   */
  static async calculateUserBudgetSummary(
    user: User,
    budgets: Budget[],
    transactions: Transaction[],
    activePeriod?: BudgetPeriod | null
  ): Promise<UserBudgetSummary> {
    let period: BudgetPeriod | null | undefined = activePeriod;

    // Fetch period if not provided
    if (activePeriod === undefined) {
      const { BudgetPeriodService } = await import('./budget-period.service');
      const data = await BudgetPeriodService.getActivePeriod(user.id);
      period = data;
    }

    // Delegate pure calculation
    return FinanceLogicService.calculateUserBudgetSummaryPure(user, budgets, transactions, period);
  }

  /**
   * Build budgetsByUser object for all users in a group
   * (Fetches periods if missing)
   */
  static async buildBudgetsByUser(
    groupUsers: User[],
    budgets: Budget[],
    transactions: Transaction[],
    budgetPeriods?: Record<string, BudgetPeriod | null>
  ): Promise<Record<string, UserBudgetSummary>> {
    const periodsToUse: Record<string, BudgetPeriod | null> = budgetPeriods ? { ...budgetPeriods } : {};

    // If budgetPeriods missing for some users, fetch them
    if (!budgetPeriods) {
      // This is inefficient but preserves original behavior if budgetPeriods not passed
      // Ideally should be passed.
      const { BudgetPeriodService } = await import('./budget-period.service');
      await Promise.all(groupUsers.map(async (user) => {
        if (periodsToUse[user.id] === undefined) {
          const data = await BudgetPeriodService.getActivePeriod(user.id);
          periodsToUse[user.id] = data || null;
        }
      }));
    } else {
      // Ensure all users have an entry, even if null (though record might be partial)
      // FinanceLogicService handles undefined activePeriod safely
    }

    return FinanceLogicService.buildBudgetsByUserPure(groupUsers, budgets, transactions, periodsToUse);
  }
}
