import { unstable_cache } from 'next/cache';

/**
 * Cache Utilities
 * Wrapper around Next.js unstable_cache for type-safe caching
 */

/**
 * Options for cached functions
 */
export interface CacheOptions {
  /** Cache revalidation time in seconds */
  revalidate?: number;
  /** Cache tags for invalidation */
  tags?: string[];
}

/**
 * Creates a cached version of an async function
 * Wraps Next.js unstable_cache with better TypeScript support
 *
 * @param fn - Async function to cache
 * @param keyParts - Cache key parts (should be unique)
 * @param options - Cache options (TTL, tags)
 * @returns Cached function
 *
 * @example
 * const getCachedUser = cached(
 *   async (id: string) => getUserFromDb(id),
 *   userCacheKeys.byId(userId),
 *   cacheOptions.user(userId)
 * );
 */
export function cached<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyParts: readonly string[],
  options?: CacheOptions
): T {
  return unstable_cache(fn, [...keyParts], options);
}

// Re-export cache configuration for convenience
export { CACHE_TAGS, CACHE_TTL, cacheOptions } from './config';
export {
  accountCacheKeys,
  budgetCacheKeys,
  budgetPeriodCacheKeys,
  categoryCacheKeys,
  groupCacheKeys,
  groupInvitationCacheKeys,
  recurringCacheKeys,
  transactionCacheKeys,
  userCacheKeys,
  userPreferencesCacheKeys,
} from './keys';

