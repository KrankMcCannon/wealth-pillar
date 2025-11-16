/**
 * Cache Configuration
 * Centralized cache settings for Next.js unstable_cache
 */

/**
 * Cache Time-To-Live (TTL) configurations in seconds
 */
export const CACHE_TTL = {
  /** User data - 5 minutes (frequently accessed, can change) */
  USER: 300,
  /** Group data - 10 minutes (less frequent changes) */
  GROUP: 600,
  /** Account data - 5 minutes */
  ACCOUNT: 300,
  /** Transaction data - 2 minutes (frequently updated) */
  TRANSACTION: 120,
  /** Category data - 15 minutes (rarely changes) */
  CATEGORY: 900,
  /** Budget data - 5 minutes */
  BUDGET: 300,
  /** Static data - 1 hour */
  STATIC: 3600,
} as const;

/**
 * Cache tags for granular invalidation
 * Use these tags to invalidate specific cached data
 *
 * Example:
 * - revalidateTag('user:123') - invalidate specific user
 * - revalidateTag('users') - invalidate all users
 * - revalidateTag('group:abc') - invalidate specific group
 */
export const CACHE_TAGS = {
  USERS: 'users',
  USER: (userId: string) => `user:${userId}`,
  USER_BY_CLERK: (clerkId: string) => `user:clerk:${clerkId}`,
  GROUPS: 'groups',
  GROUP: (groupId: string) => `group:${groupId}`,
  GROUP_USERS: (groupId: string) => `group:${groupId}:users`,
  ACCOUNTS: 'accounts',
  ACCOUNT: (accountId: string) => `account:${accountId}`,
  TRANSACTIONS: 'transactions',
  TRANSACTION: (transactionId: string) => `transaction:${transactionId}`,
  CATEGORIES: 'categories',
  CATEGORY: (categoryId: string) => `category:${categoryId}`,
  BUDGETS: 'budgets',
  BUDGET: (budgetId: string) => `budget:${budgetId}`,
} as const;

/**
 * Cache options builder for common patterns
 */
export const cacheOptions = {
  /**
   * User cache options
   * @param userId - User ID for tag
   */
  user: (userId: string) => ({
    revalidate: CACHE_TTL.USER,
    tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER(userId)],
  }),

  /**
   * User by Clerk ID cache options
   * @param clerkId - Clerk ID for tag
   */
  userByClerk: (clerkId: string) => ({
    revalidate: CACHE_TTL.USER,
    tags: [CACHE_TAGS.USERS, CACHE_TAGS.USER_BY_CLERK(clerkId)],
  }),

  /**
   * Group cache options
   * @param groupId - Group ID for tag
   */
  group: (groupId: string) => ({
    revalidate: CACHE_TTL.GROUP,
    tags: [CACHE_TAGS.GROUPS, CACHE_TAGS.GROUP(groupId)],
  }),

  /**
   * Group users cache options
   * @param groupId - Group ID for tag
   */
  groupUsers: (groupId: string) => ({
    revalidate: CACHE_TTL.GROUP,
    tags: [CACHE_TAGS.USERS, CACHE_TAGS.GROUP_USERS(groupId)],
  }),

  /**
   * Transactions by user cache options
   * @param userId - User ID for tag
   */
  transactionsByUser: (userId: string) => ({
    revalidate: CACHE_TTL.TRANSACTION,
    tags: [CACHE_TAGS.TRANSACTIONS, `user:${userId}:transactions`],
  }),

  /**
   * Transactions by account cache options
   * @param accountId - Account ID for tag
   */
  transactionsByAccount: (accountId: string) => ({
    revalidate: CACHE_TTL.TRANSACTION,
    tags: [CACHE_TAGS.TRANSACTIONS, `account:${accountId}:transactions`],
  }),

  /**
   * Transactions by group cache options
   * @param groupId - Group ID for tag
   */
  transactionsByGroup: (groupId: string) => ({
    revalidate: CACHE_TTL.TRANSACTION,
    tags: [CACHE_TAGS.TRANSACTIONS, `group:${groupId}:transactions`],
  }),

  /**
   * Category cache options
   * @param categoryId - Category ID for tag
   */
  category: (categoryId: string) => ({
    revalidate: CACHE_TTL.CATEGORY,
    tags: [CACHE_TAGS.CATEGORIES, CACHE_TAGS.CATEGORY(categoryId)],
  }),

  /**
   * All categories cache options
   * Categories rarely change, so longer TTL
   */
  allCategories: () => ({
    revalidate: CACHE_TTL.CATEGORY,
    tags: [CACHE_TAGS.CATEGORIES],
  }),
} as const;
