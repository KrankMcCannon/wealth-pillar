import {
  CACHE_TAGS,
  budgetPeriodCacheKeys,
  cached,
  cacheOptions,
} from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { BudgetPeriod, Budget, Transaction } from '@/lib/types';
import type { BudgetPeriodJSON } from '@/lib/database/types';
import { DateTime, toDateTime, todayDateString } from '@/lib/utils/date-utils';
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
 * Budget periods are stored in users.budget_periods (JSONB array)
 * Each period tracks spending over a defined time range (start_date to end_date)
 * Only one period can be active per user at a time
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class BudgetPeriodService {
  /**
   * Convert BudgetPeriodJSON to BudgetPeriod
   * @private
   */
  private static jsonToBudgetPeriod(
    json: BudgetPeriodJSON,
    userId: string
  ): BudgetPeriod {
    return {
      id: json.id,
      user_id: userId,
      start_date: json.start_date,
      end_date: json.end_date,
      is_active: json.is_active,
      created_at: json.created_at,
      updated_at: json.updated_at,
    };
  }

  /**
   * Get budget period by ID
   * Searches across all users to find the period
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
          // Query users table with JSONB contains operator
          const { data, error } = await supabaseServer
            .from('users')
            .select('id, budget_periods')
            .contains('budget_periods', [{ id: periodId }] as unknown as Record<string, unknown>)
            .maybeSingle();

          if (error) throw new Error(error.message);

          const user = data as { id: string; budget_periods: BudgetPeriodJSON[] } | null;
          if (!user?.budget_periods) return null;

          // Find period in array
          const periods = user.budget_periods;
          const period = periods.find((p) => p.id === periodId);

          return period ? this.jsonToBudgetPeriod(period, user.id) : null;
        },
        budgetPeriodCacheKeys.byId(periodId),
        cacheOptions.budgetPeriod(periodId)
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
            .from('users')
            .select('budget_periods')
            .eq('id', userId)
            .single();

          if (error) throw new Error(error.message);

          const user = data as { budget_periods: BudgetPeriodJSON[] } | null;
          const periods = (user?.budget_periods || [])
            .map((p) => this.jsonToBudgetPeriod(p, userId))
            .sort(
              (a, b) =>
                new Date(b.start_date).getTime() -
                new Date(a.start_date).getTime()
            );

          return periods;
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
   * Only one period can be active per user
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
          const { data, error } = await supabaseServer
            .from('users')
            .select('budget_periods')
            .eq('id', userId)
            .single();

          if (error) throw new Error(error.message);

          const user = data as { budget_periods: BudgetPeriodJSON[] } | null;
          const periods = user?.budget_periods || [];
          const activePeriod = periods.find((p) => p.is_active);

          return activePeriod ? this.jsonToBudgetPeriod(activePeriod, userId) : null;
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

      // Fetch current periods
      const { data, error: fetchError } = await supabaseServer
        .from('users')
        .select('budget_periods')
        .eq('id', userId)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      const user = data as { budget_periods: BudgetPeriodJSON[] } | null;
      let periods = user?.budget_periods || [];

      // Deactivate all existing periods
      periods = periods.map((p) => ({ ...p, is_active: false }));

      // Create new period
      const newPeriod: BudgetPeriodJSON = {
        id: crypto.randomUUID(),
        start_date: startDt.toISODate() as string,
        end_date: null,
        is_active: true,
        created_at: todayDateString(),
        updated_at: todayDateString(),
      };

      periods.unshift(newPeriod); // Add to start (newest first)

      // Update user
      const { error } = await supabaseServer
        .from('users')
        .update({ budget_periods: periods as unknown as Record<string, unknown>[] })
        .eq('id', userId)
        .select('budget_periods')
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        `user:${userId}:budget_periods`,
        `user:${userId}:budget_period:active`,
      ]);

      return { data: this.jsonToBudgetPeriod(newPeriod, userId), error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }

  /**
   * Close a budget period (set end_date, deactivate)
   * Automatically creates the next period starting the day after
   *
   * @param periodId - Budget period ID to close
   * @param endDate - Period end date (YYYY-MM-DD or Date object)
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
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      // Validate end date
      const endDt = toDateTime(endDate);
      if (!endDt) {
        return { data: null, error: 'Invalid end date format' };
      }

      // Find user with this period
      const { data, error: fetchError } = await supabaseServer
        .from('users')
        .select('id, budget_periods')
        .contains('budget_periods', [{ id: periodId }] as unknown as Record<string, unknown>);

      if (fetchError) throw new Error(fetchError.message);

      const users = data as Array<{ id: string; budget_periods: BudgetPeriodJSON[] }> | null;
      if (!users || users.length === 0) {
        return { data: null, error: 'Period not found' };
      }

      const user = users[0];
      const periods = user.budget_periods;

      // Find the period to close
      const periodToClose = periods.find((p) => p.id === periodId);
      if (!periodToClose) {
        return { data: null, error: 'Period not found in user data' };
      }

      // Validate end date >= start date
      const startDt = toDateTime(periodToClose.start_date);
      if (!startDt || endDt < startDt) {
        return {
          data: null,
          error: 'End date must be on or after start date',
        };
      }

      // Update period in array
      const updatedPeriods = periods.map((p) =>
        p.id === periodId
          ? {
            ...p,
            end_date: endDt.toISODate() as string,
            is_active: false,
            updated_at: todayDateString(),
          }
          : p
      );

      // Update user
      const { error } = await supabaseServer
        .from('users')
        .update({ budget_periods: updatedPeriods as unknown as Record<string, unknown>[] })
        .eq('id', user.id)
        .select('budget_periods')
        .single();

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        CACHE_TAGS.BUDGET_PERIOD(periodId),
        `user:${user.id}:budget_periods`,
        `user:${user.id}:budget_period:active`,
      ]);

      // Automatically create next budget period starting the day after this one ends
      const nextStartDt = endDt.plus({ days: 1 });
      const nextStartDateStr = nextStartDt.toISODate();

      if (nextStartDateStr) {
        try {
          await this.createPeriod(user.id, nextStartDateStr);
        } catch (createError) {
          console.error(
            '[BudgetPeriodService] Failed to auto-create next period:',
            createError
          );
        }
      }

      const closedPeriod = updatedPeriods.find((p) => p.id === periodId);
      return {
        data: closedPeriod
          ? this.jsonToBudgetPeriod(closedPeriod, user.id)
          : null,
        error: null,
      };
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
    let total_budget = 0;
    const category_spending: Record<string, number> = {};

    // Filter valid budgets (amount > 0) for the target user
    const validBudgets = (budgets || []).filter(
      (b) => b.user_id === period.user_id && b.amount > 0
    );

    // Calculate totals by processing each budget individually (matches modal logic)
    validBudgets.forEach((budget) => {
      total_budget += budget.amount;

      // Filter transactions for this specific budget's categories
      const budgetTransactions = periodTransactions.filter((t) =>
        budget.categories.includes(t.category)
      );

      // Calculate spent for this budget (income refills, expense/transfer consume)
      const budgetSpent = budgetTransactions.reduce((sum, t) => {
        if (t.type === 'income') {
          return sum - t.amount;
        }
        return sum + t.amount;
      }, 0);

      // Add to total spent (ensuring non-negative per budget)
      total_spent += Math.max(0, budgetSpent);

      // Track category spending (only for expenses and transfers)
      budgetTransactions.forEach((t) => {
        if (t.type === 'expense' || t.type === 'transfer') {
          category_spending[t.category] =
            (category_spending[t.category] || 0) + t.amount;
        }
      });
    });

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
      // Find user with this period
      const { data, error: fetchError } = await supabaseServer
        .from('users')
        .select('id, budget_periods')
        .contains('budget_periods', [{ id: periodId }] as unknown as Record<string, unknown>);

      if (fetchError) throw new Error(fetchError.message);

      const users = data as Array<{ id: string; budget_periods: BudgetPeriodJSON[] }> | null;
      if (!users || users.length === 0) {
        return { data: null, error: 'Period not found' };
      }

      const user = users[0];
      const periods = user.budget_periods.filter((p) => p.id !== periodId);

      const { error } = await supabaseServer
        .from('users')
        .update({ budget_periods: periods as unknown as Record<string, unknown>[] })
        .eq('id', user.id);

      if (error) throw new Error(error.message);

      // Invalidate caches
      await revalidateCacheTags([
        CACHE_TAGS.BUDGET_PERIODS,
        CACHE_TAGS.BUDGET_PERIOD(periodId),
        `user:${user.id}:budget_periods`,
        `user:${user.id}:budget_period:active`,
      ]);

      return { data: { id: periodId }, error: null };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { data: null, error: errorMessage };
    }
  }
}
