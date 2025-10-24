/**
 * Category Mutation Hooks
 *
 * Follows SOLID principles:
 * - Single Responsibility: Each hook handles one mutation type
 * - DRY: Uses centralized cache update utilities
 */

'use client';

import { Category, categoryService, queryKeys } from '@/src/lib';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Create Category Hook
 */
export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.create,

    onSuccess: (newCategory) => {
      // Update categories cache directly - no need to invalidate since we've updated it
      queryClient.setQueryData<Category[]>(
        queryKeys.categories(),
        (oldCategories = []) => [...oldCategories, newCategory]
      );
    },
  });
};

/**
 * Update Category Hook
 */
export const useUpdateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      categoryService.update(id, data),

    onSuccess: (updatedCategory) => {
      // Update categories cache directly - no need to invalidate since we've updated it
      queryClient.setQueryData<Category[]>(
        queryKeys.categories(),
        (oldCategories = []) =>
          oldCategories.map((cat) =>
            cat.id === updatedCategory.id ? updatedCategory : cat
          )
      );
    },
  });
};

/**
 * Delete Category Hook
 */
export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.delete,

    onSuccess: (_, deletedId) => {
      // Update categories cache directly - no need to invalidate since we've updated it
      queryClient.setQueryData<Category[]>(
        queryKeys.categories(),
        (oldCategories = []) =>
          oldCategories.filter((cat) => cat.id !== deletedId)
      );
    },
  });
};
