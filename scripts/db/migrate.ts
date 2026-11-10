import { config } from 'dotenv';
import { createPostgresClient } from '../../src/server/db/postgres-client';
import { migrateDatabase } from './migrations.mjs';
import { validateDatabaseUrl } from '../../src/server/db/connection-config';

config({ path: '.env', quiet: true });
const url = process.env.DATABASE_ADMIN_URL;
if (!url) throw new Error('DATABASE_ADMIN_URL is required');
validateDatabaseUrl(url, 'DATABASE_ADMIN_URL', true);
// Administrative work has its own bounded statement/lock limits. The shorter
// runtime transaction deadline must not terminate a schema backfill mid-flight.
const client = createPostgresClient(url, {
  max: 1,
  connection: { statement_timeout: 60_000, transaction_timeout: 0 },
});
try {
  const result = await client.begin((tx) => migrateDatabase(tx, process.argv[2] ?? 'migrate'));
  process.stdout.write(JSON.stringify(result) + '\n');
} finally {
  await client.end({ timeout: 5 });
}
