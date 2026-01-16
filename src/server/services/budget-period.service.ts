import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod, Budget, Transaction } from '@/lib/types';
import type { BudgetPeriodJSON } from '@/server/db/types';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { DateTime } from 'luxon';
import type { ServiceResult } from './user.service';
import { UserRepository } from '@/server/dal/user.repository';
import { Prisma } from '@prisma/client';

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
   */
  static async getPeriodById(
    periodId: string
  ): Promise<ServiceResult<BudgetPeriod>> {
    try {
      const getCachedPeriod = cached(
        async () => {
          // Use UserRepository custom finder for periods
          const user = await UserRepository.findUserByPeriodId(periodId);

          if (!user || !user.budget_periods) return null;

          // Find period in array
          const periods = user.budget_periods as unknown as BudgetPeriodJSON[];
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
   */
  static async getPeriodsByUser(
    userId: string
  ): Promise<ServiceResult<BudgetPeriod[]>> {
    try {
      const getCachedPeriods = cached(
        async () => {
          const user = await UserRepository.getById(userId);

          if (!user) {
            throw new Error("User not found");
          }

          const periods = (user.budget_periods as unknown as BudgetPeriodJSON[] || [])
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
   */
  static async getActivePeriod(
    userId: string
  ): Promise<ServiceResult<BudgetPeriod | null>> {
    try {
      const getCachedPeriod = cached(
        async () => {
          const user = await UserRepository.getById(userId);

          if (!user) {
            return null;
          }

          const periods = (user.budget_periods as unknown as BudgetPeriodJSON[] || []);
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

      // Fetch current user and periods
      const user = await UserRepository.getById(userId);
      if (!user) {
        return { data: null, error: 'User not found' };
      }

      let periods = (user.budget_periods as unknown as BudgetPeriodJSON[] || []);

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
      // Cast periods to any for Prisma Json compatibility
      await UserRepository.update(userId, {
        budget_periods: periods as any
      });

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
      const user = await UserRepository.findUserByPeriodId(periodId);
      if (!user) {
        return { data: null, error: 'Period not found' };
      }

      const periods = (user.budget_periods as unknown as BudgetPeriodJSON[] || []);

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
      await UserRepository.update(user.id, {
        budget_periods: updatedPeriods as any
      });

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
   */
  static async deletePeriod(
    periodId: string
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      // Find user with this period
      const user = await UserRepository.findUserByPeriodId(periodId);
      if (!user) {
        return { data: null, error: 'Period not found' };
      }

      const periods = (user.budget_periods as unknown as BudgetPeriodJSON[] || []);
      const newPeriods = periods.filter((p) => p.id !== periodId);

      // Update user
      await UserRepository.update(user.id, {
        budget_periods: newPeriods as unknown as Prisma.InputJsonValue
      });

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
