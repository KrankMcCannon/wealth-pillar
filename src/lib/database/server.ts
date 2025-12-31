/**
 * Database Server Client
 *
 * Unified database client that supports switching between Supabase and json-server.
 * Uses the DatabaseClient abstraction layer to normalize database operations.
 *
 * Export name `supabaseServer` is kept for backward compatibility with existing services.
 * All 12 service files continue to work without modifications.
 *
 * @module lib/database/server
 */

export { databaseClient as supabaseServer } from './client-factory';

// Re-export types for backward compatibility
export type { Database } from './types';
