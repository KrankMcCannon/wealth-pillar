import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

/**
 * Transaction Repository
 * Handles all database operations for transactions using Supabase.
 * Implements the Data Access Layer (DAL) pattern.
 */
export class TransactionRepository {
  /**
   * Get transactions by user ID with optional filtering
   * Cached per request using React cache()
   */
  static getByUser = cache(async (
    userId: string,
    filters?: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      category?: string;
      type?: 'income' | 'expense' | 'transfer';
      accountId?: string;
    }
  ) => {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString());
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.accountId) {
      query = query.eq('account_id', filters.accountId);
    }

    query = query.order('date', { ascending: false });

    // Pagination
    if (filters?.limit) {
      const from = filters.offset || 0;
      const to = from + filters.limit - 1;
      query = query.range(from, to);
    }

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
      data: data || [],
      total: count || 0
    } as any;
  });

  /**
   * Create a new transaction
   */
  static async create(data: TransactionInsert) {
    const { data: created, error } = await supabase
      .from('transactions')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update a transaction
   */
  static async update(id: string, data: TransactionUpdate) {
    const { data: updated, error } = await supabase
      .from('transactions')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: string) {
    const { data, error } = await supabase
      .from('transactions')
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
   * Delete a transaction
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Delete all transactions for a user
   */
  static async deleteByUser(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Delete all transactions for an account
   */
  static async deleteByAccount(accountId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Get transactions by group ID with pagination
   * @param groupId - Group ID to filter by
   * @param options - Pagination options (limit, offset)
   * @returns Transactions array and total count
   */
  static getByGroup = cache(async (
    groupId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<{ data: any[]; total: number; hasMore: boolean }> => {
    const limit = options?.limit ?? 50; // Default 50 for infinite scroll
    const offset = options?.offset ?? 0;

    const { data, count, error } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const total = count || 0;
    return {
      data: data || [],
      total,
      hasMore: offset + limit < total
    };
  });

  /**
   * Get transactions by account ID (including transfers to account)
   */
  static getByAccount = cache(async (accountId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });
  /**
   * Get category spending breakdown using database aggregation
   * Call RPC function `get_group_category_spending`
   */
  static getGroupCategorySpending = cache(async (
    groupId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const { data, error } = await (supabase as any).rpc('get_group_category_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (error) throw new Error(error.message);
    return data as any as Array<{ category: string; spent: number; transaction_count: number }>;
  });

  /**
   * Get monthly spending trend using database aggregation
   * Call RPC function `get_group_monthly_spending`
   */
  static getGroupMonthlySpending = cache(async (
    groupId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const { data, error } = await (supabase as any).rpc('get_group_monthly_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (error) throw new Error(error.message);
    return data as any as Array<{ month: string; income: number; expense: number }>;
  });
  /**
   * Get category spending breakdown per user using database aggregation
   * Call RPC function `get_group_user_category_spending`
   */
  static getGroupUserCategorySpending = cache(async (
    groupId: string,
    startDate: Date,
    endDate: Date
  ) => {
    const { data, error } = await (supabase as any).rpc('get_group_user_category_spending', {
      p_group_id: groupId,
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    });

    if (error) throw new Error(error.message);
    return data as any as Array<{
      user_id: string;
      category: string;
      spent: number;
      income: number;
      transaction_count: number
    }>;
  });
}
