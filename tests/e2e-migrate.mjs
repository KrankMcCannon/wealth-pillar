import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { migrateDatabase } from '../scripts/db/migrations.mjs';

const url = new URL(process.env.DATABASE_URL ?? '');
if (
  !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/wealth_pillar_e2e'
) {
  throw new Error('The E2E migrator requires the isolated loopback database');
}
const db = postgres(url.toString(), { max: 1, onnotice: () => {} });
try {
  await db.begin(async (tx) => {
    await tx.unsafe(readFileSync('tests/integration/platform-prerequisites.sql', 'utf8'));
    await migrateDatabase(tx);
  });
} finally {
  await db.end();
}
