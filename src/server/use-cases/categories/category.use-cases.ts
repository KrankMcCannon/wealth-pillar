import { serialize } from '@/lib/utils/serializer';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { isValidColor } from './category.logic';
import { validateId, validateRequiredString } from '@/lib/utils/validation-utils';
import { invalidateCategoryCaches } from '@/lib/utils/cache-utils';
import type { Category } from '@/lib/types';

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
      const cats = await CategoriesRepository.findAll();
      return cats;
    },
    categoryCacheKeys.all(),
    cacheOptions.allCategories()
  );

  const categories = await getCachedCategories();
  return (categories || []) as unknown as Category[];
};

export const getCategoriesByGroupUseCase = async (groupId: string): Promise<Category[]> => {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedCategories = cached(
    async () => {
      const cats = await CategoriesRepository.findByGroup(groupId);
      return cats;
    },
    categoryCacheKeys.byGroup(groupId),
    cacheOptions.categoriesByGroup(groupId)
  );

  const categories = await getCachedCategories();
  return (categories || []) as unknown as Category[];
};

export const getAvailableCategoriesUseCase = async (groupId: string): Promise<Category[]> => {
  if (!groupId?.trim()) throw new Error('Group ID is required');
  return CategoriesRepository.findAvailable(groupId) as unknown as Promise<Category[]>;
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
  return category as unknown as Category;
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
  return category as unknown as Category;
};

export const createCategoryUseCase = async (data: CreateCategoryInput): Promise<Category> => {
  const label = validateRequiredString(data.label, 'Label');
  const key = validateRequiredString(data.key, 'Key');
  const icon = validateRequiredString(data.icon, 'Icon');
  const color = validateRequiredString(data.color, 'Color');
  validateId(data.group_id, 'Group ID');

  if (!isValidColor(color)) {
    throw new Error('Invalid color format. Use hex format (e.g., #FF0000)');
  }

  const category = await CategoriesRepository.create({
    label,
    key: key.toLowerCase(),
    icon,
    color: color.toUpperCase(),
    group_id: data.group_id,
  });

  if (!category) throw new Error('Failed to create category');

  invalidateCategoryCaches({});

  return serialize(category) as unknown as Category;
};

export const updateCategoryUseCase = async (
  id: string,
  data: UpdateCategoryInput
): Promise<Category> => {
  validateId(id, 'Category ID');

  const existing = await getCategoryByIdUseCase(id);
  if (!existing) throw new Error('Category not found');

  const updateData: Record<string, unknown> = {};

  if (data.label !== undefined) {
    updateData.label = validateRequiredString(data.label, 'Label');
  }

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

  const category = await CategoriesRepository.update(id, updateData);
  if (!category) throw new Error('Failed to update category');

  invalidateCategoryCaches({ categoryId: id });

  return serialize(category) as unknown as Category;
};

export const deleteCategoryUseCase = async (id: string): Promise<{ id: string }> => {
  validateId(id, 'Category ID');

  const existing = await getCategoryByIdUseCase(id);
  if (!existing) throw new Error('Category not found');

  await CategoriesRepository.delete(id);

  invalidateCategoryCaches({ categoryId: id });

  return { id };
};
