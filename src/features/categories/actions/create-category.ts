'use server';

/**
 * Server Action for Creating Categories
 */

import { revalidateTag } from 'next/cache';
import { categoryService } from '@/lib/api/client';
import type { Category } from "@/lib/types";

/**
 * Create a new category
 */
export async function createCategoryAction(
  data: Omit<Category, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: Category; error?: string }> {
  try {
    const category = await categoryService.create(data);

    // Invalidate related caches
    revalidateTag('categories');
    revalidateTag('transactions');
    revalidateTag('budgets');
    revalidateTag('dashboard');

    return { success: true, data: category };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create category';
    console.error('[Server Action] createCategoryAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
