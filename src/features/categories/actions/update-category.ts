'use server';

/**
 * Server Action for Updating Categories
 */

import { revalidateTag } from 'next/cache';
import { categoryService } from '@/lib/api/client';
import type { Category } from "@/lib/types";

/**
 * Update an existing category
 */
export async function updateCategoryAction(
  id: string,
  data: Partial<Omit<Category, "id" | "created_at" | "updated_at">>
): Promise<{ success: boolean; data?: Category; error?: string }> {
  try {
    const category = await categoryService.update(id, data);

    // Invalidate related caches
    revalidateTag('categories');
    revalidateTag('transactions');
    revalidateTag('budgets');
    revalidateTag('dashboard');

    return { success: true, data: category };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
    console.error('[Server Action] updateCategoryAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
