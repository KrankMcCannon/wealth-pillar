'use server';

import { clerkClient } from '@clerk/nextjs/server';
import { UserService } from '@/lib/services';
import type { ServiceResult } from '@/lib/services/user.service';

/**
 * Deletes a user and all related data (accounts, transactions, budgets)
 * This also deletes the Clerk user account
 *
 * This is a destructive operation that cannot be undone
 */
export async function deleteUserAction(
  userId: string,
  clerkId: string
): Promise<ServiceResult<boolean>> {
  try {
    // Input validation
    if (!userId || userId.trim() === '') {
      return {
        data: null,
        error: 'User ID is required',
      };
    }

    if (!clerkId || clerkId.trim() === '') {
      return {
        data: null,
        error: 'Clerk ID is required',
      };
    }

    // Delete user and all related data from database
    const { data, error } = await UserService.deleteUser(userId);

    if (error || !data) {
      return {
        data: null,
        error: error || 'Failed to delete user from database',
      };
    }

    // Delete Clerk user
    try {
      await (await clerkClient()).users.deleteUser(clerkId);
    } catch (clerkError) {
      console.error('Failed to delete Clerk user:', clerkError);
      // Don't return error here - database deletion succeeded
      // Clerk deletion is best-effort
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete user',
    };
  }
}
