import { readFileSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';
import { createPostgresClient } from '@/server/db/postgres-client';
import { migrateDatabase } from '../../scripts/db/migrations.mjs';
import {
  assertCatalogEquivalent,
  expectedCatalog,
  readCatalog,
} from '../../scripts/db/catalog.mjs';

const client = createPostgresClient(process.env.DATABASE_URL!, { max: 1 });
const prerequisites = readFileSync('tests/integration/platform-prerequisites.sql', 'utf8');
const baseline = readFileSync('src/server/db/baseline/0000_verified_baseline.sql', 'utf8');
const rollback = new Error('rollback test fixture');
afterAll(() => client.end());

it('builds the exact production-shaped catalog from an empty PostgreSQL 17 database', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      expect(await migrateDatabase(tx, 'migrate', 0)).toEqual({ applied: 1, pending: 0 });
      expect(await migrateDatabase(tx, 'verify', 0)).toEqual({ applied: 1, pending: 0 });
      assertCatalogEquivalent(expectedCatalog(), await readCatalog(tx));
      throw rollback;
    })
  ).rejects.toBe(rollback);
});

it('adopts an equivalent existing catalog without replaying any DDL', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      await tx.unsafe(baseline);
      await tx`create temp table baseline_oids as select oid from pg_class where relnamespace='public'::regnamespace`;
      expect(await migrateDatabase(tx, 'adopt', 0)).toEqual({ applied: 1, pending: 0 });
      const [result] =
        await tx`select count(*)::int as missing from baseline_oids old where not exists(select 1 from pg_class c where c.oid=old.oid)`;
      expect(result?.missing).toBe(0);
      throw rollback;
    })
  ).rejects.toBe(rollback);
});

it('refuses divergent catalogs and unknown journals without adopting them', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      await tx.unsafe(baseline);
      await tx`alter table accounts alter column name drop not null`;
      await expect(migrateDatabase(tx, 'adopt', 0)).rejects.toThrow('catalog diverges');
      const [journal] =
        await tx`select to_regclass('wealth_pillar_migrations.journal')::text as name`;
      expect(journal?.name).toBeNull();
      throw rollback;
    })
  ).rejects.toBe(rollback);
});
