import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Category Repository
 * Handles all database operations for categories using Supabase.
 */
export class CategoryRepository {
  /**
   * Get categories by group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Create a new category
   */
  static async create(data: CategoryInsert) {
    const { data: created, error } = await supabase
      .from('categories')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a category
   */
  static async update(id: string, data: CategoryUpdate) {
    const { data: updated, error } = await supabase
      .from('categories')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Get category by ID
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('categories')
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
   * Delete a category
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Get all categories
   */
  static getAll = cache(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('label', { ascending: true });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get category by key
   */
  static getByKey = cache(async (key: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  });
}
