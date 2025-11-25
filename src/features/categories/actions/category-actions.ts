'use server';

import { CategoryService, CreateCategoryInput, UpdateCategoryInput } from '@/lib/services/category.service';
import type { Category } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

export async function getAllCategoriesAction(): Promise<ServiceResult<Category[]>> {
  try {
    return await CategoryService.getAllCategories();
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load categories',
    };
  }
}

/**
 * Server action to create a new category
 * Thin wrapper around CategoryService.createCategory
 *
 * @param input - Category creation data
 * @returns Created category or error
 */
export async function createCategoryAction(input: CreateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    return await CategoryService.createCategory(input);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create category',
    };
  }
}

/**
 * Server action to update an existing category
 * Thin wrapper around CategoryService.updateCategory
 *
 * @param id - Category ID
 * @param input - Category update data
 * @returns Updated category or error
 */
export async function updateCategoryAction(id: string, input: UpdateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    return await CategoryService.updateCategory(id, input);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update category',
    };
  }
}

/**
 * Server action to delete a category
 * Thin wrapper around CategoryService.deleteCategory
 *
 * @param id - Category ID
 * @returns Deleted category ID or error
 */
export async function deleteCategoryAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    return await CategoryService.deleteCategory(id);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
