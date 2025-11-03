'use server';

/**
 * Server Action for Creating Budgets
 */

import { budgetService } from '@/lib/api/client';
import type { Budget } from "@/lib/types";
import { revalidateTag } from 'next/cache';

/**
 * Create a new budget
 * Automatically invalidates related caches after mutation
 */
export async function createBudgetAction(
  data: Omit<Budget, "id" | "created_at" | "updated_at">
): Promise<{ success: boolean; data?: Budget; error?: string }> {
  try {
    const budget = await budgetService.create(data);

    // Invalidate related caches
    revalidateTag('budgets');
    revalidateTag('budget-periods');
    revalidateTag('budget-analysis');
    revalidateTag('dashboard');

    return { success: true, data: budget };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create budget';
    console.error('[Server Action] createBudgetAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
