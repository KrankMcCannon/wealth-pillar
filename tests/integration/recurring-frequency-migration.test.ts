import { afterAll, beforeEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { RECURRING_FREQUENCIES } from '@/lib/recurring/frequencies';

function script(path: string) {
  return readFileSync(
    new URL(`../../src/server/db/drizzle/${path}`, import.meta.url),
    'utf8'
  ).replaceAll('--> statement-breakpoint', '\n');
}
const forward = script('0005_recurring_frequencies.sql');
const rollback = script('rollback/0005_recurring_frequencies.sql');
const originalValues = ['daily', 'monthly', 'quarterly', 'weekly', 'yearly'];
const productValues = [...RECURRING_FREQUENCIES].sort();

async function fingerprint() {
  const [row] = await db.execute(sql`SELECT count(*)::int AS count,
    md5(coalesce(string_agg(md5(row_to_json(t)::text), '' ORDER BY id), '')) AS fingerprint
    FROM public.recurring_transactions t`);
  return row;
}
async function constraint() {
  const [row] = await db.execute(sql`SELECT c.oid::text AS oid, c.convalidated AS validated,
    ARRAY(SELECT DISTINCT token[1]
      FROM regexp_matches(pg_get_constraintdef(c.oid), $quotes$'([^']+)'$quotes$, 'g') AS token
      ORDER BY 1) AS values
    FROM pg_constraint c WHERE c.conrelid = 'public.recurring_transactions'::regclass
      AND c.conname = 'recurring_transactions_frequency_check'`);
  return row;
}
async function apply(query: string) {
  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(query));
  });
}

beforeEach(async () => {
  await db.execute(sql`DROP TABLE IF EXISTS public.recurring_transactions`);
  await db.execute(sql`CREATE TABLE public.recurring_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), frequency varchar(20) NOT NULL,
    description text NOT NULL DEFAULT 'Synthetic migration fixture',
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT recurring_transactions_frequency_check
      CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'))
  )`);
  await db.execute(sql`INSERT INTO public.recurring_transactions (frequency)
    VALUES ('monthly'), ('yearly')`);
});
afterAll(async () => {
  await db.execute(sql`DROP TABLE IF EXISTS public.recurring_transactions`);
  await db.$client.end();
});

it('migrates without changing rows and can be replayed without replacing the check again', async () => {
  const before = await fingerprint();
  await apply(forward);
  const migrated = await constraint();
  expect(migrated).toMatchObject({ values: productValues, validated: true });
  expect(await fingerprint()).toEqual(before);
  await apply(forward);
  expect(await constraint()).toEqual(migrated);
  expect(await fingerprint()).toEqual(before);
});

it('keeps the original check and rows when a legacy frequency prevents the migration', async () => {
  await db.execute(sql`INSERT INTO public.recurring_transactions (frequency) VALUES ('daily')`);
  const before = await fingerprint();
  const original = await constraint();
  await expect(apply(forward)).rejects.toMatchObject({ cause: { code: '23514' } });
  expect(await constraint()).toEqual(original);
  expect(await fingerprint()).toEqual(before);
});

it('rolls the DDL back if an error happens after the change but before commit', async () => {
  const before = await fingerprint();
  const original = await constraint();
  await expect(
    db.transaction(async (tx) => {
      await tx.execute(sql.raw(forward));
      throw new Error('Simulated failure before commit');
    })
  ).rejects.toThrow('Simulated failure before commit');
  expect(await constraint()).toEqual(original);
  expect(await fingerprint()).toEqual(before);
});

it('restores the original constraint through an explicit rollback without changing rows', async () => {
  const before = await fingerprint();
  await apply(forward);
  await apply(rollback);
  const restored = await constraint();
  expect(restored).toMatchObject({ values: originalValues, validated: true });
  expect(await fingerprint()).toEqual(before);
  await apply(rollback);
  expect(await constraint()).toEqual(restored);
});

it.each(['once', 'biweekly'])(
  'refuses a rollback that would invalidate new %s rows',
  async (frequency) => {
    await apply(forward);
    await db.execute(
      sql`INSERT INTO public.recurring_transactions (frequency) VALUES (${frequency})`
    );
    const before = await fingerprint();
    const migrated = await constraint();
    await expect(apply(rollback)).rejects.toMatchObject({ cause: { code: '23514' } });
    expect(await constraint()).toEqual(migrated);
    expect(await fingerprint()).toEqual(before);
  }
);

it('fails immediately on lock contention and preserves the original schema', async () => {
  const before = await fingerprint();
  const original = await constraint();
  const blocker = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });
  let release!: () => void;
  let acquired!: () => void;
  const lockAcquired = new Promise<void>((resolve) => {
    acquired = resolve;
  });
  const releaseLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const holding = blocker.begin(async (tx) => {
    await tx`LOCK TABLE public.recurring_transactions IN ACCESS SHARE MODE`;
    acquired();
    await releaseLock;
  });
  try {
    await lockAcquired;
    await expect(apply(forward)).rejects.toMatchObject({ cause: { code: '55P03' } });
  } finally {
    release();
    await holding;
    await blocker.end();
  }
  expect(await constraint()).toEqual(original);
  expect(await fingerprint()).toEqual(before);
});

it('stops on unexpected schema drift instead of replacing an unrecognized check', async () => {
  await db.execute(sql`ALTER TABLE public.recurring_transactions
    DROP CONSTRAINT recurring_transactions_frequency_check,
    ADD CONSTRAINT recurring_transactions_frequency_check CHECK (frequency IN ('monthly', 'yearly'))`);
  const before = await fingerprint();
  const original = await constraint();
  await expect(apply(forward)).rejects.toMatchObject({ cause: { code: '55000' } });
  expect(await constraint()).toEqual(original);
  expect(await fingerprint()).toEqual(before);
});
