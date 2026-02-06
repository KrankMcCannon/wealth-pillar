'use server';

import { revalidateTag } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryService,
  FinanceLogicService,
} from '@/server/services';
import type { Category } from '@/lib/types';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

async function getCategoryActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Categories.Actions' });
  }
  return getTranslations('Categories.Actions');
}

/**
 * Validates category input
 */
function validateCategoryInput(
  input: CreateCategoryInput,
  t: Awaited<ReturnType<typeof getTranslations>>
): string | null {
  if (!input.label || input.label.trim() === '') return t('errors.labelRequired');
  if (!input.key || input.key.trim() === '') return t('errors.keyRequired');
  if (!input.icon || input.icon.trim() === '') return t('errors.iconRequired');
  if (!input.color || input.color.trim() === '') return t('errors.colorRequired');

  if (!FinanceLogicService.isValidColor(input.color)) {
    return t('errors.colorInvalid');
  }

  return null;
}

/**
 * Validates category update input
 */
function validateUpdateCategoryInput(
  input: UpdateCategoryInput,
  t: Awaited<ReturnType<typeof getTranslations>>
): string | null {
  if (input.label !== undefined && input.label.trim() === '') return t('errors.labelEmpty');
  if (input.icon !== undefined && input.icon.trim() === '') return t('errors.iconEmpty');

  if (input.color !== undefined) {
    if (input.color.trim() === '') return t('errors.colorEmpty');
    if (!FinanceLogicService.isValidColor(input.color)) return t('errors.colorInvalid');
  }

  return null;
}

/**
 * Server action to get all categories
 */
export async function getAllCategoriesAction(): Promise<ServiceResult<Category[]>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser?.group_id) {
      // If no group (e.g. onboarding), return system default categories from DB
      const result = await CategoryService.getSystemCategories();
      return { data: result, error: null };
    }

    // Fetch available categories (System + Group Custom) using Service
    // Note: CategoryService.getAvailableCategories handles strict isolation
    const categories = await CategoryService.getAvailableCategories(currentUser.group_id);
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
export async function createCategoryAction(
  input: CreateCategoryInput,
  locale?: string
): Promise<ServiceResult<Category>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getCategoryActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    // Validation
    if (!input.group_id) return { data: null, error: t('errors.groupRequired') };

    // Permission: User must belong to the group
    if (currentUser.group_id !== input.group_id) {
      return { data: null, error: t('errors.permissionDenied') };
    }

    // Input Validation
    const validationError = validateCategoryInput(input, t);
    if (validationError) {
      return { data: null, error: validationError };
    }

    const category = await CategoryService.createCategory(input);

    if (category) {
      // Invalidate caches
      // Service handles some tags, but actions might need broader revalidation if needed
      // Service handles CATEGORIES tag.

      revalidateTag(`group:${input.group_id}:categories`, 'max');

      return { data: category, error: null };
    }

    return { data: null, error: t('errors.createFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.createFailed') ?? 'Failed to create category'),
    };
  }
}

/**
 * Server action to update an existing category
 */
export async function updateCategoryAction(
  id: string,
  input: UpdateCategoryInput,
  locale?: string
): Promise<ServiceResult<Category>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getCategoryActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    const existingCategory = await CategoryService.getCategoryById(id);
    if (!existingCategory) return { data: null, error: t('errors.notFound') };

    // Permission check
    if (currentUser.group_id !== existingCategory.group_id) {
      return { data: null, error: t('errors.permissionDenied') };
    }

    // Validation
    const validationError = validateUpdateCategoryInput(input, t);
    if (validationError) {
      return { data: null, error: validationError };
    }

    const category = await CategoryService.updateCategory(id, input);

    if (category) {
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');

      return { data: category, error: null };
    }

    return { data: null, error: t('errors.updateFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.updateFailed') ?? 'Failed to update category'),
    };
  }
}

/**
 * Server action to delete a category
 */
export async function deleteCategoryAction(
  id: string,
  locale?: string
): Promise<ServiceResult<{ id: string }>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getCategoryActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    const existingCategory = await CategoryService.getCategoryById(id);
    if (!existingCategory) return { data: null, error: t('errors.notFound') };

    // Permission check
    if (currentUser.group_id !== existingCategory.group_id) {
      return { data: null, error: t('errors.permissionDenied') };
    }

    const result = await CategoryService.deleteCategory(id);

    if (result) {
      revalidateTag(`group:${existingCategory.group_id}:categories`, 'max');
      return { data: result, error: null };
    }

    return { data: null, error: t('errors.deleteFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.deleteFailed') ?? 'Failed to delete category'),
    };
  }
}
