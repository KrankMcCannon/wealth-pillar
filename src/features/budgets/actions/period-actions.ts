'use server';

import { UserService } from '@/lib/services/user.service';
import { BudgetService } from '@/lib/services/budget.service';
import type { Transaction, User } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

/**
 * Server Action: Start Budget Period
 * Wraps UserService.startBudgetPeriod for client component usage
 *
 * @param userId - User ID
 * @param startDate - Period start date (ISO string)
 * @returns Updated user with new period or error
 */
export async function startPeriodAction(
  userId: string,
  startDate: string
): Promise<ServiceResult<User>> {
  try {
    return await UserService.startBudgetPeriod(userId, startDate);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to start period',
    };
  }
}

/**
 * Server Action: Close Budget Period
 * Wraps UserService.closeBudgetPeriod for client component usage
 * Fetches user budgets to calculate savings
 *
 * @param userId - User ID
 * @param endDate - Period end date (ISO string)
 * @param transactions - All transactions for calculating totals
 * @returns Updated user with closed period or error
 */
export async function closePeriodAction(
  userId: string,
  endDate: string,
  transactions: Transaction[]
): Promise<ServiceResult<User>> {
  try {
    // Fetch user's budgets for savings calculation
    const { data: userBudgets } = await BudgetService.getBudgetsByUser(userId);

    return await UserService.closeBudgetPeriod(
      userId,
      endDate,
      transactions,
      userBudgets || undefined
    );
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to close period',
    };
  }
}
