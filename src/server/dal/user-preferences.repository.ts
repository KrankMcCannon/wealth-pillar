import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type UserPreferencesInsert = Database['public']['Tables']['user_preferences']['Insert'];
type UserPreferencesUpdate = Database['public']['Tables']['user_preferences']['Update'];

/**
 * User Preferences Repository
 * Handles all database operations for user preferences using Supabase.
 */
export class UserPreferencesRepository {
  /**
   * Get user preferences by User ID
   */
  static getByUserId = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Supabase returns error PGRST116 for single() if not found, we treat it as null result like Prisma
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    return data as any;
  });

  /**
   * Create user preferences
   */
  static async create(data: UserPreferencesInsert) {
    const { data: created, error } = await supabase
      .from('user_preferences')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update user preferences
   */
  static async update(userId: string, data: UserPreferencesUpdate) {
    const { data: updated, error } = await supabase
      .from('user_preferences')
      .update(data as any as never)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete user preferences
   */
  static async delete(userId: string) {
    const { data: deleted, error } = await supabase
      .from('user_preferences')
      .delete()
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return deleted as any;
  }
}
