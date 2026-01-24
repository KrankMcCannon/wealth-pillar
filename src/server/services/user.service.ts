import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { userCacheKeys } from '@/lib/cache/keys';
import { UserRepository, AccountRepository, BudgetRepository, TransactionRepository } from '@/server/dal';
import { revalidateTag } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

type User = Database['public']['Tables']['users']['Row'];

/**
 * User Service
 * Handles all user-related business logic following Single Responsibility Principle
 *
 * All methods throw standard errors instead of returning ServiceResult objects
 * All database queries are cached using Next.js unstable_cache
 */
export class UserService {
  /**
   * Retrieves logged-in user information by Clerk ID
   * Used for authentication flows where we have the Clerk user ID
   */
  static async getLoggedUserInfo(clerkId: string): Promise<User> {
    // Input validation
    if (!clerkId || clerkId.trim() === '') {
      throw new Error('Clerk ID is required');
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
      throw new Error('User not found');
    }

    return user as unknown as User;
  }

  /**
   * Retrieves user by database ID
   * Used when we have the internal user ID
   */
  static async getUserById(userId: string): Promise<User> {
    // Input validation
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
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
      throw new Error('User not found');
    }

    return user as unknown as User;
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
      // In this specific case, we might want to return false or rethrow depending on usage.
      // Given previous implementation returned false, strict boolean return is safer for logic checks.
      return false;
    }
  }

  /**
   * Gets user's group ID
   * Helper method to quickly get the group a user belongs to
   */
  static async getUserGroupId(userId: string): Promise<string> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const user = await this.getUserById(userId);

    if (!user || !user.group_id) {
      throw new Error('User or Group not found');
    }

    return user.group_id;
  }

  /**
   * Get user name from user ID (client-side helper)
   * Pure function for getting user name from a list of users
   * Note: This is a utility function, technically doesn't need to be in the Service class 
   * but kept for backward compatibility of location.
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
  ): Promise<User> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    // Validate account exists if provided
    if (accountId) {
      const account = await AccountRepository.getById(accountId);
      if (!account) {
        throw new Error('Account not found');
      }
    }

    // Update user with relation connect/disconnect logic replaced by scalar update
    const updateData = {
      updated_at: new Date().toISOString(),
      default_account_id: accountId
    };

    const updatedUser = await UserRepository.update(userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to set default account');
    }

    // Invalidate user cache
    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');

    return updatedUser as unknown as User;
  }

  /**
   * Deletes a user and all related data (accounts, transactions, budgets)
   * This is a destructive operation that cannot be undone
   */
  static async deleteUser(userId: string): Promise<boolean> {
    // Input validation
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    // Get user to verify existence
    const user = await UserRepository.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Perform deletion sequentially (Prisma transaction removed)
    // Delete budgets
    await BudgetRepository.deleteByUser(userId);

    // Delete transactions
    await TransactionRepository.deleteByUser(userId);

    // Handle Accounts (remove user from shared accounts or delete if sole owner)
    // We need to fetch accounts where user is part of user_ids
    const accounts = await AccountRepository.getByUser(userId);

    if (accounts) {
      for (const account of accounts) {
        if (account.user_ids.length === 1 && account.user_ids[0] === userId) {
          // Only this user, delete account
          await AccountRepository.delete(account.id);
        } else {
          // Remove user from list
          const newUserIds = account.user_ids.filter((id: string) => id !== userId);
          await AccountRepository.update(account.id, {
            user_ids: newUserIds
          });
        }
      }
    }

    // Delete the user
    await UserRepository.delete(userId);

    return true;
  }

  /**
   * Updates user profile information (name and email)
   * Validates input and updates cache
   */
  static async updateProfile(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<User> {
    // Input validation
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field (name or email) must be provided');
    }

    // Validate name if provided
    if (updates.name !== undefined) {
      if (updates.name.trim() === '') {
        throw new Error('Name cannot be empty');
      }
      if (updates.name.length > 100) {
        throw new Error('Name must be 100 characters or less');
      }
    }

    // Validate email if provided
    if (updates.email !== undefined) {
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(updates.email)) {
        throw new Error('Invalid email format');
      }

      // Check format
      const emailLower = updates.email.toLowerCase();

      // Check if email is already in use by another user
      const existingUser = await UserRepository.getByEmail(emailLower);

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email is already in use');
      }
    }

    // Update user
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.email) updateData.email = updates.email.toLowerCase();

    const updatedUser = await UserRepository.update(userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update user profile');
    }

    // Invalidate user cache
    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');

    return updatedUser as unknown as User;
  }
}
