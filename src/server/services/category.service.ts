import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { CategoryRepository } from '@/server/dal';
import { FinanceLogicService } from './finance-logic.service';
import type { Category } from '@/lib/types';
import { revalidateTag } from 'next/cache';
import type { Prisma } from '@prisma/client';

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
 *
 * All methods throw standard errors instead of returning ServiceResult objects
 * All database queries are cached using Next.js unstable_cache
 */
export class CategoryService {
  /**
    * Retrieves all categories
    * Used for displaying category lists in forms, filters, and reports
    */
  static async getAllCategories(): Promise<Category[]> {
    // Create cached query function
    const getCachedCategories = cached(
      async () => {
        const categories = await CategoryRepository.getAll();
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
        const category = await CategoryRepository.getById(categoryId);
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
        const category = await CategoryRepository.getByKey(key);
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

    const createData: Prisma.categoriesCreateInput = {
      label: data.label.trim(),
      key: data.key.trim().toLowerCase(),
      icon: data.icon.trim(),
      color: data.color.trim().toUpperCase(),
      groups: { connect: { id: data.group_id } },
    };

    const category = await CategoryRepository.create(createData);

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
    const updateData: Prisma.categoriesUpdateInput = {
      updated_at: new Date(),
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

    const category = await CategoryRepository.update(id, updateData);

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

    await CategoryRepository.delete(id);

    // Invalidate caches
    revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
    revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');

    return { id };
  }
}
