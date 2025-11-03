'use server';

/**
 * Server Action for Deleting Categories
 */

import { revalidateTag } from 'next/cache';
import { categoryService } from '@/lib/api/client';

/**
 * Delete a category
 */
export async function deleteCategoryAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await categoryService.delete(id);

    // Invalidate related caches
    revalidateTag('categories');
    revalidateTag('transactions');
    revalidateTag('budgets');
    revalidateTag('dashboard');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
    console.error('[Server Action] deleteCategoryAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
