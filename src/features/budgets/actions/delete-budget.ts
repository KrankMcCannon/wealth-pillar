'use server';

/**
 * Server Action for Deleting Budgets
 */

import { revalidateTag } from 'next/cache';
import { budgetService } from '@/lib/api/client';

/**
 * Delete a budget
 */
export async function deleteBudgetAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await budgetService.delete(id);

    // Invalidate related caches
    revalidateTag('budgets');
    revalidateTag('budget-periods');
    revalidateTag('budget-analysis');
    revalidateTag('dashboard');

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete budget';
    console.error('[Server Action] deleteBudgetAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
