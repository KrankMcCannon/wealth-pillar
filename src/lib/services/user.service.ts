import { CACHE_TAGS, cached, cacheOptions, userCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import type { BudgetPeriod, Transaction } from '@/lib/types';
import { diffInDays, nowISO, toDateTime } from '@/lib/utils/date-utils';

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
 * User type from database
 */
type User = Database['public']['Tables']['users']['Row'];

/**
 * Service result type for better error handling
 */
export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * User Service
 * Handles all user-related business logic following Single Responsibility Principle
 *
 * All methods return ServiceResult for consistent error handling
 * All database queries are cached using Next.js unstable_cache
 */
export class UserService {
  /**
   * Retrieves logged-in user information by Clerk ID
   * Used for authentication flows where we have the Clerk user ID
   *
   * @param clerkId - Clerk authentication ID
   * @returns User data or error
   *
   * @example
   * const { data: user, error } = await UserService.getLoggedUserInfo(clerkId);
   * if (error) {
   *   console.error('Failed to get user:', error);
   * }
   */
  static async getLoggedUserInfo(
    clerkId: string
  ): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!clerkId || clerkId.trim() === '') {
        return {
          data: null,
          error: 'Clerk ID is required',
        };
      }

      // Create cached query function
      const getCachedUser = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('clerk_id', clerkId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        userCacheKeys.byClerkId(clerkId),
        cacheOptions.userByClerk(clerkId)
      );

      const user = await getCachedUser();

      if (!user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      return {
        data: user,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user information',
      };
    }
  }

  /**
   * Retrieves user by database ID
   * Used when we have the internal user ID
   *
   * @param userId - Internal user ID from database
   * @returns User data or error
   *
   * @example
   * const { data: user, error } = await UserService.getUserById(userId);
   */
  static async getUserById(userId: string): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Create cached query function
      const getCachedUser = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        userCacheKeys.byId(userId),
        cacheOptions.user(userId)
      );

      const user = await getCachedUser();

      if (!user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      return {
        data: user,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve user information',
      };
    }
  }

  /**
   * Checks if a user exists by Clerk ID
   * Lightweight check without fetching full user data
   *
   * @param clerkId - Clerk authentication ID
   * @returns Boolean indicating if user exists
   *
   * @example
   * const exists = await UserService.userExistsByClerkId(clerkId);
   */
  static async userExistsByClerkId(clerkId: string): Promise<boolean> {
    try {
      if (!clerkId || clerkId.trim() === '') {
        return false;
      }

      const { data, error } = await supabaseServer
        .from('users')
        .select('id')
        .eq('clerk_id', clerkId)
        .single();

      return !error && data !== null;
    } catch {
      return false;
    }
  }

  /**
   * Gets user's group ID
   * Helper method to quickly get the group a user belongs to
   *
   * @param userId - User ID
   * @returns Group ID or null
   *
   * @example
   * const groupId = await UserService.getUserGroupId(userId);
   */
  static async getUserGroupId(
    userId: string
  ): Promise<ServiceResult<string>> {
    try {
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      const { data: user, error } = await this.getUserById(userId);

      if (error || !user) {
        return {
          data: null,
          error: error || 'User not found',
        };
      }

      return {
        data: user.group_id,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve group ID',
      };
    }
  }

  /**
   * Get user name from user ID (client-side helper)
   * Pure function for getting user name from a list of users
   * Does not require database access - used in components with user data already loaded
   *
   * @param userId - User ID to look up
   * @param users - Array of users to search through
   * @returns User name or 'Sconosciuto' if not found
   *
   * @example
   * const userName = UserService.getUserName(userId, groupUsers);
   */
  static getUserName(
    userId: string | null,
    users: Array<{ id: string; name: string }>
  ): string {
    if (!userId) return 'Sconosciuto';
    const user = users.find((u) => u.id === userId);
    return user?.name || 'Sconosciuto';
  }

  /**
   * Start a new budget period for a user
   * Creates a new active period and deactivates any existing active periods
   *
   * @deprecated Use BudgetPeriodService.createPeriod() instead
   * This method updates the old users.budget_periods JSONB field
   * and will be removed after migration to budget_periods table
   *
   * @param userId - User ID
   * @param startDate - Period start date (ISO string or Date)
   * @returns Updated user with new period or error
   *
   * @example
   * // OLD (deprecated):
   * const { data: user, error } = await UserService.startBudgetPeriod(userId, new Date().toISOString());
   *
   * // NEW (recommended):
   * const { data: period, error } = await BudgetPeriodService.createPeriod(userId, '2024-12-29');
   */
  static async startBudgetPeriod(
    userId: string,
    startDate: string | Date
  ): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      if (!startDate) {
        return { data: null, error: 'Start date is required' };
      }

      // Get current user to access existing periods
      const { data: user, error: fetchError } = await this.getUserById(userId);

      if (fetchError || !user) {
        return { data: null, error: fetchError || 'User not found' };
      }

      // Convert startDate to YYYY-MM-DD format
      const startDt = toDateTime(startDate);
      if (!startDt) {
        return { data: null, error: 'Invalid start date' };
      }
      const startDateFormatted = startDt.toISODate(); // YYYY-MM-DD
      if (!startDateFormatted) {
        return { data: null, error: 'Invalid start date format' };
      }

      // Get existing periods (or initialize empty array)
      const existingPeriods = (user.budget_periods) || [];

      // Deactivate all existing active periods
      const updatedPeriods = existingPeriods.map((period) => ({
        ...period,
        is_active: false,
      }));

      // Create new period
      const newPeriod: BudgetPeriod = {
        id: crypto.randomUUID(),
        user_id: userId,
        start_date: startDateFormatted,
        end_date: null, // Open-ended period
        total_spent: 0,
        total_saved: 0,
        category_spending: {},
        is_active: true,
        created_at: nowISO(),
        updated_at: nowISO(),
      };

      // Add new period to array
      updatedPeriods.push(newPeriod);

      // Update user with new periods array
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          budget_periods: updatedPeriods,
          updated_at: nowISO(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedUser) {
        return { data: null, error: 'Failed to start budget period' };
      }

      // Invalidate user cache
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
      ]);

      return { data: updatedUser, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to start budget period',
      };
    }
  }

  /**
   * Close the active budget period for a user
   * Sets end_date, calculates totals from transactions, and marks as inactive
   *
   * @deprecated Use BudgetPeriodService.closePeriod() instead
   * This method updates the old users.budget_periods JSONB field
   * and will be removed after migration to budget_periods table
   *
   * @param userId - User ID
   * @param endDate - Period end date (ISO string or Date)
   * @param transactions - Array of transactions for calculating totals
   * @param userBudgets - Array of user's budgets for calculating savings (optional)
   * @returns Updated user with closed period or error
   *
   * @example
   * const { data: user, error } = await UserService.closeBudgetPeriod(
   *   userId,
   *   new Date().toISOString(),
   *   allTransactions,
   *   userBudgets
   * );
   */
  static async closeBudgetPeriod(
    userId: string,
    endDate: string | Date,
    transactions: Transaction[],
    userBudgets?: Array<{ amount: number; type: string }>
  ): Promise<ServiceResult<User>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      if (!endDate) {
        return { data: null, error: 'End date is required' };
      }

      // Get current user to access existing periods
      const { data: user, error: fetchError } = await this.getUserById(userId);

      if (fetchError || !user) {
        return { data: null, error: fetchError || 'User not found' };
      }

      // Get existing periods
      const existingPeriods = (user.budget_periods) || [];

      // Find active period
      const activePeriodIndex = existingPeriods.findIndex((p) => p.is_active);

      if (activePeriodIndex === -1) {
        return { data: null, error: 'No active budget period found' };
      }

      const activePeriod = existingPeriods[activePeriodIndex];

      // Convert endDate to YYYY-MM-DD format
      const endDt = toDateTime(endDate);
      if (!endDt) {
        return { data: null, error: 'Invalid end date' };
      }
      const endDateFormatted = endDt.toISODate(); // YYYY-MM-DD
      if (!endDateFormatted) {
        return { data: null, error: 'Invalid end date format' };
      }

      // Filter transactions for this period and user
      // Include full end date (until 23:59:59.999)
      const periodStart = toDateTime(activePeriod.start_date);
      const periodEnd = toDateTime(endDateFormatted)?.endOf('day'); // Include entire end day
      const userTransactions = transactions.filter((t) => {
        if (t.user_id !== userId) return false;
        const txDate = toDateTime(t.date);
        if (!txDate || !periodStart || !periodEnd) return false;
        return txDate >= periodStart && txDate <= periodEnd;
      });

      // Calculate totals
      let totalSpent = 0;
      const categorySpending: Record<string, number> = {};

      // userTransactions.forEach((t) => {
      for (const t of userTransactions) {
        if (t.type === 'expense' || t.type === 'transfer') {
          totalSpent += t.amount;
          categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
        } else if (t.type === 'income') {
          totalSpent -= t.amount; // Income refills budget
        }
      }

      // Ensure spent doesn't go negative
      totalSpent = Math.max(0, totalSpent);

      // Calculate total budget amount (monthly budgets for the period)
      let totalBudget = 0;
      if (userBudgets && userBudgets.length > 0) {
        // Calculate budget for period based on type
        const budgetPeriodStart = toDateTime(activePeriod.start_date);
        const budgetPeriodEnd = toDateTime(endDateFormatted)?.endOf('day'); // Include entire end day
        const periodDays = budgetPeriodStart && budgetPeriodEnd
          ? diffInDays(budgetPeriodStart, budgetPeriodEnd)
          : 0;

        for (const budget of userBudgets) {
          if (budget.type === 'monthly') {
            // Pro-rate monthly budget based on period length
            const monthlyFraction = periodDays / 30; // Approximate month as 30 days
            totalBudget += budget.amount * monthlyFraction;
          } else if (budget.type === 'annually') {
            // Pro-rate annual budget based on period length
            const annualFraction = periodDays / 365;
            totalBudget += budget.amount * annualFraction;
          }
        }
      }

      // Calculate savings: budget - spent
      const totalSaved = Math.max(0, totalBudget - totalSpent);

      // Update the active period
      const updatedPeriods = [...existingPeriods];
      updatedPeriods[activePeriodIndex] = {
        ...activePeriod,
        end_date: endDateFormatted,
        total_spent: totalSpent,
        total_saved: totalSaved,
        category_spending: categorySpending,
        is_active: false,
        updated_at: nowISO(),
      };

      // Update user with updated periods array
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          budget_periods: updatedPeriods,
          updated_at: nowISO(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedUser) {
        return { data: null, error: 'Failed to close budget period' };
      }

      // Invalidate user cache
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
      ]);

      return { data: updatedUser, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to close budget period',
      };
    }
  }

  /**
   * Set default account for a user
   * Updates the user's default_account_id field
   *
   * @param userId - User ID
   * @param accountId - Account ID to set as default (or null to clear)
   * @returns Updated user or error
   *
   * @example
   * const { data: user, error } = await UserService.setDefaultAccount(userId, accountId);
   */
  static async setDefaultAccount(
    userId: string,
    accountId: string | null
  ): Promise<ServiceResult<User>> {
    try {
      if (!userId || userId.trim() === '') {
        return { data: null, error: 'User ID is required' };
      }

      // Validate account exists if provided
      if (accountId) {
        const { AccountService } = await import('./account.service');
        const accountExists = await AccountService.accountExists(accountId);
        if (!accountExists) {
          return { data: null, error: 'Account not found' };
        }
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabaseServer
        .from('users')
        .update({
          default_account_id: accountId,
          updated_at: nowISO(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      if (!updatedUser) {
        return { data: null, error: 'Failed to set default account' };
      }

      // Invalidate user cache
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
      ]);

      return { data: updatedUser, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to set default account',
      };
    }
  }

  /**
   * Deletes a user and all related data (accounts, transactions, budgets)
   * This is a destructive operation that cannot be undone
   *
   * @param userId - ID of the user to delete
   * @returns Success status or error
   *
   * @example
   * const { data: success, error } = await UserService.deleteUser(userId);
   * if (error) {
   *   console.error('Failed to delete user:', error);
   * }
   */
  static async deleteUser(userId: string): Promise<ServiceResult<boolean>> {
    try {
      // Input validation
      if (!userId || userId.trim() === '') {
        return {
          data: null,
          error: 'User ID is required',
        };
      }

      // Get user to verify existence and get clerk_id
      const { data: user, error: userError } = await supabaseServer
        .from('users')
        .select('id, clerk_id')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return {
          data: null,
          error: 'User not found',
        };
      }

      // Delete all related data in correct order
      // The database should handle cascading deletes, but we'll be explicit

      // Delete budgets first (has foreign key to user)
      await supabaseServer
        .from('budgets')
        .delete()
        .eq('user_id', userId);

      // Delete transactions (has foreign key to accounts)
      // Get all account IDs for this user and delete their transactions
      const { data: userAccounts } = await supabaseServer
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

      if (userAccounts && userAccounts.length > 0) {
        const accountIds = userAccounts.map((acc: { id: string }) => acc.id);
        await supabaseServer
          .from('transactions')
          .delete()
          .in('account_id', accountIds);
      }

      // Delete accounts (has foreign key to user)
      await supabaseServer
        .from('accounts')
        .delete()
        .eq('user_id', userId);

      // Delete the user
      const { error: deleteUserError } = await supabaseServer
        .from('users')
        .delete()
        .eq('id', userId);

      if (deleteUserError) {
        return {
          data: null,
          error: 'Failed to delete user',
        };
      }

      // Invalidate all related caches
      await revalidateCacheTags([
        CACHE_TAGS.USERS,
        CACHE_TAGS.USER(userId),
        CACHE_TAGS.ACCOUNTS,
        CACHE_TAGS.TRANSACTIONS,
        CACHE_TAGS.BUDGETS,
      ]);

      return { data: true, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete user',
      };
    }
  }
}
