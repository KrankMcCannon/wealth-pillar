import { CACHE_TAGS, cached, cacheOptions, userCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import { nowISO } from '@/lib/utils/date-utils';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }
  }
}

/**
 * User type from database
 */
type User = Database['public']['Tables']['users']['Row'];

/**
 * Service result type for better error handling
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * User Service
 * Handles all user-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class UserService {
  /**
   * Retrieves logged-in user information by Clerk ID
   * Used for authentication flows where we have the Clerk user ID
   *
   * @param clerkId - Clerk authentication ID
   * @returns User data or error
   *
   * @example
   * const { data: user, error } = await UserService.getLoggedUserInfo(clerkId);
   * if (error) {
   *   console.error('Failed to get user:', error);
   * }
   */
  static async getLoggedUserInfo(
    clerkId: string
  ): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!clerkId || clerkId.trim() === '') {
        return {
          data: null,
          error: 'Clerk ID is required',
        };
      }

      // Create cached query function
      const getCachedUser = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        userCacheKeys.byClerkId(clerkId),
        cacheOptions.userByClerk(clerkId)
      );

      const user = await getCachedUser();

      if (!user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      return {
        data: user as User,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user information',
      };
    }
  }

  /**
   * Retrieves user by database ID
   * Used when we have the internal user ID
   *
   * @param userId - Internal user ID from database
   * @returns User data or error
   *
   * @example
   * const { data: user, error } = await UserService.getUserById(userId);
   */
  static async getUserById(userId: string): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Create cached query function
      const getCachedUser = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        userCacheKeys.byId(userId),
        cacheOptions.user(userId)
      );

      const user = await getCachedUser();

      if (!user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      return {
        data: user as User,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user information',
      };
    }
  }

  /**
   * Checks if a user exists by Clerk ID
   * Lightweight check without fetching full user data
   *
   * @param clerkId - Clerk authentication ID
   * @returns Boolean indicating if user exists
   *
   * @example
   * const exists = await UserService.userExistsByClerkId(clerkId);
   */
  static async userExistsByClerkId(clerkId: string): Promise<boolean> {
    try {
      if (!clerkId || clerkId.trim() === '') {
        return false;
      }

      const { data, error } = await supabaseServer
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Gets user's group ID
   * Helper method to quickly get the group a user belongs to
   *
   * @param userId - User ID
   * @returns Group ID or null
   *
   * @example
   * const groupId = await UserService.getUserGroupId(userId);
   */
  static async getUserGroupId(
    userId: string
  ): Promise<ServiceResult<string>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const { data: user, error } = await this.getUserById(userId);

      if (error || !user) {
        return {
          data: null,
          error: error || 'User not found',
        };
      }

      return {
        data: user.group_id,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group ID',
      };
    }
  }

  /**
   * Get user name from user ID (client-side helper)
   * Pure function for getting user name from a list of users
   * Does not require database access - used in components with user data already loaded
   *
   * @param userId - User ID to look up
   * @param users - Array of users to search through
   * @returns User name or 'Sconosciuto' if not found
   *
   * @example
   * const userName = UserService.getUserName(userId, groupUsers);
   */
  static getUserName(
    userId: string | null,
    users: Array<{ id: string; name: string }>
  ): string {
    if (!userId) return 'Sconosciuto';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Sconosciuto';
  }

  // Note: startBudgetPeriod and closeBudgetPeriod methods have been removed.
  // Use BudgetPeriodService.createPeriod() and BudgetPeriodService.closePeriod() instead.

  /**
   * Set default account for a user
   * Updates the user's default_account_id field
   *
   * @param userId - User ID
   * @param accountId - Account ID to set as default (or null to clear)
   * @returns Updated user or error
   *
   * @example
   * const { data: user, error } = await UserService.setDefaultAccount(userId, accountId);
   */
  static async setDefaultAccount(
    userId: string,
    accountId: string | null
  ): Promise<ServiceResult<User>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      // Validate account exists if provided
      if (accountId) {
        const { AccountService } = await import('./account.service');
        const accountExists = await AccountService.accountExists(accountId);
        if (!accountExists) {
          return { data: null, error: 'Account not found' };
        }
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          default_account_id: accountId,
          updated_at: nowISO(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedUser) {
        return { data: null, error: 'Failed to set default account' };
      }

      // Invalidate user cache
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
      ]);

      return { data: updatedUser as User, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to set default account',
      };
    }
  }

  /**
   * Deletes a user and all related data (accounts, transactions, budgets)
   * This is a destructive operation that cannot be undone
   *
   * @param userId - ID of the user to delete
   * @returns Success status or error
   *
   * @example
   * const { data: success, error } = await UserService.deleteUser(userId);
   * if (error) {
   *   console.error('Failed to delete user:', error);
   * }
   */
  static async deleteUser(userId: string): Promise<ServiceResult<boolean>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Get user to verify existence and get clerk_id
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('id, clerk_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      // Delete all related data in correct order
      // The database should handle cascading deletes, but we'll be explicit

      // Delete budgets first (has foreign key to user)
      await supabaseServer
        .from('budgets')
        .delete()
        .eq('user_id', userId);

      // Delete transactions (has foreign key to accounts)
      // Get all account IDs for this user and delete their transactions
      const { data: userAccounts } = await supabaseServer
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

      if (userAccounts && userAccounts.length > 0) {
        type AccountIdRow = { id: string };
        const accountIds = (userAccounts as AccountIdRow[]).map((acc) => acc.id);
        await supabaseServer
          .from('transactions')
          .delete()
          .in('account_id', accountIds);
      }

      // Delete accounts (has foreign key to user)
      await supabaseServer
        .from('accounts')
        .delete()
        .eq('user_id', userId);

      // Delete the user
      const { error: deleteUserError } = await supabaseServer
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        return {
          data: null,
          error: 'Failed to delete user',
        };
      }

      // Invalidate all related caches
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
        CACHE_TAGS.ACCOUNTS,
        CACHE_TAGS.TRANSACTIONS,
        CACHE_TAGS.BUDGETS,
      ]);

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

  /**
   * Updates user profile information (name and email)
   * Validates input and updates cache
   *
   * @param userId - User ID
   * @param updates - Profile updates (name and/or email)
   * @returns Updated user or error
   *
   * @example
   * const { data: user, error } = await UserService.updateProfile(userId, {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   */
  static async updateProfile(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      if (!updates || Object.keys(updates).length === 0) {
        return {
          data: null,
          error: 'At least one field (name or email) must be provided',
        };
      }

      // Validate name if provided
      if (updates.name !== undefined) {
        if (updates.name.trim() === '') {
          return {
            data: null,
            error: 'Name cannot be empty',
          };
        }
        if (updates.name.length > 100) {
          return {
            data: null,
            error: 'Name must be 100 characters or less',
          };
        }
      }

      // Validate email if provided
      if (updates.email !== undefined) {
        const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
        if (!emailRegex.test(updates.email)) {
          return {
            data: null,
            error: 'Invalid email format',
          };
        }

        // Check if email is already in use by another user
        const { data: existingUser } = await supabaseServer
          .from('users')
          .select('id')
          .eq('email', updates.email.toLowerCase())
          .neq('id', userId)
          .single();

        if (existingUser) {
          return {
            data: null,
            error: 'Email is already in use',
          };
        }
      }

      // Update user
      const updateData: Partial<User> = {
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.email && { email: updates.email.toLowerCase() }),
        updated_at: nowISO(),
      };

      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedUser) {
        return {
          data: null,
          error: 'Failed to update user profile',
        };
      }

      // Invalidate user cache
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
      ]);

      return {
        data: updatedUser as User,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update user profile',
      };
    }
  }
}
