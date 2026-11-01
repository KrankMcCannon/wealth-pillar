import { serialize } from '@/lib/utils/serializer';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { isValidColor } from './category.logic';
import { validateId, validateRequiredString } from '@/lib/utils/validation-utils';
import { invalidateCategoryCaches } from '@/lib/utils/cache-utils';
import type { Category } from '@/lib/types';
import { SYSTEM_GROUP_ID } from '@/lib/constants';

export interface CreateCategoryInput {
  label: string;
  key: string;
  icon: string;
  color: string;
  group_id: string;
}

export interface UpdateCategoryInput {
  label?: string;
  icon?: string;
  color?: string;
}

export const getAllCategoriesUseCase = async (): Promise<Category[]> => {
  const getCachedCategories = cached(
    async () => {
      const cats = await CategoriesRepository.findByGroup(SYSTEM_GROUP_ID);
      return cats;
    },
    categoryCacheKeys.all(),
    cacheOptions.allCategories()
  );

  const categories = await getCachedCategories();
  return categories || [];
};

export const getCategoriesByGroupUseCase = async (groupId: string): Promise<Category[]> => {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedCategories = cached(
    async () => {
      const cats = await CategoriesRepository.findAvailable(groupId);
      return cats;
    },
    categoryCacheKeys.byGroup(groupId),
    cacheOptions.categoriesByGroup(groupId)
  );

  const categories = await getCachedCategories();
  return categories || [];
};

export const getAvailableCategoriesUseCase = async (groupId: string): Promise<Category[]> => {
  if (!groupId?.trim()) throw new Error('Group ID is required');
  return CategoriesRepository.findAvailable(groupId);
};

export const getCategoryByIdUseCase = async (categoryId: string): Promise<Category> => {
  if (!categoryId?.trim()) throw new Error('Category ID is required');

  const getCachedCategory = cached(
    async () => {
      const category = await CategoriesRepository.findById(categoryId);
      return category;
    },
    categoryCacheKeys.byId(categoryId),
    cacheOptions.category(categoryId)
  );

  const category = await getCachedCategory();
  if (!category) throw new Error('Category not found');
  return category;
};

export const getCategoryByKeyUseCase = async (key: string): Promise<Category> => {
  if (!key?.trim()) throw new Error('Category key is required');

  const getCachedCategory = cached(
    async () => CategoriesRepository.findByKey(key),
    categoryCacheKeys.byKey(key),
    cacheOptions.category(key)
  );

  const category = await getCachedCategory();
  if (!category) throw new Error('Category not found');
  return category;
};

async function ensureUniqueCategoryKey(baseKey: string): Promise<string> {
  let candidate = baseKey;
  let suffix = 2;
  while (await CategoriesRepository.findByKey(candidate)) {
    candidate = `${baseKey}_${suffix}`;
    suffix += 1;
    if (suffix > 100) return `${baseKey}_${Date.now().toString(36)}`;
  }
  return candidate;
}

export const createCategoryUseCase = async (data: CreateCategoryInput): Promise<Category> => {
  const label = validateRequiredString(data.label, 'Label');
  const key = validateRequiredString(data.key, 'Key');
  const icon = validateRequiredString(data.icon, 'Icon');
  const color = validateRequiredString(data.color, 'Color');
  validateId(data.group_id, 'Group ID');

  if (!isValidColor(color)) {
    throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
  }

  const normalizedKey = key.toLowerCase();
  const uniqueKey = await ensureUniqueCategoryKey(normalizedKey);

  const category = await CategoriesRepository.create({
    label,
    key: uniqueKey,
    icon,
    color: color.toUpperCase(),
    group_id: data.group_id,
  });

  if (!category) throw new Error('Failed to create category');

  invalidateCategoryCaches({ groupId: data.group_id });

  return serialize(category);
};

export const updateCategoryUseCase = async (
  id: string,
  data: UpdateCategoryInput
): Promise<Category> => {
  validateId(id, 'Category ID');

  const existing = await getCategoryByIdUseCase(id);
  if (!existing) throw new Error('Category not found');

  const updateData: Record<string, unknown> = {};

  if (data.icon !== undefined) {
    updateData.icon = validateRequiredString(data.icon, 'Icon');
  }

  if (data.color !== undefined) {
    const color = validateRequiredString(data.color, 'Color');
    if (!isValidColor(color)) {
      throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
    }
    updateData.color = color.toUpperCase();
  }

  if (data.label !== undefined) updateData.label = validateRequiredString(data.label, 'Label');
  // Keys are durable references in transactions, recurring series and historical budget snapshots.
  // Renaming a display label must not rewrite financial history or another tenant's records.
  const category = await CategoriesRepository.update(id, updateData);
  invalidateCategoryCaches({ categoryId: id, groupId: existing.group_id });
  return serialize(category);
};

export const deleteCategoryUseCase = async (id: string): Promise<{ id: string }> => {
  validateId(id, 'Category ID');

  const existing = await getCategoryByIdUseCase(id);
  if (!existing) throw new Error('Category not found');

  await CategoriesRepository.delete(id);

  invalidateCategoryCaches({ categoryId: id, groupId: existing.group_id });

  return { id };
};
