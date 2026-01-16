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
 * Service result type for better error handling
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Category Service
 * Handles all category-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class CategoryService {
  /**
    * Retrieves all categories
    * Used for displaying category lists in forms, filters, and reports
    */
  static async getAllCategories(): Promise<ServiceResult<Category[]>> {
    try {
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

      return {
        data: (categories || []) as unknown as Category[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve categories',
      };
    }
  }

  /**
   * Retrieves a single category by ID
   */
  static async getCategoryById(
    categoryId: string
  ): Promise<ServiceResult<Category>> {
    try {
      // Input validation
      if (!categoryId || categoryId.trim() === '') {
        return {
          data: null,
          error: 'Category ID is required',
        };
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
        return {
          data: null,
          error: 'Category not found',
        };
      }

      return {
        data: category as unknown as Category,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve category',
      };
    }
  }

  /**
   * Retrieves a single category by unique key
   */
  static async getCategoryByKey(key: string): Promise<ServiceResult<Category>> {
    try {
      // Input validation
      if (!key || key.trim() === '') {
        return {
          data: null,
          error: 'Category key is required',
        };
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
        return {
          data: null,
          error: 'Category not found',
        };
      }

      return {
        data: category as unknown as Category,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve category',
      };
    }
  }

  /**
   * Creates a new category
   */
  static async createCategory(data: CreateCategoryInput): Promise<ServiceResult<Category>> {
    try {
      // Validate input
      if (!data.label || data.label.trim() === '') {
        return { data: null, error: 'Label is required' };
      }

      if (!data.key || data.key.trim() === '') {
        return { data: null, error: 'Key is required' };
      }

      if (!data.icon || data.icon.trim() === '') {
        return { data: null, error: 'Icon is required' };
      }

      if (!data.color || data.color.trim() === '') {
        return { data: null, error: 'Color is required' };
      }

      if (!FinanceLogicService.isValidColor(data.color)) {
        return { data: null, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
      }

      if (!data.group_id || data.group_id.trim() === '') {
        return { data: null, error: 'Group ID is required' };
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
        return { data: null, error: 'Failed to create category' };
      }

      // Invalidate caches
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');

      return { data: category as unknown as Category, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create category',
      };
    }
  }

  /**
   * Updates an existing category
   */
  static async updateCategory(id: string, data: UpdateCategoryInput): Promise<ServiceResult<Category>> {
    try {
      // Validate ID
      if (!id || id.trim() === '') {
        return { data: null, error: 'Category ID is required' };
      }

      // Fetch existing category for cache invalidation
      const { data: existingCategory } = await this.getCategoryById(id);
      if (!existingCategory) {
        return { data: null, error: 'Category not found' };
      }

      // Build update object (only include provided fields)
      const updateData: Prisma.categoriesUpdateInput = {
        updated_at: new Date(),
      };

      if (data.label !== undefined) {
        if (!data.label || data.label.trim() === '') {
          return { data: null, error: 'Label cannot be empty' };
        }
        updateData.label = data.label.trim();
      }

      if (data.icon !== undefined) {
        if (!data.icon || data.icon.trim() === '') {
          return { data: null, error: 'Icon cannot be empty' };
        }
        updateData.icon = data.icon.trim();
      }

      if (data.color !== undefined) {
        if (!data.color || data.color.trim() === '') {
          return { data: null, error: 'Color cannot be empty' };
        }
        if (!FinanceLogicService.isValidColor(data.color)) {
          return { data: null, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
        }
        updateData.color = data.color.trim().toUpperCase();
      }

      const category = await CategoryRepository.update(id, updateData);

      if (!category) {
        return { data: null, error: 'Failed to update category' };
      }

      // Invalidate caches
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
      revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');

      return { data: category as unknown as Category, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update category',
      };
    }
  }

  /**
   * Deletes a category
   */
  static async deleteCategory(id: string): Promise<ServiceResult<{ id: string }>> {
    try {
      // Validate ID
      if (!id || id.trim() === '') {
        return { data: null, error: 'Category ID is required' };
      }

      // Fetch existing category for cache invalidation
      const { data: existingCategory } = await this.getCategoryById(id);
      if (!existingCategory) {
        return { data: null, error: 'Category not found' };
      }

      await CategoryRepository.delete(id);

      // Invalidate caches
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
      revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');

      return { data: { id }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete category',
      };
    }
  }
}
