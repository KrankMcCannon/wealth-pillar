import 'server-only';
import { revalidateTag } from 'next/cache';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { userPreferencesCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

export type UserPreferences = Database['public']['Tables']['user_preferences']['Row'];
type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

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
 * All methods throw standard errors instead of returning ServiceResult objects
 */
export class UserPreferencesService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static getByUserIdDb = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as UserPreferences;
  });

  private static async createDb(data: UserPreferencesInsert) {
    const { data: created, error } = await supabase
      .from('user_preferences')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as UserPreferences;
  }

  private static async updateDb(userId: string, data: UserPreferencesUpdate) {
    const { data: updated, error } = await supabase
      .from('user_preferences')
      .update(data as any as never)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as UserPreferences;
  }

  private static async deleteDb(userId: string) {
    const { data: deleted, error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return deleted as UserPreferences;
  }

  // ================== SERVICE LAYER ==================
  /**
    * Gets user preferences by user ID
    * Creates default preferences if none exist (lazy initialization)
    */
  static async getUserPreferences(
    userId: string
  ): Promise<UserPreferences> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    // Create cached query function
    const getCachedPreferences = cached(
      async () => {
        // Try to get existing preferences
        const prefs = await this.getByUserIdDb(userId);

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
      throw new Error('Failed to get or create user preferences');
    }

    return preferences as unknown as UserPreferences;
  }

  /**
   * Creates default preferences for a user
   * Internal method used by getUserPreferences for lazy initialization
   */
  private static async createDefaultPreferences(
    userId: string
  ): Promise<UserPreferences> {
    try {
      const now = new Date().toISOString();
      const initialData = {
        user_id: userId,
        ...DEFAULT_PREFERENCES,
        created_at: now,
        updated_at: now,
      };

      const prefs = await this.createDb(initialData);

      if (!prefs) {
        throw new Error('Failed to create default preferences');
      }

      return prefs as unknown as UserPreferences;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  }

  /**
   * Updates user preferences
   * Only updates provided fields (partial update)
   */
  static async updatePreferences(
    userId: string,
    updates: UserPreferencesUpdate
  ): Promise<UserPreferences> {
    // Input validation
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one field must be provided for update');
    }

    // Validate currency format (ISO 4217)
    if (updates.currency && !/^[A-Z]{3}$/.test(updates.currency)) {
      throw new Error('Currency must be a valid ISO 4217 code (e.g., EUR, USD)');
    }

    // Validate language format (IETF language tag)
    if (updates.language && !/^[a-z]{2}-[A-Z]{2}$/.test(updates.language)) {
      throw new Error('Language must be a valid IETF language tag (e.g., it-IT, en-US)');
    }

    // Ensure preferences exist first (lazy initialization)
    const existingPrefs = await this.getUserPreferences(userId);
    if (!existingPrefs) {
      throw new Error('Failed to get existing preferences');
    }

    // Update preferences
    const updateData: any = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedPrefs = await this.updateDb(userId, updateData);

    if (!updatedPrefs) {
      throw new Error('Failed to update preferences');
    }

    // Invalidate cache
    revalidateTag(CACHE_TAGS.USER_PREFERENCES, 'max');
    revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

    return updatedPrefs as unknown as UserPreferences;
  }

  /**
   * Deletes user preferences
   * Used when deleting a user account
   */
  static async deletePreferences(userId: string): Promise<boolean> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    await this.deleteDb(userId);

    // Invalidate cache
    revalidateTag(CACHE_TAGS.USER_PREFERENCES, 'max');
    revalidateTag(CACHE_TAGS.USER_PREFERENCE(userId), 'max');

    return true;
  }
}
