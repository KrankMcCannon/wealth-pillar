import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { FinanceLogicService } from './finance-logic.service';
import type { Category } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';
import { validateId, validateRequiredString } from '@/lib/utils/validation-utils';
import { invalidateCategoryCaches } from '@/lib/utils/cache-utils';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Input type for creating a new category
 */
export interface CreateCategoryInput {
  label: string;
  key: string;
  icon: string;
  color: string;
  group_id: string;
}

/**
 * Input type for updating a category
 */
export interface UpdateCategoryInput {
  label?: string;
  icon?: string;
  color?: string;
}

/**
 * Category Service
 * Handles all category-related business logic following Single Responsibility Principle
 */
export class CategoryService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static readonly getAllDb = cache(async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  });

  private static readonly getByGroupDb = cache(async (groupId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  });

  private static async getByIdDb(id: string): Promise<Category | null> {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Category;
  }

  private static readonly getByKeyDb = cache(async (key: string): Promise<Category | null> => {
    const { data, error } = await supabase.from('categories').select('*').eq('key', key).single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Category;
  });

  private static async createDb(data: CategoryInsert): Promise<Category> {
    const { data: created, error } = await supabase
      .from('categories')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as Category;
  }

  private static async updateDb(id: string, data: CategoryUpdate): Promise<Category> {
    const { data: updated, error } = await supabase
      .from('categories')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as Category;
  }

  private static async deleteDb(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) throw new Error(error.message);
  }

  // ================== SERVICE LAYER ==================

  static async getCategoriesByGroup(groupId: string): Promise<Category[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const getCachedCategories = cached(
      async () => {
        const categories = await this.getByGroupDb(groupId);
        return categories;
      },
      categoryCacheKeys.byGroup(groupId),
      cacheOptions.categoriesByGroup(groupId)
    );

    const categories = await getCachedCategories();

    return (categories || []) as unknown as Category[];
  }

  /**
   * Retrieves system default categories (SYSTEM_GROUP_ID)
   */
  static async getSystemCategories(): Promise<Category[]> {
    return this.getCategoriesByGroup(SYSTEM_GROUP_ID);
  }

  /**
   * Retrieves all available categories for a group (System + Group Custom)
   * Uses .or() query for efficient single-pass fetching and strict isolation.
   */
  static async getAvailableCategories(groupId: string): Promise<Category[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`group_id.eq.${groupId},group_id.eq.${SYSTEM_GROUP_ID}`)
      .order('label', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  }

  static async getAllCategories(): Promise<Category[]> {
    // Create cached query function
    const getCachedCategories = cached(
      async () => {
        const categories = await this.getAllDb();
        return categories;
      },
      categoryCacheKeys.all(),
      cacheOptions.allCategories()
    );

    const categories = await getCachedCategories();

    return (categories || []) as unknown as Category[];
  }

  /**
   * Retrieves a single category by ID
   */
  static async getCategoryById(categoryId: string): Promise<Category> {
    // Input validation
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Create cached query function
    const getCachedCategory = cached(
      async () => {
        const category = await this.getByIdDb(categoryId);
        return category;
      },
      categoryCacheKeys.byId(categoryId),
      cacheOptions.category(categoryId)
    );

    const category = await getCachedCategory();

    if (!category) {
      throw new Error('Category not found');
    }

    return category as unknown as Category;
  }

  /**
   * Retrieves a single category by unique key
   */
  static async getCategoryByKey(key: string): Promise<Category> {
    // Input validation
    if (!key || key.trim() === '') {
      throw new Error('Category key is required');
    }

    // Create cached query function
    const getCachedCategory = cached(
      async () => {
        const category = await this.getByKeyDb(key);
        return category;
      },
      categoryCacheKeys.byKey(key),
      cacheOptions.category(key)
    );

    const category = await getCachedCategory();

    if (!category) {
      throw new Error('Category not found');
    }

    return category as unknown as Category;
  }

  /**
   * Creates a new category
   */
  static async createCategory(data: CreateCategoryInput): Promise<Category> {
    // Validate input using shared utilities
    const label = validateRequiredString(data.label, 'Label');
    const key = validateRequiredString(data.key, 'Key');
    const icon = validateRequiredString(data.icon, 'Icon');
    const color = validateRequiredString(data.color, 'Color');
    validateId(data.group_id, 'Group ID');

    if (!FinanceLogicService.isValidColor(color)) {
      throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
    }

    const createData = {
      label,
      key: key.toLowerCase(),
      icon,
      color: color.toUpperCase(),
      group_id: data.group_id,
    };

    const category = await this.createDb(createData);
    if (!category) throw new Error('Failed to create category');

    // Invalidate caches using shared utility
    invalidateCategoryCaches({});

    return category as unknown as Category;
  }

  /**
   * Updates an existing category
   */
  static async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    // Validate ID using shared utility
    validateId(id, 'Category ID');

    // Fetch existing category for cache invalidation
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) throw new Error('Category not found');

    // Build update object (only include provided fields)
    const updateData: CategoryUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (data.label !== undefined) {
      updateData.label = validateRequiredString(data.label, 'Label');
    }

    if (data.icon !== undefined) {
      updateData.icon = validateRequiredString(data.icon, 'Icon');
    }

    if (data.color !== undefined) {
      const color = validateRequiredString(data.color, 'Color');
      if (!FinanceLogicService.isValidColor(color)) {
        throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
      }
      updateData.color = color.toUpperCase();
    }

    const category = await this.updateDb(id, updateData);
    if (!category) throw new Error('Failed to update category');

    // Invalidate caches using shared utility
    invalidateCategoryCaches({ categoryId: id });

    return category as unknown as Category;
  }

  /**
   * Deletes a category
   */
  static async deleteCategory(id: string): Promise<{ id: string }> {
    // Validate ID using shared utility
    validateId(id, 'Category ID');

    // Fetch existing category for cache invalidation
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) throw new Error('Category not found');

    await this.deleteDb(id);

    // Invalidate caches using shared utility
    invalidateCategoryCaches({ categoryId: id });

    return { id };
  }
}
