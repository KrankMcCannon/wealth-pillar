import postgres, { type Options } from 'postgres';
import { validateDatabaseUrl } from './connection-config';

/** Postgres.js 4 uses seconds for pool waits; PostgreSQL GUCs use milliseconds. */
export function createPostgresClient(url: string, overrides: Options = {}) {
  const endpoint = url ? validateDatabaseUrl(url) : null;
  const local = endpoint && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
  return postgres(url, {
    // Stable Drizzle queries may opt in to named preparation explicitly.
    prepare: false,
    infer: false,
    max: 3,
    max_pipeline: 8,
    queue_timeout: 2,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 300,
    ...(!local && endpoint && { ssl: 'verify-full' as const }),
    ...overrides,
    connection: {
      application_name: 'wealth-pillar',
      TimeZone: 'UTC',
      statement_timeout: 10_000,
      lock_timeout: 5_000,
      idle_in_transaction_session_timeout: 15_000,
      transaction_timeout: 15_000,
      ...overrides.connection,
    },
  });
}
