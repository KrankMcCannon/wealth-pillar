import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { userCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { TransactionService } from './transaction.service';
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { revalidateTag } from 'next/cache';
import { isValidEmail } from '@/lib/utils/validation-utils';
import type { Database } from '@/lib/types/database.types';

type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * User Service
 * Handles all user-related business logic following Single Responsibility Principle
 */
export class UserService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static readonly getByClerkIdDb = cache(async (clerkId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    // Normalize user_preferences join result (Supabase returns array for single join)
    const row = data as User & { user_preferences?: unknown };
    const user = {
      ...row,
      user_preferences: Array.isArray(row.user_preferences) ? row.user_preferences[0] : row.user_preferences
    };

    return user as User;
  });

  private static readonly getByIdDb = cache(async (id: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    // Normalize user_preferences join result
    const row = data as User & { user_preferences?: unknown };
    const user = {
      ...row,
      user_preferences: Array.isArray(row.user_preferences) ? row.user_preferences[0] : row.user_preferences
    };

    return user as User;
  });

  private static readonly getByEmailDb = cache(async (email: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as User;
  });

  private static readonly getByGroupDb = cache(async (groupId: string): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []) as User[];
  });


  private static async deleteDb(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  static async create(data: UserInsert): Promise<User> {
    const { data: created, error } = await supabase
      .from('users')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as User;
  }

  static async update(id: string, data: UserUpdate): Promise<User> {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as User;
  }

  static async fetchUserGroupId(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('users')
      .select('group_id')
      .eq('id', userId)
      .single();

    if (error) throw new Error(error.message);
    const user = data as { group_id: string | null };
    if (!user?.group_id) throw new Error('User or Group not found');
    return user.group_id;
  }

  // ================== SERVICE LAYER ==================

  /**
   * Retrieves user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    return this.getByEmailDb(email);
  }

  /**
   * Retrieves users by group
   */
  static async getUsersByGroup(groupId: string): Promise<User[]> {
    return this.getByGroupDb(groupId);
  }

  /**
   * Retrieves logged-in user information by Clerk ID
   */
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
        const user = await this.getByClerkIdDb(clerkId);
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
        const user = await this.getByIdDb(userId);
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

      const user = await this.getByClerkIdDb(clerkId);
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

    return this.fetchUserGroupId(userId);
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
      const exists = await AccountService.accountExists(accountId);
      if (!exists) {
        throw new Error('Account not found');
      }
    }

    // Update user with relation connect/disconnect logic replaced by scalar update
    const updateData = {
      updated_at: new Date().toISOString(),
      default_account_id: accountId
    };

    const updatedUser = await this.update(userId, updateData);

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
    const user = await this.getByIdDb(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Perform deletion sequentially (Prisma transaction removed)
    // Delete budgets
    await BudgetService.deleteByUser(userId);

    // Delete transactions
    await TransactionService.deleteByUser(userId);

    // Handle Accounts (remove user from shared accounts or delete if sole owner)
    // We need to fetch accounts where user is part of user_ids
    const accounts = await AccountService.getAccountsByUser(userId);

    if (accounts) {
      for (const account of accounts) {
        if (account.user_ids.length === 1 && account.user_ids[0] === userId) {
          // Only this user, delete account
          await AccountService.deleteAccount(account.id);
        } else {
          // Remove user from list
          const newUserIds = account.user_ids.filter((id: string) => id !== userId);
          await AccountService.updateAccount(account.id, {
            user_ids: newUserIds
          });
        }
      }
    }

    // Delete the user
    await this.deleteDb(userId);

    return true;
  }

  private static validateUpdateProfile(userId: string, updates: { name?: string; email?: string }) {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field (name or email) must be provided');
    }

    if (updates.name !== undefined) {
      if (updates.name.trim() === '') {
        throw new Error('Name cannot be empty');
      }
      if (updates.name.length > 100) {
        throw new Error('Name must be 100 characters or less');
      }
    }
  }

  /**
   * Updates user profile information (name and email)
   * Validates input and updates cache
   */
  static async updateProfile(
    userId: string,
    updates: { name?: string; email?: string }
  ): Promise<User> {
    this.validateUpdateProfile(userId, updates);


    // Validate email if provided
    if (updates.email !== undefined) {
      if (!isValidEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      // Check format
      const emailLower = updates.email.toLowerCase();

      // Check if email is already in use by another user
      const existingUser = await this.getByEmailDb(emailLower);

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email is already in use');
      }
    }

    // Update user
    const updateData: UserUpdate = {
      updated_at: new Date().toISOString()
    };

    if (updates.name) updateData.name = updates.name.trim();
    if (updates.email) updateData.email = updates.email.toLowerCase();

    const updatedUser = await this.update(userId, updateData);

    if (!updatedUser) {
      throw new Error('Failed to update user profile');
    }

    // Invalidate user cache
    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');

    return updatedUser as unknown as User;
  }
}
