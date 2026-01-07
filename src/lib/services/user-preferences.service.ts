import { CACHE_TAGS, cached, cacheOptions, userPreferencesCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import { nowISO } from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';

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
 * User Preferences type
 */
export interface UserPreferences {
  id: string;
  user_id: string;
  currency: string;
  language: string;
  timezone: string;
  notifications_push: boolean;
  notifications_email: boolean;
  notifications_budget_alerts: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * User Preferences update type (partial updates allowed)
 */
export interface UserPreferencesUpdate {
  currency?: string;
  language?: string;
  timezone?: string;
  notifications_push?: boolean;
  notifications_email?: boolean;
  notifications_budget_alerts?: boolean;
}

/**
 * Default preferences for new users
 */
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  currency: 'EUR',
  language: 'it-IT',
  timezone: 'Europe/Rome',
  notifications_push: true,
  notifications_email: false,
  notifications_budget_alerts: true,
};

/**
 * User Preferences Service
 * Handles all user preferences-related business logic
 *
 * Features:
 * - Lazy initialization (creates defaults if none exist)
 * - Automatic caching with Next.js unstable_cache
 * - Cache invalidation on updates
 * - Input validation
 *
 * All methods return ServiceResult for consistent error handling
 */
export class UserPreferencesService {
  /**
   * Gets user preferences by user ID
   * Creates default preferences if none exist (lazy initialization)
   *
   * @param userId - User ID
   * @returns User preferences or error
   *
   * @example
   * const { data: prefs, error } = await UserPreferencesService.getUserPreferences(userId);
   * if (error) {
   *   console.error('Failed to get preferences:', error);
   * }
   */
  static async getUserPreferences(
    userId: string
  ): Promise<ServiceResult<UserPreferences>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Create cached query function
      const getCachedPreferences = cached(
        async () => {
          // Try to get existing preferences
          const { data, error } = await supabaseServer
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();

          // If preferences don't exist, create defaults
          if (error && error.code === 'PGRST116') {
            // PGRST116 = no rows returned
            return await this.createDefaultPreferences(userId);
          }

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        userPreferencesCacheKeys.byUser(userId),
        cacheOptions.userPreferences(userId)
      );

      const preferences = await getCachedPreferences();

      if (!preferences) {
        return {
          data: null,
          error: 'Failed to get or create user preferences',
        };
      }

      return {
        data: preferences as UserPreferences,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user preferences',
      };
    }
  }

  /**
   * Creates default preferences for a user
   * Internal method used by getUserPreferences for lazy initialization
   *
   * @param userId - User ID
   * @returns Created preferences or null
   */
  private static async createDefaultPreferences(
    userId: string
  ): Promise<UserPreferences | null> {
    try {
      const { data, error } = await supabaseServer
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...DEFAULT_PREFERENCES,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create default preferences:', error);
        return null;
      }

      return data as UserPreferences;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  /**
   * Updates user preferences
   * Only updates provided fields (partial update)
   *
   * @param userId - User ID
   * @param updates - Fields to update
   * @returns Updated preferences or error
   *
   * @example
   * const { data, error } = await UserPreferencesService.updatePreferences(
   *   userId,
   *   { currency: 'USD', notifications_push: false }
   * );
   */
  static async updatePreferences(
    userId: string,
    updates: UserPreferencesUpdate
  ): Promise<ServiceResult<UserPreferences>> {
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
          error: 'At least one field must be provided for update',
        };
      }

      // Validate currency format (ISO 4217)
      if (updates.currency && !/^[A-Z]{3}$/.test(updates.currency)) {
        return {
          data: null,
          error: 'Currency must be a valid ISO 4217 code (e.g., EUR, USD)',
        };
      }

      // Validate language format (IETF language tag)
      if (updates.language && !/^[a-z]{2}-[A-Z]{2}$/.test(updates.language)) {
        return {
          data: null,
          error: 'Language must be a valid IETF language tag (e.g., it-IT, en-US)',
        };
      }

      // Ensure preferences exist first (lazy initialization)
      const { data: existingPrefs, error: getError } = await this.getUserPreferences(userId);
      if (getError || !existingPrefs) {
        return {
          data: null,
          error: getError || 'Failed to get existing preferences',
        };
      }

      // Update preferences
      const { data: updatedPrefs, error: updateError } = await supabaseServer
        .from('user_preferences')
        .update({
          ...updates,
          updated_at: nowISO(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedPrefs) {
        return {
          data: null,
          error: 'Failed to update preferences',
        };
      }

      // Invalidate cache
      await revalidateCacheTags([
        CACHE_TAGS.USER_PREFERENCES,
        CACHE_TAGS.USER_PREFERENCE(userId),
      ]);

      return {
        data: updatedPrefs as UserPreferences,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update preferences',
      };
    }
  }

  /**
   * Deletes user preferences
   * Used when deleting a user account
   *
   * @param userId - User ID
   * @returns Success status or error
   *
   * @example
   * const { data: success, error } = await UserPreferencesService.deletePreferences(userId);
   */
  static async deletePreferences(
    userId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const { error: deleteError } = await supabaseServer
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      // Invalidate cache
      await revalidateCacheTags([
        CACHE_TAGS.USER_PREFERENCES,
        CACHE_TAGS.USER_PREFERENCE(userId),
      ]);

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete preferences',
      };
    }
  }
}
