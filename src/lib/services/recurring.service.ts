/**
 * Recurring Transaction Series Service
 *
 * Business logic for recurring transaction series operations.
 * Follows Single Responsibility Principle - handles only recurring series domain.
 *
 * @example
 * import { RecurringService } from '@/lib/services';
 *
 * const { data: series, error } = await RecurringService.getSeriesByUser(userId);
 */

import { cached, cacheOptions, recurringCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { RecurringTransactionSeries } from '@/lib/types';
import {
    DateTime,
    diffInDays,
    formatDateShort,
    formatDaysUntil,
    getDaysInMonth,
    today as luxonToday,
    toDateString,
    toDateTime,
} from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';

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
   * @returns Array of recurring series or error
   *
   * @example
   * const { data: series, error } = await RecurringService.getSeriesByUser(userId);
   */
  static async getSeriesByUser(
    userId: string
  ): Promise<ServiceResult<RecurringTransactionSeries[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      const getCachedSeries = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('recurring_transactions')
            .select('*')
            .contains('user_ids', [userId])
            .order('due_day', { ascending: true });

          if (error) throw new Error(error.message);
          return data || [];
        },
        recurringCacheKeys.byUser(userId),
        cacheOptions.recurring(userId)
      );

      const series = await getCachedSeries();

      return { data: series as RecurringTransactionSeries[], error: null };
    } catch (error) {
      console.error('[RecurringService] getSeriesByUser error:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve recurring series',
      };
    }
  }

  /**
   * Get all recurring series for a group
   *
   * @param groupId - The group's ID
   * @returns Array of recurring series or error
   *
   * @example
   * const { data: series, error } = await RecurringService.getSeriesByGroup(groupId);
   */
  static async getSeriesByGroup(
    groupId: string
  ): Promise<ServiceResult<RecurringTransactionSeries[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      const getCachedSeries = cached(
        async () => {
          // First get all users in the group
          const { data: users, error: usersError } = await supabaseServer
            .from('users')
            .select('id')
            .eq('group_id', groupId);

          if (usersError) throw new Error(usersError.message);
          if (!users || users.length === 0) return [];

          const userIds = users.map((u) => u.id);

          // Then get all recurring series for those users
          // Using overlaps to find series that include any group member
          const { data, error } = await supabaseServer
            .from('recurring_transactions')
            .select('*')
            .overlaps('user_ids', userIds)
            .order('due_day', { ascending: true });

          if (error) throw new Error(error.message);
          return data || [];
        },
        recurringCacheKeys.byGroup(groupId),
        cacheOptions.recurringGroup(groupId)
      );

      const series = await getCachedSeries();

      return { data: series as RecurringTransactionSeries[], error: null };
    } catch (error) {
      console.error('[RecurringService] getSeriesByGroup error:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve recurring series for group',
      };
    }
  }

  /**
   * Get a single recurring series by ID
   *
   * @param seriesId - The series ID
   * @returns Single recurring series or error
   *
   * @example
   * const { data: series, error } = await RecurringService.getSeriesById(seriesId);
   */
  static async getSeriesById(
    seriesId: string
  ): Promise<ServiceResult<RecurringTransactionSeries>> {
    try {
      if (!seriesId || seriesId.trim() === '') {
        return { data: null, error: 'Series ID is required' };
      }

      const getCachedSeries = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('recurring_transactions')
            .select('*')
            .eq('id', seriesId)
            .single();

          if (error) throw new Error(error.message);
          return data;
        },
        recurringCacheKeys.byId(seriesId),
        cacheOptions.recurringSingle(seriesId)
      );

      const series = await getCachedSeries();

      if (!series) {
        return { data: null, error: 'Recurring series not found' };
      }

      return { data: series as RecurringTransactionSeries, error: null };
    } catch (error) {
      console.error('[RecurringService] getSeriesById error:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve recurring series',
      };
    }
  }

  /**
   * Get only active recurring series for a user
   *
   * @param userId - The user's internal ID
   * @returns Array of active recurring series or error
   */
  static async getActiveSeriesByUser(
    userId: string
  ): Promise<ServiceResult<RecurringTransactionSeries[]>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      const { data: allSeries, error } = await this.getSeriesByUser(userId);

      if (error) {
        return { data: null, error };
      }

      const activeSeries = (allSeries || []).filter((s) => s.is_active);

      return { data: activeSeries, error: null };
    } catch (error) {
      console.error('[RecurringService] getActiveSeriesByUser error:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve active recurring series',
      };
    }
  }

  /**
   * Calculate the next execution date for a series based on frequency and due_day
   *
   * @param series - The recurring series
   * @returns Next execution date as ISO string
   */
  static calculateNextExecutionDate(
    series: RecurringTransactionSeries
  ): string {
    const today = luxonToday();

    switch (series.frequency) {
      case 'weekly':
        return this.calculateWeeklyNextDate(today, series.due_day);
      case 'biweekly':
        return this.calculateBiweeklyNextDate(today, series.due_day);
      case 'monthly':
        return this.calculateMonthlyNextDate(today, series.due_day);
      case 'yearly':
        return this.calculateYearlyNextDate(today, series);
      default:
        // 'once' - return the start_date or today if passed
        return this.calculateOnceNextDate(today, series);
    }
  }

  /**
   * Calculate next weekly due date
   */
  private static calculateWeeklyNextDate(today: DateTime, dueDay: number): string {
    const currentDayOfWeek = today.weekday; // Luxon: 1=Monday, 7=Sunday
    let daysUntilDue = dueDay - currentDayOfWeek;
    if (daysUntilDue <= 0) daysUntilDue += 7;
    return toDateString(today.plus({ days: daysUntilDue }));
  }

  /**
   * Calculate next biweekly due date
   */
  private static calculateBiweeklyNextDate(today: DateTime, dueDay: number): string {
    const currentDayOfWeek = today.weekday;
    let daysUntilDue = dueDay - currentDayOfWeek;
    if (daysUntilDue <= 0) daysUntilDue += 14;
    return toDateString(today.plus({ days: daysUntilDue }));
  }

  /**
   * Calculate next monthly due date
   */
  private static calculateMonthlyNextDate(today: DateTime, dueDay: number): string {
    const currentDay = today.day;

    if (currentDay < dueDay) {
      // Due date is still this month
      const dayToUse = Math.min(dueDay, getDaysInMonth(today.year, today.month));
      return toDateString(today.set({ day: dayToUse }));
    }
    
    // Due date is next month
    const nextMonth = today.plus({ months: 1 });
    const dayToUse = Math.min(dueDay, getDaysInMonth(nextMonth.year, nextMonth.month));
    return toDateString(nextMonth.set({ day: dayToUse }));
  }

  /**
   * Calculate next yearly due date
   */
  private static calculateYearlyNextDate(today: DateTime, series: RecurringTransactionSeries): string {
    const startDate = toDateTime(series.start_date);
    if (!startDate) {
      return toDateString(today);
    }
    
    const startMonth = startDate.month;
    const dueDay = series.due_day;
    
    // Check if this year's occurrence has passed
    const thisYearBase = today.set({ month: startMonth });
    const dayToUseThisYear = Math.min(dueDay, getDaysInMonth(thisYearBase.year, thisYearBase.month));
    const thisYearDate = thisYearBase.set({ day: dayToUseThisYear });
    
    if (thisYearDate > today) {
      return toDateString(thisYearDate);
    }
    
    const nextYearBase = today.plus({ years: 1 }).set({ month: startMonth });
    const dayToUseNextYear = Math.min(dueDay, getDaysInMonth(nextYearBase.year, nextYearBase.month));
    return toDateString(nextYearBase.set({ day: dayToUseNextYear }));
  }

  /**
   * Calculate next date for one-time series
   */
  private static calculateOnceNextDate(today: DateTime, series: RecurringTransactionSeries): string {
    const startDate = toDateTime(series.start_date);
    if (!startDate) {
      return toDateString(today);
    }
    return startDate > today 
      ? toDateString(startDate) 
      : toDateString(today);
  }

  /**
   * Calculate days until next due date
   *
   * @param series - The recurring series
   * @returns Number of days until next execution (negative if overdue)
   */
  static calculateDaysUntilDue(series: RecurringTransactionSeries): number {
    const nextDate = toDateTime(this.calculateNextExecutionDate(series));
    const today = luxonToday();
    if (!nextDate) return 0;
    return diffInDays(today, nextDate);
  }

  /**
   * Check if a series is due for execution
   *
   * @param series - The recurring series
   * @returns True if series is due today or overdue
   */
  static isSeriesDue(series: RecurringTransactionSeries): boolean {
    if (!series.is_active) return false;

    const today = luxonToday();
    const nextExecution = toDateTime(this.calculateNextExecutionDate(series));
    if (!nextExecution) return false;

    return nextExecution <= today;
  }

  /**
   * Get series that are due for execution
   *
   * @param userId - The user's internal ID
   * @returns Array of due recurring series
   */
  static async getDueSeries(
    userId: string
  ): Promise<ServiceResult<RecurringTransactionSeries[]>> {
    try {
      const { data: activeSeries, error } =
        await this.getActiveSeriesByUser(userId);

      if (error) {
        return { data: null, error };
      }

      const dueSeries = (activeSeries || []).filter((s) => this.isSeriesDue(s));

      return { data: dueSeries, error: null };
    } catch (error) {
      console.error('[RecurringService] getDueSeries error:', error);
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve due series',
      };
    }
  }

  /**
   * Get frequency label in Italian
   *
   * @param frequency - The frequency type
   * @returns Italian label for frequency
   */
  static getFrequencyLabel(
    frequency: RecurringTransactionSeries['frequency']
  ): string {
    const labels: Record<RecurringTransactionSeries['frequency'], string> = {
      once: 'Una tantum',
      weekly: 'Settimanale',
      biweekly: 'Quindicinale',
      monthly: 'Mensile',
      yearly: 'Annuale',
    };
    return labels[frequency] || frequency;
  }

  /**
   * Format due date with relative time
   *
   * @param series - The recurring series
   * @returns Formatted string like "Tra 3 giorni" or "Oggi"
   */
  static formatDueDate(series: RecurringTransactionSeries): string {
    const daysUntil = this.calculateDaysUntilDue(series);
    
    // Use formatDaysUntil for relative time, or formatDateShort for dates > 7 days
    if (daysUntil <= 7) {
      return formatDaysUntil(this.calculateNextExecutionDate(series));
    }
    
    return formatDateShort(this.calculateNextExecutionDate(series));
  }

  /**
   * Group series by user for display
   *
   * @param series - Array of recurring series
   * @param users - Array of users
   * @returns Series grouped by user
   */
  static groupSeriesByUser(
    series: RecurringTransactionSeries[],
    users: Array<{ id: string; name: string }>
  ): Record<string, { user: { id: string; name: string }; series: RecurringTransactionSeries[] }> {
    const grouped: Record<string, { user: { id: string; name: string }; series: RecurringTransactionSeries[] }> = {};

    for (const user of users) {
      const userSeries = series.filter((s) => s.user_ids.includes(user.id));
      if (userSeries.length > 0) {
        grouped[user.id] = {
          user,
          series: userSeries,
        };
      }
    }

    return grouped;
  }

  /**
   * Calculate monthly cost/income for a series
   *
   * @param series - The recurring series
   * @returns Monthly equivalent amount
   */
  static calculateMonthlyAmount(series: RecurringTransactionSeries): number {
    switch (series.frequency) {
      case 'weekly':
        return series.amount * 4.33; // Average weeks per month
      case 'biweekly':
        return series.amount * 2.17;
      case 'monthly':
        return series.amount;
      case 'yearly':
        return series.amount / 12;
      default:
        return series.amount;
    }
  }

  /**
   * Calculate totals for a set of series
   *
   * @param series - Array of recurring series
   * @returns Total income and expenses (monthly equivalent)
   */
  static calculateTotals(series: RecurringTransactionSeries[]): {
    totalIncome: number;
    totalExpenses: number;
    netMonthly: number;
  } {
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const s of series) {
      if (!s.is_active) continue;

      const monthlyAmount = this.calculateMonthlyAmount(s);
      if (s.type === 'income') {
        totalIncome += monthlyAmount;
      } else if (s.type === 'expense') {
        totalExpenses += monthlyAmount;
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netMonthly: totalIncome - totalExpenses,
    };
  }

  /**
   * Check if a user has access to a series
   *
   * @param series - The recurring series
   * @param userId - User ID to check
   * @returns True if user has access
   *
   * @example
   * const hasAccess = RecurringService.hasAccess(series, userId);
   */
  static hasAccess(series: RecurringTransactionSeries, userId: string): boolean {
    return series.user_ids.includes(userId);
  }

  /**
   * Get all users associated with a series
   *
   * @param series - The recurring series
   * @param allUsers - All available users
   * @returns Array of users who have access
   *
   * @example
   * const associatedUsers = RecurringService.getAssociatedUsers(series, groupUsers);
   */
  static getAssociatedUsers(
    series: RecurringTransactionSeries,
    allUsers: Array<{ id: string; name: string; theme_color?: string }>
  ): Array<{ id: string; name: string; theme_color?: string }> {
    return allUsers.filter(user => series.user_ids.includes(user.id));
  }
}
