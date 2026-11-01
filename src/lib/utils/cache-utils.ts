/**
 * Shared Cache Invalidation Utilities
 *
 * Centralized cache invalidation helpers to reduce code duplication.
 * Financial writes expire tags immediately; non-financial metadata can revalidate in the background.
 */

import { revalidateTag } from 'next/cache';
import { CACHE_TAGS } from '@/lib/cache/config';

/**
 * Options for transaction cache invalidation
 */
export interface TransactionCacheInvalidationOptions {
  groupId: string;
  accountId: string;
  userId?: string | null | undefined;
  toAccountId?: string | null | undefined;
  transactionId?: string | undefined;
}

/**
 * Options for budget cache invalidation
 */
export interface BudgetCacheInvalidationOptions {
  budgetId?: string | undefined;
  userId: string;
  groupId?: string | undefined;
}

export interface InvestmentCacheInvalidationOptions {
  groupId?: string | null | undefined;
  userId: string;
}

/**
 * Options for account cache invalidation
 */
export interface AccountCacheInvalidationOptions {
  accountId: string;
  groupId?: string | undefined;
  userIds?: string[] | undefined;
}

/**
 * Options for user cache invalidation
 */
export interface UserCacheInvalidationOptions {
  userId: string;
  clerkId?: string | null | undefined;
  groupId?: string | null | undefined;
  previousGroupId?: string | null | undefined;
}

/**
 * Invalidates all transaction-related caches.
 * Used after creating, updating, or deleting transactions.
 */
export function invalidateTransactionCaches(opts: TransactionCacheInvalidationOptions): void {
  const accountTags: string[] = [
    CACHE_TAGS.ACCOUNT(opts.accountId),
    `group:${opts.groupId}:accounts`,
  ];

  if (opts.toAccountId) {
    accountTags.push(CACHE_TAGS.ACCOUNT(opts.toAccountId));
  }

  // Financial data is correctness-critical:
  // the next read after a financial mutation must see the new value.
  expireTags(accountTags);

  const financialTags: string[] = [
    `account:${opts.accountId}:transactions`,
    `group:${opts.groupId}:transactions`,
    `group:${opts.groupId}:budgets`,
  ];

  if (opts.userId) {
    financialTags.push(`user:${opts.userId}:transactions`, `user:${opts.userId}:budgets`);
  }

  if (opts.toAccountId) {
    financialTags.push(`account:${opts.toAccountId}:transactions`);
  }

  if (opts.transactionId) {
    financialTags.push(`transaction:${opts.transactionId}`);
  }

  expireTags(financialTags);
}

/**
 * Invalidates all budget-related caches.
 * Used after creating, updating, or deleting budgets.
 */
export function invalidateBudgetCaches(opts: BudgetCacheInvalidationOptions): void {
  const tags: string[] = [`user:${opts.userId}:budgets`];

  if (opts.budgetId) {
    tags.push(CACHE_TAGS.BUDGET(opts.budgetId));
  }

  if (opts.groupId) {
    tags.push(`group:${opts.groupId}:budgets`);
  }

  expireTags(tags);
}

/**
 * Invalidates investments page caches after holdings mutations.
 */
export function invalidateInvestmentCaches(opts: InvestmentCacheInvalidationOptions): void {
  const tags = [`user:${opts.userId}:investments`];
  if (opts.groupId) tags.push(`group:${opts.groupId}:investments`);
  expireTags(tags);
}

/**
 * Invalidates all account-related caches.
 * Used after creating, updating, or deleting accounts.
 */
export function invalidateAccountCaches(opts: AccountCacheInvalidationOptions): void {
  const tags: string[] = [CACHE_TAGS.ACCOUNT(opts.accountId)];

  if (opts.groupId) {
    tags.push(`group:${opts.groupId}:accounts`);
  }

  if (opts.userIds) {
    opts.userIds.forEach((userId) => {
      tags.push(`user:${userId}:accounts`);
    });
  }

  expireTags(tags);
}

/**
 * Invalidates all user-related caches.
 * Used after updating user profile or preferences.
 */
export function invalidateUserCaches(opts: UserCacheInvalidationOptions): void {
  const tags = [CACHE_TAGS.USER(opts.userId)];
  if (opts.clerkId) tags.push(CACHE_TAGS.USER_BY_CLERK(opts.clerkId));
  for (const groupId of new Set([opts.groupId, opts.previousGroupId])) {
    if (groupId) tags.push(CACHE_TAGS.GROUP_USERS(groupId), `group:${groupId}:investments`);
  }
  expireTags(tags);
}

