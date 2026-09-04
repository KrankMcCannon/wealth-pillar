import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { schemaBundle } from './schema-bundle';

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
  pgClient?: ReturnType<typeof postgres>;
  pgConnectionString?: string;
};

// Reuse a single pool across HMR reloads in dev and across warm server instances.
// Supabase transaction pooler (port 6543) requires prepare: false.
// Do not cache a client created without a URL — Turbopack can evaluate this
// module before env is injected, then keep the dead pool on later reloads.
const client =
  connectionString &&
  globalForDb.pgClient &&
  globalForDb.pgConnectionString === connectionString
    ? globalForDb.pgClient
    : postgres(connectionString ?? '', {
        prepare: false,
        max: 10,
        idle_timeout: 20,
        max_lifetime: 60 * 30,
        connect_timeout: 10,
      });

if (connectionString) {
  globalForDb.pgClient = client;
  globalForDb.pgConnectionString = connectionString;
}

export const db = drizzle(client, { schema: schemaBundle });
