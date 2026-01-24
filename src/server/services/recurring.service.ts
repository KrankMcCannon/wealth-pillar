import 'server-only';
/**
 * Recurring Transaction Series Service
 *
 * Business logic for recurring transaction series operations.
 * Follows Single Responsibility Principle - handles only recurring series domain.
 *
 * @example
 * import { RecurringService } from '@/server/services';
 *
 * const series = await RecurringService.getSeriesByUser(userId);
 */

import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { recurringCacheKeys } from '@/lib/cache/keys';
import { RecurringRepository, UserRepository } from '@/server/dal';
import type { RecurringTransactionSeries } from '@/lib/types';
import { serialize } from '@/lib/utils/serializer';

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
        const series = await RecurringRepository.getByUser(userId);
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
        const users = await UserRepository.getByGroup(groupId);

        if (!users || users.length === 0) return [];

        const userIds = users.map((u: any) => u.id);

        // Then get all recurring series for those users
        // Using overlaps to find series that include any group member
        const series = await RecurringRepository.getByUserIds(userIds);
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
        const series = await RecurringRepository.getById(seriesId);
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

    const activeSeries = (allSeries || []).filter((s) => s.is_active);

    return activeSeries;
  }
}
