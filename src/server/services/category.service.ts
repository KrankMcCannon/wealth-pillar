import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { FinanceLogicService } from './finance-logic.service';
import type { Category } from '@/lib/types';
import type { Database } from '@/lib/types/database.types';
import { revalidateTag } from 'next/cache';

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

  private static getAllDb = cache(async (): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  });

  private static getByGroupDb = cache(async (groupId: string): Promise<Category[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as Category[];
  });

  private static async getByIdDb(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as Category;
  }

  private static getByKeyDb = cache(async (key: string): Promise<Category | null> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('key', key)
      .single();

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
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // ================== SERVICE LAYER ==================

  /**
   * Retrieves all categories by group
   */
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
    // Validate input
    if (!data.label || data.label.trim() === '') {
      throw new Error('Label is required');
    }

    if (!data.key || data.key.trim() === '') {
      throw new Error('Key is required');
    }

    if (!data.icon || data.icon.trim() === '') {
      throw new Error('Icon is required');
    }

    if (!data.color || data.color.trim() === '') {
      throw new Error('Color is required');
    }

    if (!FinanceLogicService.isValidColor(data.color)) {
      throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
    }

    if (!data.group_id || data.group_id.trim() === '') {
      throw new Error('Group ID is required');
    }

    const createData = {
      label: data.label.trim(),
      key: data.key.trim().toLowerCase(),
      icon: data.icon.trim(),
      color: data.color.trim().toUpperCase(),
      group_id: data.group_id,
    };

    const category = await this.createDb(createData);

    if (!category) {
      throw new Error('Failed to create category');
    }

    // Invalidate caches
    revalidateTag(CACHE_TAGS.CATEGORIES, 'max');

    return category as unknown as Category;
  }

  /**
   * Updates an existing category
   */
  static async updateCategory(id: string, data: UpdateCategoryInput): Promise<Category> {
    // Validate ID
    if (!id || id.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Fetch existing category for cache invalidation
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Build update object (only include provided fields)
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (data.label !== undefined) {
      if (!data.label || data.label.trim() === '') {
        throw new Error('Label cannot be empty');
      }
      updateData.label = data.label.trim();
    }

    if (data.icon !== undefined) {
      if (!data.icon || data.icon.trim() === '') {
        throw new Error('Icon cannot be empty');
      }
      updateData.icon = data.icon.trim();
    }

    if (data.color !== undefined) {
      if (!data.color || data.color.trim() === '') {
        throw new Error('Color cannot be empty');
      }
      if (!FinanceLogicService.isValidColor(data.color)) {
        throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
      }
      updateData.color = data.color.trim().toUpperCase();
    }

    const category = await this.updateDb(id, updateData);

    if (!category) {
      throw new Error('Failed to update category');
    }

    // Invalidate caches
    revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
    revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');

    return category as unknown as Category;
  }

  /**
   * Deletes a category
   */
  static async deleteCategory(id: string): Promise<{ id: string }> {
    // Validate ID
    if (!id || id.trim() === '') {
      throw new Error('Category ID is required');
    }

    // Fetch existing category for cache invalidation
    const existingCategory = await this.getCategoryById(id);
    if (!existingCategory) {
      throw new Error('Category not found');
    }

    await this.deleteDb(id);

    // Invalidate caches
    revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
    revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');

    return { id };
  }
}
