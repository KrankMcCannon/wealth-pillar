/**
 * Cache Key Generators
 * Generates consistent cache keys for unstable_cache
 *
 * Following DRY principle - centralized key generation prevents typos and inconsistencies
 */

/**
 * User-related cache keys
 */
export const userCacheKeys = {
  /**
   * Cache key for user by ID
   * @param userId - User ID
   */
  byId: (userId: string) => ['user', 'id', userId] as const,

  /**
   * Cache key for user by Clerk ID
   * @param clerkId - Clerk authentication ID
   */
  byClerkId: (clerkId: string) => ['user', 'clerk', clerkId] as const,

  /**
   * Cache key for all users (use with caution)
   */
  all: () => ['users'] as const,
} as const;

/**
 * Group-related cache keys
 */
export const groupCacheKeys = {
  /**
   * Cache key for group by ID
   * @param groupId - Group ID
   */
  byId: (groupId: string) => ['group', 'id', groupId] as const,

  /**
   * Cache key for all users in a group
   * @param groupId - Group ID
   */
  users: (groupId: string) => ['group', groupId, 'users'] as const,

  /**
   * Cache key for all groups (use with caution)
   */
  all: () => ['groups'] as const,
} as const;

/**
 * Account-related cache keys
 */
export const accountCacheKeys = {
  /**
   * Cache key for account by ID
   * @param accountId - Account ID
   */
  byId: (accountId: string) => ['account', 'id', accountId] as const,

  /**
   * Cache key for accounts by user
   * @param userId - User ID
   */
  byUser: (userId: string) => ['accounts', 'user', userId] as const,

  /**
   * Cache key for accounts by group
   * @param groupId - Group ID
   */
  byGroup: (groupId: string) => ['accounts', 'group', groupId] as const,
} as const;

/**
 * Transaction-related cache keys
 */
export const transactionCacheKeys = {
  /**
   * Cache key for transaction by ID
   * @param transactionId - Transaction ID
   */
  byId: (transactionId: string) => ['transaction', 'id', transactionId] as const,

  /**
   * Cache key for transactions by user
   * @param userId - User ID
   */
  byUser: (userId: string) => ['transactions', 'user', userId] as const,

  /**
   * Cache key for transactions by account
   * @param accountId - Account ID
   */
  byAccount: (accountId: string) =>
    ['transactions', 'account', accountId] as const,

  /**
   * Cache key for transactions by group
   * @param groupId - Group ID
   */
  byGroup: (groupId: string) => ['transactions', 'group', groupId] as const,
} as const;

/**
 * Category-related cache keys
 */
export const categoryCacheKeys = {
  /**
   * Cache key for category by ID
   * @param categoryId - Category ID
   */
  byId: (categoryId: string) => ['category', 'id', categoryId] as const,

  /**
   * Cache key for category by key
   * @param key - Category unique key
   */
  byKey: (key: string) => ['category', 'key', key] as const,

  /**
   * Cache key for all categories
   */
  all: () => ['categories'] as const,
} as const;

/**
 * Budget-related cache keys
 */
export const budgetCacheKeys = {
  /**
   * Cache key for budget by ID
   * @param budgetId - Budget ID
   */
  byId: (budgetId: string) => ['budget', 'id', budgetId] as const,

  /**
   * Cache key for budgets by user
   * @param userId - User ID
   */
  byUser: (userId: string) => ['budgets', 'user', userId] as const,

  /**
   * Cache key for budgets by group
   * @param groupId - Group ID
   */
  byGroup: (groupId: string) => ['budgets', 'group', groupId] as const,

  /**
   * Cache key for all budgets
   */
  all: () => ['budgets'] as const,
} as const;

/**
 * Recurring series cache keys
 */
export const recurringCacheKeys = {
  /**
   * Cache key for recurring series by ID
   * @param seriesId - Series ID
   */
  byId: (seriesId: string) => ['recurring', 'id', seriesId] as const,

  /**
   * Cache key for recurring series by user
   * @param userId - User ID
   */
  byUser: (userId: string) => ['recurring', 'user', userId] as const,

  /**
   * Cache key for recurring series by group
   * @param groupId - Group ID
   */
  byGroup: (groupId: string) => ['recurring', 'group', groupId] as const,

  /**
   * Cache key for all recurring series
   */
  all: () => ['recurring_series'] as const,
} as const;

/**
 * Budget period cache keys
 */
export const budgetPeriodCacheKeys = {
  /**
   * Cache key for budget period by ID
   * @param periodId - Period ID
   */
  byId: (periodId: string) => ['budget_period', 'id', periodId] as const,

  /**
   * Cache key for budget periods by user
   * @param userId - User ID
   */
  byUser: (userId: string) => ['budget_periods', 'user', userId] as const,

  /**
   * Cache key for active budget period by user
   * @param userId - User ID
   */
  activeByUser: (userId: string) =>
    ['budget_period', 'user', userId, 'active'] as const,

  /**
   * Cache key for all budget periods
   */
  all: () => ['budget_periods'] as const,
} as const;

/**
 * User preferences cache keys
 */
export const userPreferencesCacheKeys = {
  /**
   * Cache key for user preferences by user ID
   * @param userId - User ID
   */
  byUser: (userId: string) => ['user_preferences', 'user', userId] as const,

  /**
   * Cache key for all user preferences
   */
  all: () => ['user_preferences'] as const,
} as const;

/**
 * Group invitations cache keys
 */
export const groupInvitationCacheKeys = {
  /**
   * Cache key for invitation by ID
   * @param invitationId - Invitation ID
   */
  byId: (invitationId: string) => ['group_invitation', 'id', invitationId] as const,

  /**
   * Cache key for invitations by group
   * @param groupId - Group ID
   */
  byGroup: (groupId: string) => ['group_invitations', 'group', groupId] as const,

  /**
   * Cache key for all group invitations
   */
  all: () => ['group_invitations'] as const,
} as const;
