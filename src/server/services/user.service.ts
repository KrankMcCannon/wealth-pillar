import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { userCacheKeys } from '@/lib/cache/keys';
import { UserRepository, AccountRepository, BudgetRepository, TransactionRepository } from '@/server/dal';
import { prisma } from '@/server/db/prisma';
import { revalidateTag } from 'next/cache';

/**
 * Service result type for better error handling
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

// Type aliases for Prisma models
import type { users as User } from '@prisma/client';
import type { Prisma } from '@prisma/client';

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
          const user = await UserRepository.getByClerkId(clerkId);
          return user;
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
          const user = await UserRepository.getById(userId);
          return user;
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
   */
  static async userExistsByClerkId(clerkId: string): Promise<boolean> {
    try {
      if (!clerkId || clerkId.trim() === '') {
        return false;
      }

      const user = await UserRepository.getByClerkId(clerkId);
      return !!user;
    } catch (err) {
      console.warn('[UserService] Unexpected error checking user existence:', err);
      return false;
    }
  }

  /**
   * Gets user's group ID
   * Helper method to quickly get the group a user belongs to
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

      if (error || !user || !user.group_id) {
        return {
          data: null,
          error: error || 'User or Group not found',
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
   */
  static getUserName(
    userId: string | null,
    users: Array<{ id: string; name: string }>
  ): string {
    if (!userId) return 'Sconosciuto';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Sconosciuto';
  }

  /**
   * Set default account for a user
   * Updates the user's default_account_id field
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
        const account = await AccountRepository.getById(accountId);
        if (!account) {
          return { data: null, error: 'Account not found' };
        }
      }

      // Update user with relation connect/disconnect
      // default_account_id is a relation scalar, handle via accounts relation
      const updateData: Prisma.usersUpdateInput = {
        updated_at: new Date(),
        accounts: accountId
          ? { connect: { id: accountId } }
          : { disconnect: true }
      };

      const updatedUser = await UserRepository.update(userId, updateData);

      if (!updatedUser) {
        return { data: null, error: 'Failed to set default account' };
      }

      // Invalidate user cache
      revalidateTag(CACHE_TAGS.USERS, 'max');
      revalidateTag(CACHE_TAGS.USER(userId), 'max');

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

      // Get user to verify existence (read doesn't typically need to be in the write transaction unless for locking)
      // But for consistency we can use prisma (default) outside or inside. Outside is fine.
      const user = await UserRepository.getById(userId);
      if (!user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      // Perform deletion in a transaction
      await prisma.$transaction(async (tx) => {
        // Delete budgets
        await BudgetRepository.deleteByUser(userId, tx);

        // Delete transactions
        await TransactionRepository.deleteByUser(userId, tx);

        // Handle Accounts (remove user from shared accounts or delete if sole owner)
        const accounts = await tx.accounts.findMany({
          where: { user_ids: { has: userId } }
        });

        for (const account of accounts) {
          if (account.user_ids.length === 1 && account.user_ids[0] === userId) {
            // Only this user, delete account
            await AccountRepository.delete(account.id, tx);
          } else {
            // Remove user from list
            const newUserIds = account.user_ids.filter(id => id !== userId);
            await AccountRepository.update(account.id, {
              user_ids: newUserIds
            }, tx);
          }
        }

        // Delete the user
        await UserRepository.delete(userId, tx);
      });

      return { data: true, error: null };
    } catch (error) {
      console.error("[deleteUser] Error:", error);
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

        // Check format
        const emailLower = updates.email.toLowerCase();

        // Check if email is already in use by another user
        // Using prisma directly for uniqueness check
        const existingUser = await prisma.users.findUnique({
          where: { email: emailLower }
        });

        if (existingUser && existingUser.id !== userId) {
          return {
            data: null,
            error: 'Email is already in use',
          };
        }
      }

      // Update user
      // Use Prisma types
      const updateData: Prisma.usersUpdateInput = {
        updated_at: new Date()
      };

      if (updates.name) updateData.name = updates.name.trim();
      if (updates.email) updateData.email = updates.email.toLowerCase();

      const updatedUser = await UserRepository.update(userId, updateData);

      if (!updatedUser) {
        return {
          data: null,
          error: 'Failed to update user profile',
        };
      }

      // Invalidate user cache
      revalidateTag(CACHE_TAGS.USERS, 'max');
      revalidateTag(CACHE_TAGS.USER(userId), 'max');

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
