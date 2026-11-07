import postgres, { type Options } from 'postgres';

/** Postgres.js 4 uses seconds for pool waits; PostgreSQL GUCs use milliseconds. */
export function createPostgresClient(url: string, overrides: Options = {}) {
  // Transaction poolers do not support session GUCs. Configure role defaults
  // there instead (see docs/database-runtime.md). Never rewrite credentials/ports.
  const transactionPooler = Boolean(url) && new URL(url).port === '6543';
  return postgres(url, {
    // Supavisor transaction mode cannot retain named statements across transactions.
    prepare: false,
    infer: false,
    max: 3,
    // Limit concurrent protocol exchanges; this does not fix dropped pooler replies.
    max_pipeline: 1,
    queue_timeout: 5,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 300,
    ...overrides,
    connection: {
      application_name: 'wealth-pillar',
      ...(!transactionPooler && {
        TimeZone: 'UTC',
        statement_timeout: 10_000,
        lock_timeout: 5_000,
        idle_in_transaction_session_timeout: 15_000,
      }),
      ...overrides.connection,
    },
  });
}
