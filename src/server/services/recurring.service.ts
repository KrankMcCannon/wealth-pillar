import 'server-only';
import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';
import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { recurringCacheKeys } from '@/lib/cache/keys';
import { UserService } from './user.service';
import type { RecurringTransactionSeries } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';
import type { Database } from '@/lib/types/database.types';

type RecurringInsert = Database['public']['Tables']['recurring_transactions']['Insert'];
type RecurringUpdate = Database['public']['Tables']['recurring_transactions']['Update'];
type RecurringRow = Database['public']['Tables']['recurring_transactions']['Row'];

/**
 * RecurringService - Manages recurring transaction series
 *
 * Provides methods for:
 * - Fetching recurring series by user or group
 * - Creating, updating, and deleting series
 * - Calculating next execution dates
 * - Managing series activation status
 */
export class RecurringService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static async getByIdDb(id: string): Promise<RecurringRow | null> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, accounts(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    // Normalize accounts join result (Supabase returns array for single join)
    const row = data as RecurringRow & { accounts?: unknown };
    const result = {
      ...row,
      accounts: Array.isArray(row.accounts) ? row.accounts[0] : row.accounts
    };
    return result as RecurringRow;
  }

  private static getByUserDb = cache(async (userId: string): Promise<RecurringRow[]> => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .contains('user_ids', [userId])
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as RecurringRow[];
  });

  private static getByUserIdsDb = cache(async (userIds: string[]): Promise<RecurringRow[]> => {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*')
      .overlaps('user_ids', userIds)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as RecurringRow[];
  });

  private static async createDb(data: RecurringInsert): Promise<RecurringRow> {
    const { data: created, error } = await supabase
      .from('recurring_transactions')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as RecurringRow;
  }

  private static async updateDb(id: string, data: RecurringUpdate): Promise<RecurringRow> {
    const { data: updated, error } = await supabase
      .from('recurring_transactions')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as RecurringRow;
  }

  private static async deleteDb(id: string): Promise<RecurringRow> {
    const { data, error } = await supabase
      .from('recurring_transactions')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as RecurringRow;
  }

  // ================== SERVICE LAYER ==================
  /**
    * Get all recurring series for a specific user
    *
    * @param userId - The user's internal ID
    * @returns Array of recurring series
    *
    * @example
    * const series = await RecurringService.getSeriesByUser(userId);
    */
  static async getSeriesByUser(
    userId: string
  ): Promise<RecurringTransactionSeries[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const getCachedSeries = cached(
      async () => {
        const series = await this.getByUserDb(userId);
        return serialize(series || []) as unknown as RecurringTransactionSeries[];
      },
      recurringCacheKeys.byUser(userId),
      cacheOptions.recurring(userId)
    );

    const series = await getCachedSeries();

    return series;
  }

  /**
   * Get all recurring series for a group
   *
   * @param groupId - The group's ID
   * @returns Array of recurring series
   *
   * @example
   * const series = await RecurringService.getSeriesByGroup(groupId);
   */
  static async getSeriesByGroup(
    groupId: string
  ): Promise<RecurringTransactionSeries[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    const getCachedSeries = cached(
      async () => {
        // First get all users in the group
        const users = await UserService.getUsersByGroup(groupId);

        if (!users || users.length === 0) return [];

        const userIds = users.map((u) => u.id);

        // Then get all recurring series for those users
        // Using overlaps to find series that include any group member
        const series = await this.getByUserIdsDb(userIds);
        return serialize(series || []) as unknown as RecurringTransactionSeries[];
      },
      recurringCacheKeys.byGroup(groupId),
      cacheOptions.recurringGroup(groupId)
    );

    const series = await getCachedSeries();

    return series;
  }

  /**
   * Get a single recurring series by ID
   *
   * @param seriesId - The series ID
   * @returns Single recurring series
   *
   * @example
   * const series = await RecurringService.getSeriesById(seriesId);
   */
  static async getSeriesById(
    seriesId: string
  ): Promise<RecurringTransactionSeries> {
    if (!seriesId || seriesId.trim() === '') {
      throw new Error('Series ID is required');
    }

    const getCachedSeries = cached(
      async () => {
        const series = await this.getByIdDb(seriesId);
        return serialize(series) as unknown as RecurringTransactionSeries | null;
      },
      recurringCacheKeys.byId(seriesId),
      cacheOptions.recurringSingle(seriesId)
    );

    const series = await getCachedSeries();

    if (!series) {
      throw new Error('Recurring series not found');
    }

    return series;
  }

  /**
   * Get only active recurring series for a user
   *
   * @param userId - The user's internal ID
   * @returns Array of active recurring series
   */
  static async getActiveSeriesByUser(
    userId: string
  ): Promise<RecurringTransactionSeries[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    const allSeries = await this.getSeriesByUser(userId);

    return allSeries.filter((s) => s.is_active);
  }

  /**
   * Create a new recurring series
   */
  static async createSeries(data: RecurringInsert): Promise<RecurringTransactionSeries> {
    const series = await this.createDb(data);
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    if (data.user_ids && Array.isArray(data.user_ids)) {
      (data.user_ids as string[]).forEach(uid => {
        revalidateTag(`user:${uid}:recurring`, 'max');
      });
    }
    return serialize(series) as unknown as RecurringTransactionSeries;
  }

  /**
   * Update a recurring series
   */
  static async updateSeries(id: string, data: RecurringUpdate): Promise<RecurringTransactionSeries> {
    const series = await this.updateDb(id, data);
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    revalidateTag(CACHE_TAGS.RECURRING(id), 'max');
    return serialize(series) as unknown as RecurringTransactionSeries;
  }

  /**
   * Delete a recurring series
   */
  static async deleteSeries(id: string): Promise<void> {
    const series = await this.getByIdDb(id);
    await this.deleteDb(id);
    revalidateTag(CACHE_TAGS.RECURRING_SERIES, 'max');
    revalidateTag(CACHE_TAGS.RECURRING(id), 'max');
    if (series && series.user_ids && Array.isArray(series.user_ids)) {
      (series.user_ids as string[]).forEach(uid => {
        revalidateTag(`user:${uid}:recurring`, 'max');
      });
    }
  }
}
