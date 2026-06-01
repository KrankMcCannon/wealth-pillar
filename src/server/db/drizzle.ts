import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

// Reuse a single pool across HMR reloads in dev and across warm server instances.
// Supabase transaction pooler (port 6543) requires prepare: false.
const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    prepare: false,
    max: 10,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    connect_timeout: 10,
  });

if (!globalForDb.pgClient) {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });
