import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type RecurringInsert = Database['public']['Tables']['recurring_transactions']['Insert'];
type RecurringUpdate = Database['public']['Tables']['recurring_transactions']['Update'];

/**
 * Recurring Transaction Repository
 * Handles all database operations for recurring transactions using Supabase.
 */
export class RecurringRepository {
  /**
   * Get recurring transaction by ID
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, accounts(*)') // Include account details
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    // Transform accounts array to object if necessary (Supabase might return array for 1:1)
    const result = {
      ...(data as any),
      accounts: Array.isArray((data as any).accounts) ? (data as any).accounts[0] : (data as any).accounts
    };
    return result as any;
  }

  /**
   * Get recurring transactions by account ID
   */
  static getByAccount = cache(async (accountId: string) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Create a new recurring transaction
   */
  static async create(data: RecurringInsert) {
    const { data: created, error } = await supabase
      .from('recurring_transactions')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a recurring transaction
   */
  static async update(id: string, data: RecurringUpdate) {
    const { data: updated, error } = await supabase
      .from('recurring_transactions')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete a recurring transaction
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Get recurring transactions by user ID
   */
  static getByUser = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .contains('user_ids', [userId])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get recurring transactions overlapping with user IDs
   */
  static getByUserIds = cache(async (userIds: string[]) => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .overlaps('user_ids', userIds)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });
}
