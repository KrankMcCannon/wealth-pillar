import { serialize } from '@/lib/utils/serializer';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { categoryCacheKeys } from '@/lib/cache/keys';
import { CategoriesRepository } from '@/server/repositories/categories.repository';
import { isValidColor } from './category.logic';
import { validateId, validateRequiredString } from '@/lib/utils/validation-utils';
import { invalidateCategoryCaches } from '@/lib/utils/cache-utils';
import type { Category } from '@/lib/types';
import { db } from '@/server/db/drizzle';
import { categories, transactions, recurringTransactions, budgets } from '@/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';

async function ensureUniqueCategoryKeyForUpdate(
  baseKey: string,
  categoryId: string
): Promise<string> {
  let candidate = baseKey;
  let suffix = 2;
  while (true) {
    const existing = await CategoriesRepository.findByKey(candidate);
    if (!existing || existing.id === categoryId) {
      break;
    }
    candidate = `${baseKey}_${suffix}`;
    suffix += 1;
    if (suffix > 100) return `${baseKey}_${Date.now().toString(36)}`;
  }
  return candidate;
}

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

  const oldKey = existing.key;
  let newKey = oldKey;

  if (data.label !== undefined) {
    const label = validateRequiredString(data.label, 'Label');
    updateData.label = label;

    if (label !== existing.label) {
      const normalizedKey = label
        .toLowerCase()
        .trim()
        .replaceAll(/[^a-z0-9]+/g, '_')
        .replaceAll(/(^_+)|(_+$)/g, '');
      newKey = await ensureUniqueCategoryKeyForUpdate(normalizedKey, id);
      if (newKey !== oldKey) {
        updateData.key = newKey;
      }
    }
  }

  const category = await db.transaction(async (tx) => {
    const [updatedCategory] = await tx
      .update(categories)
      .set({ ...updateData, updated_at: new Date() })
      .where(eq(categories.id, id))
      .returning();
    if (!updatedCategory) throw new Error('Failed to update category');

    if (newKey !== oldKey) {
      // Update all transactions referencing the old category key
      await tx
        .update(transactions)
        .set({ category: newKey })
        .where(eq(transactions.category, oldKey));

      // Update all recurring transactions referencing the old category key
      await tx
        .update(recurringTransactions)
        .set({ category: newKey })
        .where(eq(recurringTransactions.category, oldKey));

      // Update all budgets referencing the old category key in their jsonb array
      const affectedBudgets = await tx
        .select()
        .from(budgets)
        .where(sql`jsonb_exists(${budgets.categories}, ${oldKey})`);

      for (const b of affectedBudgets) {
        const cats = Array.isArray(b.categories) ? b.categories : [];
        const newCats = cats.map((c) => (c === oldKey ? newKey : c));
        await tx.update(budgets).set({ categories: newCats }).where(eq(budgets.id, b.id));
      }
    }

    return updatedCategory;
  });

  invalidateCategoryCaches({ categoryId: id });
  revalidateTag(`group:${existing.group_id}:categories`, 'max');

  if (newKey !== oldKey) {
    revalidateTag(`group:${existing.group_id}:transactions`, 'max');
    revalidateTag(`group:${existing.group_id}:budgets`, 'max');
    revalidateTag(`group:${existing.group_id}:recurring`, 'max');
    revalidateTag(CACHE_TAGS.TRANSACTIONS, 'max');
    revalidateTag(CACHE_TAGS.BUDGETS, 'max');
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
  }

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
