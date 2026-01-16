'use server';

import { revalidateTag } from 'next/cache';

import { CreateCategoryInput, UpdateCategoryInput } from '@/server/services/category.service';
import type { Category } from '@/lib/types';
import type { ServiceResult } from '@/server/services/user.service';
import { CategoryRepository } from '@/server/dal/category.repository';
import { UserService } from '@/server/services/user.service';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import { auth } from '@clerk/nextjs/server';
import { CACHE_TAGS } from '@/lib/cache';

/**
 * Server action to get all categories
 * (Actually this should probably filter by user/group context, but replicating Service behavior for now which returned all?)
 * Service.getAllCategories returned all. Assuming RLS handled filtering before.
 * Now with Prisma we must filter manually if we want security.
 * BUT: The original action simply called Service.getAllCategories.
 * I will implement it safely by getting the user's group.
 */
export async function getAllCategoriesAction(): Promise<ServiceResult<Category[]>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato' };
    }

    // Get current user
    const { data: currentUser } = await UserService.getLoggedUserInfo(clerkId);
    if (!currentUser || !currentUser.group_id) {
      // If no group, maybe return empty or error?
      return { data: [], error: null };
    }

    // Fetch categories for user's group
    const categories = await CategoryRepository.getByGroup(currentUser.group_id);
    return { data: categories as unknown as Category[], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to load categories',
    };
  }
}

/**
 * Server action to create a new category
 * Wraps CategoryRepository.create
 */
export async function createCategoryAction(input: CreateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato' };
    }

    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'User not found' };
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

    const category = await CategoryRepository.create({
      label: input.label.trim(),
      key: input.key.trim().toLowerCase(),
      icon: input.icon.trim(),
      color: input.color.trim().toUpperCase(),
      groups: { connect: { id: input.group_id } }
    });

    if (category) {
      // Invalidate caches
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
      revalidateTag(`group:${input.group_id}:categories`, 'max');

      return { data: category as unknown as Category, error: null };
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
 * Wraps CategoryRepository.update
 */
export async function updateCategoryAction(id: string, input: UpdateCategoryInput): Promise<ServiceResult<Category>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato' };
    }

    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'User not found' };
    }

    const existingCategory = await CategoryRepository.getById(id);
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

    const category = await CategoryRepository.update(id, {
      label: input.label?.trim(),
      icon: input.icon?.trim(),
      color: input.color?.trim().toUpperCase(),
    });

    if (category) {
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
      revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');

      return { data: category as unknown as Category, error: null };
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
 * Wraps CategoryRepository.delete
 */
export async function deleteCategoryAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato' };
    }

    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'User not found' };
    }

    const existingCategory = await CategoryRepository.getById(id);
    if (!existingCategory) return { data: null, error: 'Category not found' };

    // Permission check
    if (currentUser.group_id !== existingCategory.group_id) {
      return { data: null, error: 'Permission denied' };
    }

    const result = await CategoryRepository.delete(id);

    if (result) {
      revalidateTag(CACHE_TAGS.CATEGORIES, 'max');
      revalidateTag(CACHE_TAGS.CATEGORY(id), 'max');
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');

      return { data: { id }, error: null };
    }

    return { data: null, error: 'Failed to delete category' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete category',
    };
  }
}
