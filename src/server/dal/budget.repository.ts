import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

/**
 * Budget Repository
 * Handles all database operations for budgets using Supabase.
 */
export class BudgetRepository {
  /**
   * Get budgets by user ID
   * Cached per request using React cache()
   */
  static getByUser = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get budgets by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Create a new budget
   */
  static async create(data: BudgetInsert) {
    const { data: created, error } = await supabase
      .from('budgets')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a budget
   */
  static async update(id: string, data: BudgetUpdate) {
    const { data: updated, error } = await supabase
      .from('budgets')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Get budget by ID
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  }

  /**
   * Delete a budget
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Delete all budgets for a user
   */
  static async deleteByUser(userId: string) {
    const { data, error } = await supabase
      .from('budgets')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data as any;
  }
}
