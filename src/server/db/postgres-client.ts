import postgres, { type Options } from 'postgres';
import { validateDatabaseUrl } from './connection-config';

/** Postgres.js 4 uses seconds for pool waits; PostgreSQL GUCs use milliseconds. */
export function createPostgresClient(url: string, overrides: Options = {}) {
  const endpoint = url ? validateDatabaseUrl(url) : null;
  const local = endpoint && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname);
  const transactionPooler = endpoint?.port === '6543';
  return postgres(url, {
    prepare: false,
    infer: false,
    max: 3,
    max_pipeline: transactionPooler ? 1 : 8,
    queue_timeout: transactionPooler ? 5 : 2,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 300,
    ...(!local && endpoint && { ssl: 'verify-full' as const }),
    ...overrides,
    connection: {
      application_name: 'wealth-pillar',
      ...(!transactionPooler && {
        TimeZone: 'UTC',
        statement_timeout: 10_000,
        lock_timeout: 5_000,
        idle_in_transaction_session_timeout: 15_000,
        transaction_timeout: 15_000,
      }),
      ...overrides.connection,
    },
  });
}
