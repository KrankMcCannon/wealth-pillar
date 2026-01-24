import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type GroupInsert = Database['public']['Tables']['groups']['Insert'];
type GroupUpdate = Database['public']['Tables']['groups']['Update'];

/**
 * Group Repository
 * Handles all database operations for groups using Supabase.
 */
export class GroupRepository {
  /**
   * Get group by ID
   */
  static getById = cache(async (id: string) => {
    const { data, error } = await supabase
      .from('groups')
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
   * Create a new group
   */
  static async create(data: GroupInsert) {
    const { data: created, error } = await supabase
      .from('groups')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a group
   */
  static async update(id: string, data: GroupUpdate) {
    const { data: updated, error } = await supabase
      .from('groups')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete a group
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }
}
