import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import type { Budget, BudgetType } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';
import { serialize } from '@/lib/utils/serializer';
import { UserService } from '@/server/services/user.service';
import {
  validateId,
  validateRequiredString,
  validatePositiveNumber,
  validateNonEmptyArray,
  validateMinLength,
  validateEnum,
} from '@/lib/utils/validation-utils';
import { invalidateBudgetCaches } from '@/lib/utils/cache-utils';

type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

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
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static readonly getByUserDb = cache(async (userId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Budget[];
  });

  private static readonly getByGroupDb = cache(async (groupId: string): Promise<Budget[]> => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Budget[];
  });

  private static async getByIdDb(id: string): Promise<Budget | null> {
    const { data, error } = await supabase.from('budgets').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Budget;
  }

  private static async createDb(data: BudgetInsert): Promise<Budget> {
    const { data: created, error } = await supabase
      .from('budgets')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Budget;
  }

  private static async updateDb(id: string, data: BudgetUpdate): Promise<Budget> {
    const { data: updated, error } = await supabase
      .from('budgets')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Budget;
  }

  private static async deleteDb(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);

    if (error) throw new Error(error.message);
  }

  static async deleteByUser(userId: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('user_id', userId);

    if (error) throw new Error(error.message);
  }

  // ================== SERVICE LAYER ==================

  /**
   * Retrieves a budget by ID
   */
  /**
   * Retrieves a budget by ID
   */
  static async getBudgetById(budgetId: string): Promise<Budget> {
    if (!budgetId || budgetId.trim() === '') {
      throw new Error('Budget ID is required');
    }

    const getCachedBudget = cached(
      async () => {
        const budget = await this.getByIdDb(budgetId);
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
        const budgets = await this.getByUserDb(userId);
        return serialize(budgets || []) as unknown as Budget[];
      },
      budgetCacheKeys.byUser(userId),
      cacheOptions.budgetsByUser(userId)
    );

    const budgets = await getCachedBudgets();

    return budgets || [];
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
        const budgets = await this.getByGroupDb(groupId);
        return serialize(budgets || []) as unknown as Budget[];
      },
      budgetCacheKeys.byGroup(groupId),
      cacheOptions.budgetsByGroup(groupId)
    );

    const budgets = await getCachedBudgets();

    return budgets || [];
  }

  /**
   * Create a new budget
   */
  static async createBudget(data: CreateBudgetInput): Promise<Budget> {
    // Input validation using shared utilities
    const description = validateRequiredString(data.description, 'Description');
    validateMinLength(description, 2, 'Description');
    validatePositiveNumber(data.amount, 'Amount');
    validateEnum(data.type, ['monthly', 'annually'] as const, 'Budget type');
    validateNonEmptyArray(data.categories, 'category');
    validateId(data.user_id, 'User ID');

    // Get user's group_id if not provided
    const groupId = data.group_id || (await UserService.fetchUserGroupId(data.user_id));

    const createData = {
      description,
      amount: data.amount,
      type: data.type,
      icon: data.icon || null,
      categories: data.categories,
      user_id: data.user_id,
      group_id: groupId,
    };

    const budget = await this.createDb(createData);
    if (!budget) throw new Error('Failed to create budget');

    const createdBudget = budget as unknown as Budget;

    // Cache invalidation using shared utility
    invalidateBudgetCaches({ userId: data.user_id, groupId });

    return serialize(createdBudget) as unknown as Budget;
  }

  /**
   * Update an existing budget
   */
  static async updateBudget(id: string, data: UpdateBudgetInput): Promise<Budget> {
    this.validateBudgetUpdate(id, data);

    const existingBudget = await this.getByIdDb(id);

    if (!existingBudget) {
      throw new Error('Budget not found');
    }

    const existing = existingBudget as unknown as Budget;
    const updateData: BudgetUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.icon !== undefined) updateData.icon = data.icon;
    if (data.categories !== undefined) updateData.categories = data.categories;
    if (data.user_id !== undefined) updateData.user_id = data.user_id;

    const updatedBudget = await this.updateDb(id, updateData);

    if (!updatedBudget) throw new Error('Failed to update budget');

    // Cache invalidation using shared utility
    invalidateBudgetCaches({
      budgetId: id,
      userId: existing.user_id,
      groupId: existing.group_id || undefined,
    });

    // If user changed, also invalidate new user's caches
    if (data.user_id && data.user_id !== existing.user_id) {
      invalidateBudgetCaches({ userId: data.user_id });
    }

    return serialize(updatedBudget) as unknown as Budget;
  }

  private static validateBudgetUpdate(id: string, data: UpdateBudgetInput) {
    if (!id || id.trim() === '') {
      throw new Error('Budget ID is required');
    }

    if (data.description !== undefined) {
      if (data.description.trim() === '') throw new Error('Description cannot be empty');
      if (data.description.trim().length < 2)
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
  }

  /**
   * Delete a budget
   */
  static async deleteBudget(id: string): Promise<{ id: string }> {
    validateId(id, 'Budget ID');

    const existingBudget = await this.getByIdDb(id);
    if (!existingBudget) throw new Error('Budget not found');

    const existing = existingBudget as unknown as Budget;

    await this.deleteDb(id);

    // Cache invalidation using shared utility
    invalidateBudgetCaches({
      budgetId: id,
      userId: existing.user_id,
      groupId: existing.group_id || undefined,
    });

    return { id };
  }
}
