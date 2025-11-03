'use server';

/**
 * Server Action for Updating Budgets
 */

import { revalidateTag } from 'next/cache';
import { budgetService } from '@/lib/api/client';
import type { Budget } from "@/lib/types";

/**
 * Update an existing budget
 */
export async function updateBudgetAction(
  id: string,
  data: Partial<Omit<Budget, "id" | "created_at" | "updated_at">>
): Promise<{ success: boolean; data?: Budget; error?: string }> {
  try {
    const budget = await budgetService.update(id, data);

    // Invalidate related caches
    revalidateTag('budgets');
    revalidateTag('budget-periods');
    revalidateTag('budget-analysis');
    revalidateTag('dashboard');

    return { success: true, data: budget };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update budget';
    console.error('[Server Action] updateBudgetAction failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
