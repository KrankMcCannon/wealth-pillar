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
const indexes = JSON.parse(readFileSync('src/server/db/baseline/indexes.json', 'utf8')) as {
  name: string;
  sql: string;
}[];
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

it('accepts verified indexes prepared after adoption and completes all migrations', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      await tx.unsafe(baseline);
      await migrateDatabase(tx, 'adopt');
      // CREATE INDEX CONCURRENTLY cannot run inside this rollback-only fixture;
      // its resulting catalog is identical to CREATE INDEX.
      for (const index of indexes) await tx.unsafe(index.sql);
      expect(await migrateDatabase(tx, 'migrate')).toEqual({ applied: 4, pending: 0 });
      expect(await migrateDatabase(tx, 'verify')).toEqual({ applied: 4, pending: 0 });
      throw rollback;
    })
  ).rejects.toBe(rollback);
});

it('refuses a prepared index with an unexpected definition', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      await tx.unsafe(baseline);
      await migrateDatabase(tx, 'adopt');
      await tx.unsafe(
        'CREATE INDEX bank_connections_account_idx ON public.bank_connections (group_id)'
      );
      await expect(migrateDatabase(tx, 'migrate')).rejects.toThrow('catalog diverges');
      throw rollback;
    })
  ).rejects.toBe(rollback);
});

it('stops the backfill if the legacy group list disagrees with membership', async () => {
  await expect(
    client.begin(async (tx) => {
      await tx.unsafe(prerequisites);
      await tx.unsafe(baseline);
      await migrateDatabase(tx, 'adopt');
      await tx`insert into groups(id,name,user_ids) values('11111111-1111-4111-8111-111111111111','Synthetic',ARRAY['22222222-2222-4222-8222-222222222222'::uuid])`;
      await expect(migrateDatabase(tx, 'migrate')).rejects.toThrow('group_membership_mismatch');
      throw rollback;
    })
  ).rejects.toBe(rollback);
});
