/**
 * Database Client Factory
 *
 * Factory pattern implementation that creates the appropriate database client
 * based on environment configuration. Supports switching between Supabase and
 * json-server for development/testing.
 *
 * @module lib/database/client-factory
 */

import type { DatabaseClient } from './query-builder';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { JsonServerAdapter } from './adapters/json-server-adapter';

/**
 * Cached database client instance
 * Lazy-loaded on first access
 */
let cachedClient: DatabaseClient | null = null;

/**
 * Creates the appropriate database client based on USE_MOCK_API environment variable
 *
 * @returns DatabaseClient instance (either SupabaseAdapter or JsonServerAdapter)
 *
 * Environment Variables:
 * - USE_MOCK_API=true → Use JsonServerAdapter (json-server REST API)
 * - USE_MOCK_API=false or undefined → Use SupabaseAdapter (PostgreSQL)
 * - MOCK_API_URL → Base URL for json-server (default: http://localhost:3001)
 */
export function createDatabaseClient(): DatabaseClient {
  const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

  if (useMockApi) {
    const mockApiUrl = process.env.NEXT_PUBLIC_MOCK_API_URL || 'http://localhost:3001';
    console.log('[Database] Using MockAPI adapter:', mockApiUrl);
    return new JsonServerAdapter(mockApiUrl);
  }

  console.log('[Database] Using Supabase adapter');
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
 * // Automatically uses the correct adapter based on USE_MOCK_API
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
      const value = cachedClient[prop as keyof DatabaseClient];
      return typeof value === 'function' ? value.bind(cachedClient) : value;
    }

    return undefined;
  },
});
