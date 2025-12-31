import { supabaseServer } from '@/lib/database/server';
import { cached, categoryCacheKeys, cacheOptions, CACHE_TAGS } from '@/lib/cache';
import { CATEGORY_COLOR_PALETTE, DEFAULT_CATEGORY_COLOR } from '@/features/categories';
import type { ServiceResult } from './user.service';
import type { Database } from '@/lib/database/types';
import type { Category } from '@/lib/types';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (typeof window === 'undefined') {
    const { revalidateTag } = await import('next/cache');
    tags.forEach((tag) => revalidateTag(tag, 'max'));
  }
}

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
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class CategoryService {
  /**
   * Retrieves all categories
   * Used for displaying category lists in forms, filters, and reports
   *
   * @returns Array of all categories or error
   *
   * @example
   * const { data: categories, error } = await CategoryService.getAllCategories();
   * if (error) {
   *   console.error('Failed to get categories:', error);
   * }
   */
  static async getAllCategories(): Promise<ServiceResult<Category[]>> {
    try {
      // Create cached query function
      const getCachedCategories = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('categories')
            .select('*')
            .order('label', { ascending: true });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        categoryCacheKeys.all(),
        cacheOptions.allCategories()
      );

      const categories = await getCachedCategories();

      return {
        data: (categories || []) as Category[],
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
   * Used for displaying category details
   *
   * @param categoryId - Category ID
   * @returns Category or error
   *
   * @example
   * const { data: category, error } = await CategoryService.getCategoryById(categoryId);
   * if (error) {
   *   console.error('Failed to get category:', error);
   * }
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
          const { data, error } = await supabaseServer
            .from('categories')
            .select('*')
            .eq('id', categoryId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
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
        data: category as Category,
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
   * Used for looking up categories by their key field
   *
   * @param key - Category unique key
   * @returns Category or error
   *
   * @example
   * const { data: category, error } = await CategoryService.getCategoryByKey('food');
   * if (error) {
   *   console.error('Failed to get category:', error);
   * }
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
          const { data, error } = await supabaseServer
            .from('categories')
            .select('*')
            .eq('key', key)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
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
        data: category as Category,
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
   * Groups categories by type or custom grouping logic
   * Used for organizing categories in UI (e.g., income vs expense categories)
   *
   * @param categories - Array of categories to group
   * @returns Grouped categories object
   *
   * @example
   * const { data: categories } = await CategoryService.getAllCategories();
   * const grouped = CategoryService.groupCategories(categories);
   */
  static groupCategories(categories: Category[]): Record<string, Category[]> {
    // Group by first letter for alphabetical grouping
    return categories.reduce(
      (groups: Record<string, Category[]>, category) => {
        const firstLetter = category.label.charAt(0).toUpperCase();
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(category);
        return groups;
      },
      {}
    );
  }

  /**
   * Filters categories by search query
   * Used for category search functionality
   *
   * @param categories - Array of categories to filter
   * @param searchQuery - Search query string
   * @returns Filtered categories
   *
   * @example
   * const { data: categories } = await CategoryService.getAllCategories();
   * const filtered = CategoryService.filterCategories(categories, 'food');
   */
  static filterCategories(
    categories: Category[],
    searchQuery: string
  ): Category[] {
    if (!searchQuery || searchQuery.trim() === '') {
      return categories;
    }

    const query = searchQuery.toLowerCase().trim();
    return categories.filter(
      (category) =>
        category.label.toLowerCase().includes(query) ||
        category.key.toLowerCase().includes(query)
    );
  }

  /**
   * Finds a category by ID, key, or label
   * Helper method for flexible category lookup
   *
   * @param categories - Array of categories
   * @param identifier - Category ID, key, or label
   * @returns Category or undefined
   *
   * @example
   * const category = CategoryService.findCategory(categories, 'food');
   */
  static findCategory(
    categories: Category[],
    identifier: string
  ): Category | undefined {
    return categories.find(
      (c) =>
        c.id === identifier ||
        c.key === identifier ||
        c.label.toLowerCase() === identifier.toLowerCase()
    );
  }

  /**
   * Gets category color by ID, key, or label
   * Helper method for quick color lookup
   *
   * @param categories - Array of categories
   * @param identifier - Category ID, key, or label
   * @returns Category color or default
   *
   * @example
   * const color = CategoryService.getCategoryColor(categories, 'food');
   */
  static getCategoryColor(
    categories: Category[],
    identifier: string
  ): string {
    const category = this.findCategory(categories, identifier);
    return category?.color || '#6B7280'; // Default gray color
  }

  /**
   * Gets category icon by ID, key, or label
   * Helper method for quick icon lookup
   *
   * @param categories - Array of categories
   * @param identifier - Category ID, key, or label
   * @returns Category icon or default
   *
   * @example
   * const icon = CategoryService.getCategoryIcon(categories, 'food');
   */
  static getCategoryIcon(
    categories: Category[],
    identifier: string
  ): string {
    const category = this.findCategory(categories, identifier);
    return category?.icon || 'default';
  }

  /**
   * Gets category label by ID or key
   * Helper method for quick label lookup
   *
   * @param categories - Array of categories
   * @param identifier - Category ID or key
   * @returns Category label or identifier
   *
   * @example
   * const label = CategoryService.getCategoryLabel(categories, 'food');
   */
  static getCategoryLabel(
    categories: Category[],
    identifier: string
  ): string {
    const category = this.findCategory(categories, identifier);
    return category?.label || identifier;
  }

  /**
   * Gets the color palette for category selection
   * Returns the predefined color options
   *
   * @returns Array of color options
   *
   * @example
   * const colors = CategoryService.getColorPalette();
   */
  static getColorPalette() {
    return CATEGORY_COLOR_PALETTE;
  }

  /**
   * Validates a color value
   * Checks if the color is a valid hex color
   *
   * @param color - Color hex value
   * @returns True if valid, false otherwise
   *
   * @example
   * const isValid = CategoryService.isValidColor('#FF0000'); // true
   */
  static isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * Validates category data before creation/update
   * Ensures all required fields are present and valid
   *
   * @param data - Category data to validate
   * @returns Validation result with error message if invalid
   *
   * @example
   * const result = CategoryService.validateCategoryData({ label: 'Food', icon: 'utensils', color: '#FF0000' });
   */
  static validateCategoryData(data: {
    label?: string;
    icon?: string;
    color?: string;
  }): { isValid: boolean; error?: string } {
    if (!data.label || data.label.trim() === '') {
      return { isValid: false, error: 'Label is required' };
    }

    if (!data.icon || data.icon.trim() === '') {
      return { isValid: false, error: 'Icon is required' };
    }

    if (!data.color || data.color.trim() === '') {
      return { isValid: false, error: 'Color is required' };
    }

    if (!this.isValidColor(data.color)) {
      return { isValid: false, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
    }

    return { isValid: true };
  }

  /**
   * Gets default color for new categories
   *
   * @returns Default color hex value
   *
   * @example
   * const defaultColor = CategoryService.getDefaultColor();
   */
  static getDefaultColor(): string {
    return DEFAULT_CATEGORY_COLOR;
  }

  /**
   * Creates a new category
   * Validates input data and inserts into database
   *
   * @param data - Category creation data
   * @returns Created category or error
   *
   * @example
   * const { data: category, error } = await CategoryService.createCategory({
   *   label: 'Food',
   *   key: 'food',
   *   icon: 'utensils',
   *   color: '#FF0000',
   *   group_id: 'group-123'
   * });
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

      if (!this.isValidColor(data.color)) {
        return { data: null, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
      }

      if (!data.group_id || data.group_id.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      // Insert category
      const { data: category, error } = await supabaseServer
        .from('categories')
        .insert({
          label: data.label.trim(),
          key: data.key.trim().toLowerCase(),
          icon: data.icon.trim(),
          color: data.color.trim().toUpperCase(),
          group_id: data.group_id,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!category) {
        return { data: null, error: 'Failed to create category' };
      }

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.CATEGORIES,
      ]);

      return { data: category as Category, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to create category',
      };
    }
  }

  /**
   * Updates an existing category
   * Validates input data and updates in database
   *
   * @param id - Category ID
   * @param data - Category update data
   * @returns Updated category or error
   *
   * @example
   * const { data: category, error } = await CategoryService.updateCategory('cat-123', {
   *   label: 'Food & Dining',
   *   color: '#00FF00'
   * });
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
      const updateData: Database['public']['Tables']['categories']['Update'] = {};

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
        if (!this.isValidColor(data.color)) {
          return { data: null, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
        }
        updateData.color = data.color.trim().toUpperCase();
      }

      // Update category
      const { data: category, error } = await supabaseServer
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!category) {
        return { data: null, error: 'Failed to update category' };
      }

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.CATEGORIES,
        CACHE_TAGS.CATEGORY(id),
      ]);

      return { data: category as Category, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update category',
      };
    }
  }

  /**
   * Deletes a category
   * Removes category from database
   *
   * @param id - Category ID
   * @returns Deleted category ID or error
   *
   * @example
   * const { data, error } = await CategoryService.deleteCategory('cat-123');
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

      // Delete category
      const { error } = await supabaseServer
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.CATEGORIES,
        CACHE_TAGS.CATEGORY(id),
      ]);

      return { data: { id }, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to delete category',
      };
    }
  }
}
