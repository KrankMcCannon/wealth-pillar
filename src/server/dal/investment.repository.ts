import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];
type InvestmentUpdate = Database['public']['Tables']['investments']['Update'];

/**
 * Investment Repository
 * Handles all database operations for investments using Supabase.
 */
export class InvestmentRepository {
  /**
   * Get investments by user ID
   * Cached per request using React cache()
   */
  static getByUser = cache(async (userId: string) => {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Create a new investment
   */
  static async create(data: InvestmentInsert) {
    const { data: created, error } = await supabase
      .from('investments')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update an investment
   */
  static async update(id: string, data: InvestmentUpdate) {
    const { data: updated, error } = await supabase
      .from('investments')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete an investment
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('investments')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Get investment by ID
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  }
}
