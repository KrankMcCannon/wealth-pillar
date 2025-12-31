import {
  CACHE_TAGS,
  budgetPeriodCacheKeys,
  cached,
  cacheOptions,
} from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { BudgetPeriod, Budget, Transaction } from '@/lib/types';
import { DateTime, nowISO, toDateTime } from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }
  }
}

/**
 * Budget Period Service
 * Handles all budget period related business logic following Single Responsibility Principle
 *
 * Budget periods track user spending over a defined time range (start_date to end_date)
 * Only one period can be active per user at a time
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class BudgetPeriodService {
  /**
   * Get budget period by ID
   * Cached for 5 minutes
   *
   * @param periodId - Budget period ID
   * @returns Budget period or error
   *
   * @example
   * const { data: period, error } = await BudgetPeriodService.getPeriodById('period-123');
   */
  static async getPeriodById(
    periodId: string
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      const getCachedPeriod = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('budget_periods')
            .select('*')
            .eq('id', periodId)
            .single();

          if (error) throw new Error(error.message);
          return data;
        },
        budgetPeriodCacheKeys.byId(periodId),
        cacheOptions.budgetPeriod(periodId)
      );

      const period = await getCachedPeriod();
      return { data: period as BudgetPeriod, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Get all budget periods for a user
   * Returns periods ordered by start_date descending (newest first)
   * Cached for 5 minutes
   *
   * @param userId - User ID
   * @returns Array of budget periods or error
   *
   * @example
   * const { data: periods, error } = await BudgetPeriodService.getPeriodsByUser('user-123');
   */
  static async getPeriodsByUser(
    userId: string
  ): Promise<ServiceResult<BudgetPeriod[]>> {
    try {
      const getCachedPeriods = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('budget_periods')
            .select('*')
            .eq('user_id', userId)
            .order('start_date', { ascending: false });

          if (error) throw new Error(error.message);
          return data;
        },
        budgetPeriodCacheKeys.byUser(userId),
        cacheOptions.budgetPeriodsByUser(userId)
      );

      const periods = await getCachedPeriods();
      return { data: (periods || []) as BudgetPeriod[], error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Get active budget period for a user
   * Only one period can be active per user (enforced by DB constraint)
   * Cached for 5 minutes
   *
   * @param userId - User ID
   * @returns Active budget period or null if no active period
   *
   * @example
   * const { data: activePeriod } = await BudgetPeriodService.getActivePeriod('user-123');
   * if (activePeriod) {
   *   console.log('Period starts:', activePeriod.start_date);
   * }
   */
  static async getActivePeriod(
    userId: string
  ): Promise<ServiceResult<BudgetPeriod | null>> {
    try {
      const getCachedPeriod = cached(
        async () => {
          const { data, error} = await supabaseServer
            .from('budget_periods')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .maybeSingle(); // Returns null if not found instead of error

          if (error) throw new Error(error.message);
          return data;
        },
        budgetPeriodCacheKeys.activeByUser(userId),
        cacheOptions.activeBudgetPeriod(userId)
      );

      const period = await getCachedPeriod();
      return { data: period as BudgetPeriod | null, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Create a new budget period (start period)
   * Automatically deactivates any existing active period for the user
   *
   * @param userId - User ID
   * @param startDate - Period start date (YYYY-MM-DD or Date object)
   * @returns Created budget period or error
   *
   * @example
   * const { data: newPeriod, error } = await BudgetPeriodService.createPeriod('user-123', '2024-01-01');
   */
  static async createPeriod(
    userId: string,
    startDate: string | Date
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      // Validation
      if (!userId) {
        return { data: null, error: 'User ID is required' };
      }
      if (!startDate) {
        return { data: null, error: 'Start date is required' };
      }

      const startDt = toDateTime(startDate);
      if (!startDt) {
        return { data: null, error: 'Invalid start date format' };
      }

      // Deactivate existing active period
      await supabaseServer
        .from('budget_periods')
        .update({ is_active: false, updated_at: nowISO() })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create new active period
      const { data: newPeriod, error } = await supabaseServer
        .from('budget_periods')
        .insert({
          user_id: userId,
          start_date: startDt.toISODate() as string,
          is_active: true,
          total_spent: 0,
          total_saved: 0,
          category_spending: {},
        })
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        `user:${userId}:budget_periods`,
        `user:${userId}:budget_period:active`,
      ]);

      return { data: newPeriod as BudgetPeriod, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Close a budget period (set end_date, calculate final totals)
   * Calculates total_spent, total_saved, and category_spending from transactions
   *
   * @param periodId - Budget period ID to close
   * @param endDate - Period end date (YYYY-MM-DD or Date object)
   * @param transactions - All transactions to calculate totals from
   * @param budgets - User budgets for calculating total_saved
   * @returns Closed budget period or error
   *
   * @example
   * const { data: closedPeriod } = await BudgetPeriodService.closePeriod(
   *   'period-123',
   *   '2024-01-31',
   *   transactions,
   *   budgets
   * );
   */
  static async closePeriod(
    periodId: string,
    endDate: string | Date,
    transactions: Transaction[],
    budgets?: Budget[]
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      // Get period
      const { data: period, error: periodError } =
        await this.getPeriodById(periodId);
      if (periodError || !period) {
        return { data: null, error: 'Budget period not found' };
      }

      // Validate end date
      const endDt = toDateTime(endDate);
      if (!endDt) {
        return { data: null, error: 'Invalid end date format' };
      }

      const startDt = toDateTime(period.start_date);
      if (!startDt || endDt < startDt) {
        return {
          data: null,
          error: 'End date must be on or after start date',
        };
      }

      // Calculate totals from transactions
      const totals = this.calculatePeriodTotals(
        transactions,
        period,
        startDt,
        endDt,
        budgets || []
      );

      // Update period
      const { data: closedPeriod, error } = await supabaseServer
        .from('budget_periods')
        .update({
          end_date: endDt.toISODate() as string,
          is_active: false,
          total_spent: totals.total_spent,
          total_saved: totals.total_saved,
          category_spending: totals.category_spending,
          updated_at: nowISO(),
        })
        .eq('id', periodId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        CACHE_TAGS.BUDGET_PERIOD(periodId),
        `user:${period.user_id}:budget_periods`,
        `user:${period.user_id}:budget_period:active`,
      ]);

      return { data: closedPeriod as BudgetPeriod, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Update budget period aggregates (total_spent, category_spending)
   * Used by triggers or manual recalculation
   *
   * @param periodId - Budget period ID
   * @param transactions - Transactions to calculate from
   * @returns Updated period or error
   */
  static async updatePeriodAggregates(
    periodId: string,
    transactions: Transaction[]
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      const { data: period } = await this.getPeriodById(periodId);
      if (!period) {
        return { data: null, error: 'Period not found' };
      }

      const startDt = toDateTime(period.start_date);
      const endDt = period.end_date ? toDateTime(period.end_date) : null;

      if (!startDt) {
        return { data: null, error: 'Invalid period dates' };
      }

      const totals = this.calculatePeriodTotals(
        transactions,
        period,
        startDt,
        endDt,
        []
      );

      const { data: updated, error } = await supabaseServer
        .from('budget_periods')
        .update({
          total_spent: totals.total_spent,
          category_spending: totals.category_spending,
          updated_at: nowISO(),
        })
        .eq('id', periodId)
        .select()
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIOD(periodId),
        `user:${period.user_id}:budget_periods`,
      ]);

      return { data: updated as BudgetPeriod, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Calculate period totals from transactions
   * Pure function - no side effects
   *
   * Formula:
   * - total_spent = expenses + transfers - income (min 0)
   * - total_saved = total_budget - total_spent (min 0)
   * - category_spending = breakdown by category
   *
   * @param transactions - All transactions
   * @param period - Budget period to calculate for
   * @param startDt - Period start DateTime
   * @param endDt - Period end DateTime (null for open period)
   * @param budgets - User budgets for calculating total_saved
   * @returns Calculated totals
   */
  static calculatePeriodTotals(
    transactions: Transaction[],
    period: BudgetPeriod,
    startDt: DateTime,
    endDt: DateTime | null,
    budgets: Budget[]
  ): {
    total_spent: number;
    total_saved: number;
    category_spending: Record<string, number>;
  } {
    // Filter transactions for this period and user
    const periodTransactions = transactions.filter((t) => {
      const txDate = toDateTime(t.date);
      if (!txDate || t.user_id !== period.user_id) return false;

      const afterStart = txDate >= startDt;
      const beforeEnd = endDt ? txDate <= endDt.endOf('day') : true;
      return afterStart && beforeEnd;
    });

    let total_spent = 0;
    const category_spending: Record<string, number> = {};

    // Calculate spending
    for (const t of periodTransactions) {
      if (t.type === 'expense' || t.type === 'transfer') {
        total_spent += t.amount;
        category_spending[t.category] =
          (category_spending[t.category] || 0) + t.amount;
      } else if (t.type === 'income') {
        total_spent -= t.amount; // Income refills budget
      }
    }

    total_spent = Math.max(0, total_spent);

    // Calculate total budget for this period
    const total_budget = budgets
      .filter((b) => b.user_id === period.user_id)
      .reduce((sum, b) => sum + b.amount, 0);

    const total_saved = Math.max(0, total_budget - total_spent);

    return { total_spent, total_saved, category_spending };
  }

  /**
   * Delete a budget period
   * WARNING: This permanently deletes the period and all its data
   *
   * @param periodId - Budget period ID to delete
   * @returns Success confirmation or error
   */
  static async deletePeriod(
    periodId: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      // Get period before delete for cache invalidation
      const { data: period } = await this.getPeriodById(periodId);
      if (!period) {
        return { data: null, error: 'Period not found' };
      }

      const { error } = await supabaseServer
        .from('budget_periods')
        .delete()
        .eq('id', periodId);

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        CACHE_TAGS.BUDGET_PERIOD(periodId),
        `user:${period.user_id}:budget_periods`,
        `user:${period.user_id}:budget_period:active`,
      ]);

      return { data: { id: periodId }, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }
}
