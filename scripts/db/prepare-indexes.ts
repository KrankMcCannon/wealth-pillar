import { readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createPostgresClient } from '../../src/server/db/postgres-client';
import { validateDatabaseUrl } from '../../src/server/db/connection-config';

config({ path: '.env', quiet: true });
const url = process.env.DATABASE_ADMIN_URL;
if (!url) throw new Error('DATABASE_ADMIN_URL is required');
validateDatabaseUrl(url, 'DATABASE_ADMIN_URL', true);
const specs = JSON.parse(readFileSync('src/server/db/baseline/indexes.json', 'utf8')) as {
  name: string;
  table: string;
  sql: string;
}[];
const catalog = JSON.parse(readFileSync('src/server/db/baseline/0003_catalog.json', 'utf8')) as {
  indexes: { name: string; definition: string }[];
};
const client = createPostgresClient(url, {
  max: 1,
  connection: { statement_timeout: 0, lock_timeout: 5000, transaction_timeout: 0 },
});
try {
  // Session advisory lock: concurrent index DDL cannot run inside a transaction.
  await client`select pg_advisory_lock(hashtextextended('wealth-pillar:indexes',0))`;
  for (const spec of specs) {
    const [existing] =
      await client`select i.indisvalid as valid,i.indisready as ready,pg_get_indexdef(c.oid) as definition,exists(select 1 from pg_constraint k where k.conindid=c.oid) as constraint_owned from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_index i on i.indexrelid=c.oid where n.nspname='public' and c.relname=${spec.name}`;
    const expected = catalog.indexes.find((index) => index.name === spec.name)?.definition;
    if (existing?.valid && existing.ready) {
      if (existing.definition !== expected)
        throw new Error(`Index definition differs: ${spec.name}`);
      continue;
    }
    if (existing) {
      if (existing.constraint_owned) throw new Error('Cannot replace a constraint-owned index');
      // Names are repository-owned manifest constants, never command-line input.
      await client.unsafe(`DROP INDEX CONCURRENTLY public."${spec.name}"`);
    }
    await client.unsafe(spec.sql.replace('CREATE INDEX ', 'CREATE INDEX CONCURRENTLY '));
    const [created] =
      await client`select i.indisvalid as valid,i.indisready as ready,pg_get_indexdef(c.oid) as definition from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_index i on i.indexrelid=c.oid where n.nspname='public' and c.relname=${spec.name}`;
    if (!created?.valid || !created.ready || created.definition !== expected)
      throw new Error(`Index verification failed: ${spec.name}`);
    process.stdout.write(JSON.stringify({ index: spec.name, status: 'valid' }) + '\n');
  }
} finally {
  await client.end({ timeout: 5 });
}