/**
 * Invalidates budget period related caches.
 * Used after creating, updating, or deleting budget periods.
 */
export function invalidateBudgetPeriodCaches(opts: {
  userId: string;
  periodId?: string | undefined;
}): void {
  const tags: string[] = [
    `user:${opts.userId}:budget_periods`,
    `user:${opts.userId}:budget_period:active`,
    CACHE_TAGS.USER(opts.userId),
    CACHE_TAGS.USER_BUDGETS(opts.userId),
  ];

  if (opts.periodId) {
    tags.push(CACHE_TAGS.BUDGET_PERIOD(opts.periodId));
  }

  expireTags(tags);
}

/**
 * Invalidates category-related caches.
 */
export function invalidateCategoryCaches(opts: { categoryId?: string; groupId?: string }): void {
  const tags: string[] = opts.groupId
    ? [`group:${opts.groupId}:categories`]
    : [CACHE_TAGS.CATEGORIES];

  if (opts.categoryId) {
    tags.push(CACHE_TAGS.CATEGORY(opts.categoryId));
  }

  expireTags(tags);
}

/**
 * Invalidates recurring series caches.
 */
export function invalidateRecurringCaches(opts: {
  seriesId?: string | undefined;
  userIds?: string[] | undefined;
  groupId?: string | undefined;
}): void {
  const tags: string[] = [];

  if (opts.seriesId) {
    tags.push(CACHE_TAGS.RECURRING(opts.seriesId));
  }

  if (opts.userIds) {
    opts.userIds.forEach((uid) => {
      tags.push(`user:${uid}:recurring`);
    });
  }

  if (opts.groupId) {
    tags.push(`group:${opts.groupId}:recurring`);
  }

  // Mutations must refresh dependent Dashboard summaries on the very next read.
  expireTags(tags);
}

/**
 * Invalidates caches when a transaction is updated.
 * Handles changes in user, account, or group associations.
 */
export function invalidateTransactionUpdateCaches(
  existing: {
    userId: string | null;
    accountId: string;
    toAccountId?: string | null | undefined;
    groupId: string | null;
    id?: string | null | undefined;
  },
  update: {
    userId?: string | null | undefined;
    accountId?: string | undefined;
    toAccountId?: string | null | undefined;
    groupId?: string | undefined;
  }
): void {
  const accountTags: string[] = [CACHE_TAGS.ACCOUNT(existing.accountId)];

  if (existing.toAccountId) {
    accountTags.push(CACHE_TAGS.ACCOUNT(existing.toAccountId));
  }

  if (update.accountId && update.accountId !== existing.accountId) {
    accountTags.push(CACHE_TAGS.ACCOUNT(update.accountId));
  }

  if (update.toAccountId && update.toAccountId !== existing.toAccountId) {
    accountTags.push(CACHE_TAGS.ACCOUNT(update.toAccountId));
  }

  if (existing.groupId) {
    accountTags.push(`group:${existing.groupId}:accounts`);
  }

  if (update.groupId && update.groupId !== existing.groupId) {
    accountTags.push(`group:${update.groupId}:accounts`);
  }

  expireTags(accountTags);

  const tags: string[] = [];

  if (existing.id) {
    tags.push(`transaction:${existing.id}`);
  }

  if (existing.userId) {
    tags.push(`user:${existing.userId}:transactions`, `user:${existing.userId}:budgets`);
  }

  if (update.userId && update.userId !== existing.userId) {
    tags.push(`user:${update.userId}:transactions`, `user:${update.userId}:budgets`);
  }

  tags.push(`account:${existing.accountId}:transactions`);

  if (existing.toAccountId) {
    tags.push(`account:${existing.toAccountId}:transactions`);
  }

  if (update.accountId && update.accountId !== existing.accountId) {
    tags.push(`account:${update.accountId}:transactions`);
  }

  if (update.toAccountId && update.toAccountId !== existing.toAccountId) {
    tags.push(`account:${update.toAccountId}:transactions`);
  }

  if (existing.groupId) {
    tags.push(`group:${existing.groupId}:transactions`, `group:${existing.groupId}:budgets`);
  }

  if (update.groupId && update.groupId !== existing.groupId) {
    tags.push(`group:${update.groupId}:transactions`, `group:${update.groupId}:budgets`);
  }

  expireTags(tags);
}

function expireTags(tags: string[]): void {
  for (const tag of new Set(tags)) {
    // These use cases also run in Clerk webhooks, where updateTag is unavailable.
    revalidateTag(tag, { expire: 0 });
  }
}
