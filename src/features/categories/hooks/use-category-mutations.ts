/**
 * Category Mutation Hooks (Refactored with Generic Factory)
 *
 * These hooks were refactored to use the generic mutation factory.
 * The factory handles optimistic updates, snapshots, and rollback automatically.
 */

'use client';

import { useGenericMutation } from '@/src/lib/hooks';
import { Category, categoryService, queryKeys } from '@/src/lib';

/**
 * Create a new category
 */
export const useCreateCategory = () =>
  useGenericMutation<Category, Omit<Category, 'id' | 'created_at' | 'updated_at'>>(
    categoryService.create,
    {
      cacheKeys: () => [queryKeys.categories()],
      cacheUpdateFn: (qc, category) => {
        qc.setQueryData<Category[]>(
          queryKeys.categories(),
          (oldCategories = []) => [...oldCategories, category]
        );
      },
      operation: 'create',
    }
  );

/**
 * Update an existing category
 */
export const useUpdateCategory = () =>
  useGenericMutation<Category, { id: string; data: Partial<Category> }>(
    ({ id, data }) => categoryService.update(id, data),
    {
      cacheKeys: () => [queryKeys.categories()],
      cacheUpdateFn: (qc, category) => {
        qc.setQueryData<Category[]>(
          queryKeys.categories(),
          (oldCategories = []) =>
            oldCategories.map((cat) => (cat.id === category.id ? category : cat))
        );
      },
      operation: 'update',
    }
  );

/**
 * Delete a category
 */
export const useDeleteCategory = () =>
  useGenericMutation<void, string>(categoryService.delete, {
    cacheKeys: () => [queryKeys.categories()],
    cacheUpdateFn: () => {
      // For delete, invalidate to refresh
    },
    operation: 'delete',
  });
