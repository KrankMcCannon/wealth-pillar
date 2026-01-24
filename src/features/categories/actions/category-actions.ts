'use server';

import { revalidateTag } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { CreateCategoryInput, UpdateCategoryInput, CategoryService } from '@/server/services';
import type { Category } from '@/lib/types';
import { FinanceLogicService } from '@/server/services';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Server action to get all categories
 */
export async function getAllCategoriesAction(): Promise<ServiceResult<Category[]>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.group_id) {
      // If no group, return empty array
      return { data: [], error: null };
    }

    // Fetch categories for user's group using Service
    // Note: CategoryService.getCategoriesByGroup filters by group
    const categories = await CategoryService.getCategoriesByGroup(currentUser.group_id);
    return { data: categories, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load categories',
    };
  }
}

/**
 * Server action to create a new category
 */
export async function createCategoryAction(input: CreateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato' };
    }

    // Validation
    if (!input.group_id) return { data: null, error: 'Group ID is required' };

    // Permission: User must belong to the group
    if (currentUser.group_id !== input.group_id) {
      return { data: null, error: 'Permission denied' };
    }

    // Input Validation
    if (!input.label || input.label.trim() === '') return { data: null, error: 'Label is required' };
    if (!input.key || input.key.trim() === '') return { data: null, error: 'Key is required' };
    if (!input.icon || input.icon.trim() === '') return { data: null, error: 'Icon is required' };
    if (!input.color || input.color.trim() === '') return { data: null, error: 'Color is required' };

    if (!FinanceLogicService.isValidColor(input.color)) {
      return { data: null, error: 'Invalid color format. Use hex format (e.g., #FF0000)' };
    }

    const category = await CategoryService.createCategory(input);

    if (category) {
      // Invalidate caches
      // Service handles some tags, but actions might need broader revalidation if needed
      // Service handles CATEGORIES tag.

      revalidateTag(`group:${input.group_id}:categories`, 'max');

      return { data: category, error: null };
    }

    return { data: null, error: 'Failed to create category' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}

/**
 * Server action to update an existing category
 */
export async function updateCategoryAction(id: string, input: UpdateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato' };
    }

    const existingCategory = await CategoryService.getCategoryById(id);
    if (!existingCategory) return { data: null, error: 'Category not found' };

    // Permission check
    if (currentUser.group_id !== existingCategory.group_id) {
      return { data: null, error: 'Permission denied' };
    }

    // Validation
    if (input.label !== undefined && input.label.trim() === '') return { data: null, error: 'Label cannot be empty' };
    if (input.icon !== undefined && input.icon.trim() === '') return { data: null, error: 'Icon cannot be empty' };
    if (input.color !== undefined) {
      if (input.color.trim() === '') return { data: null, error: 'Color cannot be empty' };
      if (!FinanceLogicService.isValidColor(input.color)) return { data: null, error: 'Invalid color format' };
    }

    const category = await CategoryService.updateCategory(id, input);

    if (category) {
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');

      return { data: category, error: null };
    }

    return { data: null, error: 'Failed to update category' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}

/**
 * Server action to delete a category
 */
export async function deleteCategoryAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato' };
    }

    const existingCategory = await CategoryService.getCategoryById(id);
    if (!existingCategory) return { data: null, error: 'Category not found' };

    // Permission check
    if (currentUser.group_id !== existingCategory.group_id) {
      return { data: null, error: 'Permission denied' };
    }

    const result = await CategoryService.deleteCategory(id);

    if (result) {
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');
      return { data: result, error: null };
    }

    return { data: null, error: 'Failed to delete category' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
