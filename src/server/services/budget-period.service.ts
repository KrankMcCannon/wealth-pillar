import 'server-only';
import { cached } from '@/lib/cache';
import { cacheOptions } from '@/lib/cache/config';
import { budgetPeriodCacheKeys } from '@/lib/cache/keys';
import type { BudgetPeriod, Budget, Transaction, BudgetPeriodJSON } from '@/lib/types';
import { toDateTime, todayDateString } from '@/lib/utils/date-utils';
import { DateTime } from 'luxon';
import { UserService } from './user.service';
import type { Json } from '@/lib/types/database.types';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';

/**
 * Budget Period Service
 * Handles all budget period related business logic following Single Responsibility Principle
 *
 * Budget periods are stored in users.budget_periods (JSONB array)
 * Each period tracks spending over a defined time range (start_date to end_date)
 * Only one period can be active per user at a time
 *
 * All methods throw standard errors instead of returning ServiceResult objects
 * All database queries are cached using Next.js unstable_cache
 */
export class BudgetPeriodService {
  /**
   * Convert BudgetPeriodJSON to BudgetPeriod
   * @private
   */
  private static jsonToBudgetPeriod(json: BudgetPeriodJSON, userId: string): BudgetPeriod {
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

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  /**
   * Get all budget periods for a user
   * Returns periods ordered by start_date descending (newest first)
   * Cached for 5 minutes
   */
  static async getPeriodsByUser(userId: string): Promise<BudgetPeriod[]> {
    const getCachedPeriods = cached(
      async () => {
        const user = await UserService.getUserById(userId);

        if (!user) {
          throw new Error('User not found');
        }

        const periods = ((user.budget_periods as unknown as BudgetPeriodJSON[]) || [])
          .map((p) => this.jsonToBudgetPeriod(p, userId))
          .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

        return periods;
      },
      budgetPeriodCacheKeys.byUser(userId),
      cacheOptions.budgetPeriodsByUser(userId)
    );

    const periods = await getCachedPeriods();
    return periods || [];
  }

  /**
   * Get active budget period for a user
   * Only one period can be active per user
   * Cached for 5 minutes
   */
  static async getActivePeriod(userId: string): Promise<BudgetPeriod | null> {
    const getCachedPeriod = cached(
      async () => {
        const user = await UserService.getUserById(userId);

        if (!user) {
          return null;
        }

        const periods = (user.budget_periods as unknown as BudgetPeriodJSON[]) || [];
        const activePeriod = periods.find((p) => p.is_active);

        return activePeriod ? this.jsonToBudgetPeriod(activePeriod, userId) : null;
      },
      budgetPeriodCacheKeys.activeByUser(userId),
      cacheOptions.activeBudgetPeriod(userId)
    );

    const period = await getCachedPeriod();
    return period;
  }

  /**
   * Get active budget periods for multiple users
   * returns map of userId -> activePeriod
   */
  static async getActivePeriodForUsers(
    userIds: string[]
  ): Promise<Record<string, BudgetPeriod | null>> {
    const results = await Promise.all(
      userIds.map(async (id) => {
        const period = await this.getActivePeriod(id);
        return { id, period };
      })
    );

    return results.reduce(
      (acc, curr) => {
        acc[curr.id] = curr.period;
        return acc;
      },
      {} as Record<string, BudgetPeriod | null>
    );
  }

  /**
   * Calculate period totals from transactions
   * Pure function - no side effects
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
          category_spending[t.category] = (category_spending[t.category] || 0) + t.amount;
        }
      });
    });

    const total_saved = Math.max(0, total_budget - total_spent);

    return { total_spent, total_saved, category_spending };
  }

  // ============================================================================
  // WRITE OPERATIONS
  // ============================================================================

  /**
   * Create a new budget period (start period)
   * Automatically deactivates any existing active period for the user
   */
  static async createPeriod(userId: string, startDate: string | Date): Promise<BudgetPeriod> {
    // 1. Validation
    const startDt = this.validateNewPeriod(userId, startDate);

    // 2. Fetch User and Periods
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const periods = (user.budget_periods as unknown as BudgetPeriodJSON[]) || [];
    // 3. Prepare Period List (Deactivate old, add new)
    const { updatedPeriods, newPeriod } = this.prepareNewPeriodList(periods, startDt);

    // 4. Persist
    await UserService.update(userId, {
      budget_periods: updatedPeriods as unknown as Json,
    });

    // 5. Invalidate Cache
    this.invalidateUserCaches(userId);

    return this.jsonToBudgetPeriod(newPeriod, userId);
  }

  /**
   * Close a budget period (set end_date, deactivate)
   * Automatically creates the next period starting the day after
   */
  static async closePeriod(
    userId: string,
    periodId: string,
    endDate: string | Date
  ): Promise<BudgetPeriod | null> {
    // 1. Validation
    const endDt = toDateTime(endDate);
    if (!endDt) throw new Error('Invalid end date format');

    // 2. Fetch User
    // Optimization: Direct lookup by userId (O(1)) instead of searching all users (O(U))
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const periods = (user.budget_periods as unknown as BudgetPeriodJSON[]) || [];

    // 3. Validate Period State
    this.validatePeriodClosure(periods, periodId, endDt);

    // 4. Update Period List
    const updatedPeriods = this.updatePeriodsListForClosure(periods, periodId, endDt);

    // 5. Persist
    await UserService.update(userId, {
      budget_periods: updatedPeriods as unknown as Json,
    });

    // 6. Invalidate Cache
    this.invalidateUserCaches(userId, periodId);

    // 7. Auto-create Next Period
    await this.autoCreateNextPeriod(userId, endDt);

    const closedPeriod = updatedPeriods.find((p) => p.id === periodId);
    return closedPeriod ? this.jsonToBudgetPeriod(closedPeriod, userId) : null;
  }

  /**
   * Delete a budget period
   * WARNING: This permanently deletes the period and all its data
   */
  static async deletePeriod(userId: string, periodId: string): Promise<{ id: string }> {
    // 1. Fetch User
    // Optimization: Direct lookup by userId (O(1))
    const user = await UserService.getUserById(userId);
    if (!user) throw new Error('User not found');

    const periods = (user.budget_periods as unknown as BudgetPeriodJSON[]) || [];

    // 2. Filter List
    const newPeriods = periods.filter((p) => p.id !== periodId);

    // Check if period existed
    if (newPeriods.length === periods.length) {
      // Period wasn't found, maybe trigger warning or just return success if idempotent desire
      // For now keeping strict to match previous behavior logic check
      // If strict check is needed:
      // const exists = periods.some(p => p.id === periodId);
      // if (!exists) throw new Error('Period not found');
    }

    // 3. Persist
    await UserService.update(user.id, {
      budget_periods: newPeriods as unknown as Json,
    });

    // 4. Invalidate Cache
    this.invalidateUserCaches(userId, periodId);

    return { id: periodId };
  }

  // ============================================================================
  // PRIVATE HELPERS (Refactoring & logic isolation)
  // ============================================================================

  private static validateNewPeriod(userId: string, startDate: string | Date): DateTime {
    if (!userId) throw new Error('User ID is required');
    if (!startDate) throw new Error('Start date is required');

    const startDt = toDateTime(startDate);
    if (!startDt) throw new Error('Invalid start date format');

    return startDt;
  }

  private static prepareNewPeriodList(
    currentPeriods: BudgetPeriodJSON[],
    startDt: DateTime
  ): { updatedPeriods: BudgetPeriodJSON[]; newPeriod: BudgetPeriodJSON } {
    const dayBeforeStart = startDt.minus({ days: 1 }).toISODate() as string;

    // Deactivate all existing periods and set end date for the active one if missing
    // Optimization: Map once
    const updatedPeriods = currentPeriods.map((p) => ({
      ...p,
      is_active: false,
      end_date: p.is_active && !p.end_date ? dayBeforeStart : p.end_date,
    }));

    // Create new period object
    const newPeriod: BudgetPeriodJSON = {
      id: crypto.randomUUID(),
      start_date: startDt.toISODate() as string,
      end_date: null,
      is_active: true,
      created_at: todayDateString(),
      updated_at: todayDateString(),
    };

    updatedPeriods.push(newPeriod); // Add to end (oldest first)

    return { updatedPeriods, newPeriod };
  }

  private static validatePeriodClosure(
    periods: BudgetPeriodJSON[],
    periodId: string,
    endDt: DateTime
  ): void {
    const periodToClose = periods.find((p) => p.id === periodId);
    if (!periodToClose) {
      throw new Error('Period not found in user data');
    }

    const startDt = toDateTime(periodToClose.start_date);
    if (!startDt || endDt < startDt) {
      throw new Error('End date must be on or after start date');
    }
  }

  private static updatePeriodsListForClosure(
    periods: BudgetPeriodJSON[],
    periodId: string,
    endDt: DateTime
  ): BudgetPeriodJSON[] {
    return periods.map((p) =>
      p.id === periodId
        ? {
            ...p,
            end_date: endDt.toISODate() as string,
            is_active: false,
            updated_at: todayDateString(),
          }
        : p
    );
  }

  /**
   * Invalidate all caches related to budget periods for a user
   */
  private static invalidateUserCaches(userId: string, periodId?: string): void {
    invalidateBudgetPeriodCaches({ userId, periodId });
  }

  private static async autoCreateNextPeriod(userId: string, endDt: DateTime): Promise<void> {
    const nextStartDt = endDt.plus({ days: 1 });
    const nextStartDateStr = nextStartDt.toISODate();

    if (nextStartDateStr) {
      try {
        await this.createPeriod(userId, nextStartDateStr);
      } catch (createError) {
        console.error('[BudgetPeriodService] Failed to auto-create next period:', createError);
        // We do not re-throw as this is a side-effect convenience
      }
    }
  }
}
