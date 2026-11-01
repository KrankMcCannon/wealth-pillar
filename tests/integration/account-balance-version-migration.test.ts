import { readFileSync } from 'node:fs';
import { afterAll, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';

const migration = readFileSync(
  'src/server/db/drizzle/20261101191621_account_balance_versions.sql',
  'utf8'
);
afterAll(async () => {
  await db.execute(sql`DROP TABLE IF EXISTS accounts CASCADE`);
  await db.execute(sql`DROP FUNCTION IF EXISTS public.bump_account_balance_version()`);
  await db.$client.end();
});

it('rolls back cleanly and can be replayed without changing balances or resetting revisions', async () => {
  await db.execute(
    sql`CREATE TABLE accounts (id integer PRIMARY KEY, balance numeric, updated_at timestamptz DEFAULT now())`
  );
  await db.execute(sql`INSERT INTO accounts (id, balance) VALUES (1, 123.45)`);
  const rollback = new Error('rollback migration fixture');
  await expect(
    db.transaction(async (tx) => {
      await tx.execute(sql.raw(migration.replace(/^BEGIN;/, '').replace(/COMMIT;\s*$/, '')));
      throw rollback;
    })
  ).rejects.toBe(rollback);
  expect(
    (
      await db.execute(
        sql`SELECT count(*)::int AS count FROM information_schema.columns WHERE table_schema='public' AND table_name='accounts' AND column_name='balance_version'`
      )
    )[0]?.count
  ).toBe(0);
  await db.transaction((tx) => tx.execute(sql.raw(migration)));
  expect(
    (await db.execute(sql`SELECT balance::text, balance_version::text FROM accounts`))[0]
  ).toMatchObject({ balance: '123.45', balance_version: '0' });
  await db.execute(sql`UPDATE accounts SET balance = balance - 10 WHERE id=1`);
  await db.transaction((tx) => tx.execute(sql.raw(migration)));
  await db.execute(sql`UPDATE accounts SET updated_at = now() WHERE id=1`);
  expect(
    (await db.execute(sql`SELECT balance::text, balance_version::text FROM accounts`))[0]
  ).toMatchObject({ balance: '113.45', balance_version: '1' });
  await db.execute(sql`UPDATE accounts SET balance = balance + 20 WHERE id=1`);
  expect(
    (await db.execute(sql`SELECT balance_version::text FROM accounts`))[0]?.balance_version
  ).toBe('2');
});
