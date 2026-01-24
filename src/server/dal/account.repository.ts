import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

/**
 * Account Repository
 * Handles all database operations for accounts using Supabase.
 */
export class AccountRepository {
  /**
   * Get accounts by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get accounts by user ID (where user_ids contains userId)
   */
  static getByUser = cache(async (userId: string) => {
    // user_ids is a text[] (UUID array)
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .contains('user_ids', [userId])
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get specific account by ID
   */
  static getById = cache(async (id: string) => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  });

  /**
   * Create a new account
   */
  static async create(data: AccountInsert) {
    const { data: created, error } = await supabase
      .from('accounts')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update an account
   */
  static async update(id: string, data: AccountUpdate) {
    const { data: updated, error } = await supabase
      .from('accounts')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete an account
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Update account balance
   * NOTE: This is a read-modify-write operation. In a high-concurrency environment,
   * this should be replaced with a database function (RPC) or atomic update.
   */
  static async updateBalance(id: string, delta: number) {
    // 1. Get current account to read balance
    const { data: account, error: fetchError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', id)
      .single();

    if (fetchError) throw new Error(`Failed to fetch account for balance update: ${fetchError.message}`);

    // 2. Calculate new balance
    const currentBalance = Number((account as any)?.balance) || 0;
    const newBalance = currentBalance + delta;

    // 3. Update account
    const { data: updated, error: updateError } = await (supabase
      .from('accounts') as any)
      .update({ balance: newBalance })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw new Error(`Failed to update balance: ${updateError.message}`);

    return updated as any;
  }
}
