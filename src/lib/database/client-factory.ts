/**
 * Database Client Factory
 *
 * Factory pattern implementation that creates the database client
 * based on environment configuration. Uses Supabase as the single backend.
 *
 * @module lib/database/client-factory
 */

import type { DatabaseClient } from './query-builder';
import { SupabaseAdapter } from './adapters/supabase-adapter';

/**
 * Cached database client instance
 * Lazy-loaded on first access
 */
let cachedClient: DatabaseClient | null = null;
const boundMethods = new Map<PropertyKey, unknown>();

/**
 * Creates the database client.
 *
 * @returns DatabaseClient instance (SupabaseAdapter)
 */
export function createDatabaseClient(): DatabaseClient {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Database] Using Supabase adapter');
  }
  return new SupabaseAdapter();
}

/**
 * Lazy-loaded singleton database client with Proxy pattern
 *
 * Creates the client on first access to ensure environment variables are loaded.
 * The client is cached and reused across all database operations.
 *
 * @example
 * ```typescript
 * import { databaseClient } from '@/lib/database/client-factory';
 *
 * // Uses Supabase as the single backend
 * const { data, error } = await databaseClient
 *   .from('users')
 *   .select('*')
 *   .eq('id', userId)
 *   .single();
 * ```
 */
export const databaseClient = new Proxy({} as DatabaseClient, {
  get: (_target, prop) => {
    cachedClient ??= createDatabaseClient();

    if (typeof prop === 'string' && prop in cachedClient) {
      const cachedValue = boundMethods.get(prop);
      if (cachedValue) {
        return cachedValue;
      }
      const value = cachedClient[prop as keyof DatabaseClient];
      if (typeof value === 'function') {
        const bound = value.bind(cachedClient);
        boundMethods.set(prop, bound);
        return bound;
      }
      return value;
    }

    return undefined;
  },
});
