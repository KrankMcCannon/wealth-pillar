import 'server-only';

/**
 * Shared Cache Invalidation Utilities
 *
 * Centralized cache invalidation helpers to reduce code duplication.
 * Uses Next.js revalidateTag for on-demand cache invalidation.
 */

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';

/**
 * Options for transaction cache invalidation
 */
export interface TransactionCacheInvalidationOptions {
  groupId: string;
  accountId: string;
  userId?: string | null;
  toAccountId?: string | null;
}

/**
 * Options for budget cache invalidation
 */
export interface BudgetCacheInvalidationOptions {
  budgetId?: string;
  userId: string;
  groupId?: string;
}

/**
 * Options for account cache invalidation
 */
export interface AccountCacheInvalidationOptions {
  accountId: string;
  groupId?: string;
  userIds?: string[];
}

/**
 * Options for user cache invalidation
 */
export interface UserCacheInvalidationOptions {
  userId: string;
}

/**
 * Invalidates all transaction-related caches.
 * Used after creating, updating, or deleting transactions.
 */
export function invalidateTransactionCaches(opts: TransactionCacheInvalidationOptions): void {
  const tags: string[] = [
    CACHE_TAGS.TRANSACTIONS,
    CACHE_TAGS.ACCOUNTS,
    `account:${opts.accountId}:transactions`,
    `group:${opts.groupId}:transactions`,
    `group:${opts.groupId}:budgets`,
  ];

  if (opts.userId) {
    tags.push(`user:${opts.userId}:transactions`, `user:${opts.userId}:budgets`);
  }

  if (opts.toAccountId) {
    tags.push(`account:${opts.toAccountId}:transactions`);
  }

  invalidateTags(tags);
}

/**
 * Invalidates all budget-related caches.
 * Used after creating, updating, or deleting budgets.
 */
export function invalidateBudgetCaches(opts: BudgetCacheInvalidationOptions): void {
  const tags: string[] = [CACHE_TAGS.BUDGETS, `user:${opts.userId}:budgets`];

  if (opts.budgetId) {
    tags.push(CACHE_TAGS.BUDGET(opts.budgetId));
  }

  if (opts.groupId) {
    tags.push(`group:${opts.groupId}:budgets`);
  }

  invalidateTags(tags);
}

/**
 * Invalidates all account-related caches.
 * Used after creating, updating, or deleting accounts.
 */
export function invalidateAccountCaches(opts: AccountCacheInvalidationOptions): void {
  const tags: string[] = [CACHE_TAGS.ACCOUNTS, CACHE_TAGS.ACCOUNT(opts.accountId)];

  if (opts.groupId) {
    tags.push(`group:${opts.groupId}:accounts`);
  }

  if (opts.userIds) {
    opts.userIds.forEach((userId) => {
      tags.push(`user:${userId}:accounts`);
    });
  }

  invalidateTags(tags);
}

/**
 * Invalidates all user-related caches.
 * Used after updating user profile or preferences.
 */
export function invalidateUserCaches(opts: UserCacheInvalidationOptions): void {
  invalidateTags([CACHE_TAGS.USERS, CACHE_TAGS.USER(opts.userId)]);
}

/**
 * Invalidates budget period related caches.
 * Used after creating, updating, or deleting budget periods.
 */
export function invalidateBudgetPeriodCaches(opts: { userId: string; periodId?: string }): void {
  const tags: string[] = [
    CACHE_TAGS.BUDGET_PERIODS,
    `user:${opts.userId}:budget_periods`,
    `user:${opts.userId}:budget_period:active`,
    CACHE_TAGS.USERS,
    CACHE_TAGS.USER(opts.userId),
    CACHE_TAGS.BUDGETS,
    CACHE_TAGS.USER_BUDGETS(opts.userId),
    CACHE_TAGS.ACCOUNTS,
  ];

  if (opts.periodId) {
    tags.push(CACHE_TAGS.BUDGET_PERIOD(opts.periodId));
  }

  invalidateTags(tags);
}

/**
 * Invalidates category-related caches.
 */
export function invalidateCategoryCaches(opts: { categoryId?: string }): void {
  const tags: string[] = [CACHE_TAGS.CATEGORIES];

  if (opts.categoryId) {
    tags.push(CACHE_TAGS.CATEGORY(opts.categoryId));
  }

  invalidateTags(tags);
}

/**
 * Invalidates recurring series caches.
 */
export function invalidateRecurringCaches(opts: { seriesId?: string; userIds?: string[] }): void {
  const tags: string[] = [CACHE_TAGS.RECURRING_SERIES];

  if (opts.seriesId) {
    tags.push(CACHE_TAGS.RECURRING(opts.seriesId));
  }

  if (opts.userIds) {
    opts.userIds.forEach((uid) => {
      tags.push(`user:${uid}:recurring`);
    });
  }

  invalidateTags(tags);
}

/**
 * Invalidates caches when a transaction is updated.
 * Handles changes in user, account, or group associations.
 */
export function invalidateTransactionUpdateCaches(
  existing: {
    userId: string | null;
    accountId: string;
    toAccountId?: string | null;
    groupId: string | null;
  },
  update: {
    userId?: string | null;
    accountId?: string;
    toAccountId?: string | null;
    groupId?: string;
  }
): void {
  const tags: string[] = [CACHE_TAGS.TRANSACTIONS, CACHE_TAGS.ACCOUNTS];

  // User tags
  if (existing.userId)
    tags.push(`user:${existing.userId}:transactions`, `user:${existing.userId}:budgets`);
  if (update.userId && update.userId !== existing.userId) {
    tags.push(`user:${update.userId}:transactions`, `user:${update.userId}:budgets`);
  }

  // Account tags
  tags.push(`account:${existing.accountId}:transactions`);
  if (existing.toAccountId) tags.push(`account:${existing.toAccountId}:transactions`);
  if (update.accountId && update.accountId !== existing.accountId) {
    tags.push(`account:${update.accountId}:transactions`);
  }
  if (update.toAccountId && update.toAccountId !== existing.toAccountId) {
    tags.push(`account:${update.toAccountId}:transactions`);
  }

  // Group tags
  if (existing.groupId)
    tags.push(`group:${existing.groupId}:transactions`, `group:${existing.groupId}:budgets`);
  if (update.groupId && update.groupId !== existing.groupId) {
    tags.push(`group:${update.groupId}:transactions`, `group:${update.groupId}:budgets`);
  }

  invalidateTags(tags);
}

/**
 * Internal helper to invalidate multiple tags with 'max' strategy.
 */
function invalidateTags(tags: string[]): void {
  for (const tag of tags) {
    revalidateTag(tag, 'max');
  }
}
