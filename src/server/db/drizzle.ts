import { drizzle } from 'drizzle-orm/postgres-js';
import type { Sql } from 'postgres';
import { createPostgresClient } from './postgres-client';
import { schemaBundle } from './schema-bundle';
import { installDatabaseTelemetry } from './telemetry';
import { createManagedPostgresClient } from './managed-postgres-client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV !== 'test') {
  throw new Error('DATABASE_URL is not set');
}

if (
  connectionString &&
  process.env.NODE_ENV !== 'test' &&
  /\[YOUR-PASSWORD\]|YOUR-PASSWORD/i.test(connectionString)
) {
  throw new Error(
    'DATABASE_URL still contains the [YOUR-PASSWORD] placeholder. Paste the real database password from Supabase → Project Settings → Database.'
  );
}

const globalForDb = globalThis as unknown as {
  pgClient?: Sql;
  pgConnectionString?: string;
  pgTelemetryInstalled?: boolean;
};

if (process.env.DB_TELEMETRY_ENABLED === 'true' && !globalForDb.pgTelemetryInstalled) {
  // Metrics are opt-in, and contain only the telemetry allowlist.

  installDatabaseTelemetry((event) =>
    process.stdout.write(
      JSON.stringify({
        ...event,
        environment: process.env.CONTEXT ?? process.env.NODE_ENV,
        release: process.env.COMMIT_REF ?? 'local',
      }) + '\n'
    )
  );
  globalForDb.pgTelemetryInstalled = true;
}

// Reuse a single pool across HMR reloads in dev and across warm server instances.
// Do not cache a client created without a URL — Turbopack can evaluate this
// module before env is injected, then keep the dead pool on later reloads.
const client =
  connectionString && globalForDb.pgClient && globalForDb.pgConnectionString === connectionString
    ? globalForDb.pgClient
    : process.env.DB_POOL_RECOVERY_ENABLED === 'true'
      ? createManagedPostgresClient(() => createPostgresClient(connectionString ?? ''))
      : createPostgresClient(connectionString ?? '');

if (connectionString) {
  globalForDb.pgClient = client;
  globalForDb.pgConnectionString = connectionString;
}

export const db = drizzle(client, { schema: schemaBundle });
