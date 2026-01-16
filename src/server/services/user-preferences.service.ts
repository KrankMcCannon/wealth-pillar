import 'server-only';
import { CACHE_TAGS, cached, cacheOptions, userPreferencesCacheKeys } from '@/lib/cache';
import { UserPreferencesRepository } from '@/server/dal';
import type { ServiceResult } from './user.service';
import type { Prisma } from '@prisma/client';
import { revalidateTag } from 'next/cache';
import type { user_preferences } from '@prisma/client';

/**
 * User Preferences type (alias for Prisma type)
 */
export type UserPreferences = user_preferences;

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
const DEFAULT_PREFERENCES = {
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
 * All methods return ServiceResult for consistent error handling
 */
export class UserPreferencesService {
  /**
    * Gets user preferences by user ID
    * Creates default preferences if none exist (lazy initialization)
    */
  static async getUserPreferences(
    userId: string
  ): Promise<ServiceResult<UserPreferences>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      // Create cached query function
      const getCachedPreferences = cached(
        async () => {
          // Try to get existing preferences
          const prefs = await UserPreferencesRepository.getByUserId(userId);

          // If preferences don't exist, create defaults
          if (!prefs) {
            return await this.createDefaultPreferences(userId);
          }

          return prefs;
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
   */
  private static async createDefaultPreferences(
    userId: string
  ): Promise<UserPreferences | null> {
    try {
      // Use Prisma connect syntax for relations
      const initialData: Prisma.user_preferencesCreateInput = {
        users: { connect: { id: userId } },
        ...DEFAULT_PREFERENCES
      };

      const prefs = await UserPreferencesRepository.create(initialData);

      if (!prefs) {
        console.error('Failed to create default preferences');
        return null;
      }

      return prefs as UserPreferences;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return null;
    }
  }

  /**
   * Updates user preferences
   * Only updates provided fields (partial update)
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
      const updateData: Prisma.user_preferencesUpdateInput = {
        ...updates,
        updated_at: new Date(),
      };

      const updatedPrefs = await UserPreferencesRepository.update(userId, updateData);

      if (!updatedPrefs) {
        return {
          data: null,
          error: 'Failed to update preferences',
        };
      }

      // Invalidate cache
      revalidateTag(CACHE_TAGS.USER_PREFERENCES, 'max');
      revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

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
   */
  static async deletePreferences(
    userId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      await UserPreferencesRepository.delete(userId);

      // Invalidate cache
      revalidateTag(CACHE_TAGS.USER_PREFERENCES, 'max');
      revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

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
