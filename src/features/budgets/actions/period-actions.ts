'use server';

import { BudgetService } from '@/lib/services/budget.service';
import type { ServiceResult } from '@/lib/services/user.service';
import { UserService } from '@/lib/services/user.service';
import type { Transaction, User } from '@/lib/types';
import { toDateTime, toISOString } from '@/lib/utils/date-utils';

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
 * Automatically starts a new period from the next day
 *
 * @param userId - User ID
 * @param endDate - Period end date (ISO string)
 * @param transactions - All transactions for calculating totals
 * @returns Updated user with closed period and new active period or error
 */
export async function closePeriodAction(
  userId: string,
  endDate: string,
  transactions: Transaction[]
): Promise<ServiceResult<User>> {
  try {
    // Fetch user's budgets for savings calculation
    const { data: userBudgets } = await BudgetService.getBudgetsByUser(userId);

    // Close the current period
    const closeResult = await UserService.closeBudgetPeriod(
      userId,
      endDate,
      transactions,
      userBudgets || undefined
    );

    if (closeResult.error || !closeResult.data) {
      return closeResult;
    }

    // Automatically start a new period from the next day
    const endDateTime = toDateTime(endDate);
    if (!endDateTime) {
      return { data: null, error: 'Invalid end date' };
    }
    const nextDayDate = endDateTime.plus({ days: 1 });
    const nextDayISO = toISOString(nextDayDate);

    // Start new period
    const startResult = await UserService.startBudgetPeriod(userId, nextDayISO);

    if (startResult.error || !startResult.data) {
      // If starting new period fails, return the closed period result
      // The period was successfully closed, so we don't want to fail entirely
      console.error('Failed to start new period after closing:', startResult.error);
      return closeResult;
    }

    return startResult;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to close period',
    };
  }
}
