import { supabaseServer } from '@/lib/database/server';
import { cached, userCacheKeys, cacheOptions } from '@/lib/cache';
import type { Database } from '@/lib/database/types';

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
        data: user,
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
        data: user,
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
}
