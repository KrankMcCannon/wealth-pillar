import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

/**
 * User Repository
 * Handles all database operations for users using Supabase.
 */
export class UserRepository {
  /**
   * Get user by Clerk ID
   */
  static getByClerkId = cache(async (clerkId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('clerk_id', clerkId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    // Supabase returns relations as an array or object depending on relation type (one-to-one or one-to-many)
    // user_preferences is one-to-one (unique user_id), so it might return object or array of 1.
    // However, in Supabase client, if 1-1, it usually returns single object if relationship is tailored,
    // but standard generic return might be problematic.
    // We'll treat the response as is and let the mapper handle it or cast it if needed.
    // The type generated for join might need inspection.
    // For now assuming correct join return.

    // Transform single relation array to object if necessary (Supabase sometimes returns array for 1:1 if not explicitly 'user_preferences!inner' etc)
    // Actually standard join: .select('*, user_preferences(*)') -> user_preferences might be UserPreferences | null or UserPreferences[]
    // In our DB schema, user_preferences has user_id unique.

    // Post-processing to match Prisma shape if needed:
    const user = {
      ...(data as any),
      user_preferences: Array.isArray((data as any).user_preferences) ? (data as any).user_preferences[0] : (data as any).user_preferences
    };

    return user as any;
  });

  /**
   * Get user by ID
   */
  static getById = cache(async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*, user_preferences(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }

    const user = {
      ...(data as any),
      user_preferences: Array.isArray((data as any).user_preferences) ? (data as any).user_preferences[0] : (data as any).user_preferences
    };

    return user as any;
  });

  /**
   * Get users by Group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Create a new user
   */
  static async create(data: UserInsert) {
    const { data: created, error } = await supabase
      .from('users')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a user
   */
  static async update(id: string, data: UserUpdate) {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Find user by budget period ID (searching inside JSON array)
   */
  static async findUserByPeriodId(periodId: string) {
    // Uses Supabase JSON filtering
    // Assuming budget_periods is a JSONB array of objects
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .contains('budget_periods', JSON.stringify([{ id: periodId }]))
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as any;
  }

  /**
   * Delete a user
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Get user by email
   */
  static getByEmail = cache(async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  });

  /**
   * Count users in a group
   */
  static async countByGroup(groupId: string) {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (error) throw new Error(error.message);
    return count || 0;
  }

  /**
   * Get users by group and role
   */
  static getByGroupAndRole = cache(async (groupId: string, role: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('group_id', groupId)
      .eq('role', role)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });
}
