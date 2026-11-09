import { unstable_cache as nextUnstableCache } from 'next/cache';
import { transactionContext } from '@/server/db/transaction-context';
import { recordDatabaseEvent } from '@/server/db/telemetry';

/**
 * Cache Utilities
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
  // Authorization and read-modify-write paths read through their transaction.
  if (transactionContext.getStore()) return fn;
  const read = nextUnstableCache(
    async (...args: unknown[]) => {
      recordDatabaseEvent('cache.miss');
      return fn(...args);
    },
    [...keyParts],
    options
  );
  return ((...args: unknown[]) => {
    recordDatabaseEvent('cache.read');
    return read(...args);
  }) as T;
}
