'use server';

import { BudgetService, CreateBudgetInput } from '@/lib/services/budget.service';
import type { Budget } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

/**
 * Server Action: Create Budget
 * Wraps BudgetService.createBudget for client component usage
 */
export async function createBudgetAction(
  input: CreateBudgetInput
): Promise<ServiceResult<Budget>> {
  try {
    return await BudgetService.createBudget(input);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create budget',
    };
  }
}

/**
 * Server Action: Update Budget
 * Wraps BudgetService.updateBudget for client component usage
 */
export async function updateBudgetAction(
  id: string,
  input: Partial<CreateBudgetInput>
): Promise<ServiceResult<Budget>> {
  try {
    return await BudgetService.updateBudget(id, input);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update budget',
    };
  }
}

/**
 * Server Action: Delete Budget
 * Wraps BudgetService.deleteBudget for client component usage
 */
export async function deleteBudgetAction(
  id: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    return await BudgetService.deleteBudget(id);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete budget',
    };
  }
}
