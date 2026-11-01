import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import {
  createBankConnection,
  getBankNotificationSettings,
  ingestBankNotification,
  revokeBankConnection,
  reviewBankNotification,
} from '@/server/use-cases/bank-notifications/notification-service';
import { updateTransactionUseCase } from '@/server/use-cases/transactions/update-transaction.use-case';
import type { User } from '@/lib/types';
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }));
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = { id: id(1), group_id: id(2), role: 'admin' } as User;
const other = { id: id(3), group_id: id(4), role: 'admin' } as User;
const accountId = id(5);
const payload = {
  provider: 'revolut' as const,
  title: 'Pizzeria Rosticceria N',
  body: '🍽️ Hai speso 17 €\nSaldo di EUR: 1.722,83 €',
  occurredAt: '2026-10-30T19:30:00+01:00',
};
const connection = (autoImport = true) =>
  createBankConnection(user, { name: 'iPhone', accountId, category: 'food', autoImport });
beforeAll(async () => {
  await db.execute(sql`CREATE TABLE groups (id uuid PRIMARY KEY)`);
  await db.execute(
    sql`CREATE TABLE users (id uuid PRIMARY KEY, clerk_id text,name text,email text,avatar text,theme_color text,budget_start_date integer,group_id uuid,role text,created_at timestamptz,updated_at timestamptz,default_account_id uuid)`
  );
  await db.execute(
    sql`CREATE TABLE accounts (id uuid PRIMARY KEY,name text,type text,user_ids uuid[],group_id uuid,balance numeric(12,2) DEFAULT 0,balance_version bigint DEFAULT 0,liquidity text,created_at timestamptz,updated_at timestamptz)`
  );
  await db.execute(
    sql`CREATE TABLE categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),key text,label text,icon text,color text,group_id uuid,created_at timestamptz,updated_at timestamptz)`
  );
  await db.execute(
    sql`CREATE TABLE transactions (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),description text,amount numeric(15,2),type text,category text,date date,user_id uuid,account_id uuid,group_id uuid,to_account_id uuid,frequency text,recurring_series_id uuid,import_hash text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(account_id,import_hash))`
  );
  await db.transaction((tx) =>
    tx.execute(
      sql.raw(
        readFileSync('src/server/db/drizzle/0007_bank_notifications.sql', 'utf8').replaceAll(
          '--> statement-breakpoint',
          '\n'
        )
      )
    )
  );
});
beforeEach(async () => {
  await db.execute(
    sql`TRUNCATE bank_notification_events, bank_merchant_rules, bank_connections, transactions, categories, accounts, users, groups CASCADE`
  );
  await db.execute(sql`INSERT INTO groups VALUES (${user.group_id}),(${other.group_id})`);
  await db.execute(
    sql`INSERT INTO users (id,group_id) VALUES (${user.id},${user.group_id}),(${other.id},${other.group_id})`
  );
  await db.execute(
    sql`INSERT INTO accounts (id,group_id,user_ids,balance) VALUES (${accountId},${user.group_id},ARRAY[${user.id}::uuid],100)`
  );
  await db.execute(
    sql`INSERT INTO categories (key,group_id,label) VALUES ('food',${user.group_id},'Food'),('other',${user.group_id},'Other')`
  );
});
afterAll(async () => {
  await db.execute(
    sql`DROP TABLE IF EXISTS bank_notification_events, bank_merchant_rules, bank_connections, transactions, categories, accounts, users, groups CASCADE`
  );
  await db.$client.end();
});
it('stores only a token digest and refuses cross-tenant setup and review', async () => {
  const device = await connection(false);
  const digest = await db.execute(sql`SELECT token_hash FROM bank_connections`);
  expect(digest[0]!.token_hash).not.toBe(device.token);
  expect(digest[0]!.token_hash).toMatch(/^[a-f0-9]{64}$/);
  await expect(
    createBankConnection(other, { name: 'Intruder', accountId, category: 'food', autoImport: true })
  ).rejects.toThrow();
  const event = await ingestBankNotification(device.token, payload);
  await expect(reviewBankNotification(other, event.id, 'import', 'food')).rejects.toThrow(
    'not_found'
  );
  expect(JSON.stringify(await getBankNotificationSettings(user))).not.toContain('token_hash');
});
it('deduplicates concurrent retries and applies the balance exactly once', async () => {
  const device = await connection();
  const results = await Promise.all(
    Array.from({ length: 8 }, () => ingestBankNotification(device.token, payload))
  );
  expect(results.filter((result) => !result.duplicate)).toHaveLength(1);
  expect(new Set(results.map((result) => result.id)).size).toBe(1);
  const rows = await db.execute(
    sql`SELECT balance, (SELECT count(*)::int FROM transactions) AS count FROM accounts`
  );
  expect(Number(rows[0]!.balance)).toBe(83);
  expect(rows[0]!.count).toBe(1);
});
it('deduplicates across two devices linked to the same account', async () => {
  const devices = await Promise.all([connection(), connection()]);
  const results = await Promise.all(
    devices.map((device) => ingestBankNotification(device.token, payload))
  );
  expect(results.filter((result) => result.duplicate)).toHaveLength(1);
});
it('requires review for matching existing movements, and learns explicit categories', async () => {
  const device = await connection(false);
  const event = await ingestBankNotification(device.token, payload);
  expect(event.status).toBe('pending');
  await Promise.all([
    reviewBankNotification(user, event.id, 'import', 'other'),
    reviewBankNotification(user, event.id, 'import', 'other'),
  ]);
  await db.execute(sql`UPDATE bank_connections SET auto_import=true`);
  const second = await ingestBankNotification(device.token, {
    ...payload,
    occurredAt: '2026-10-31T19:30:00+01:00',
  });
  expect(second.status).toBe('imported');
  const rows = await db.execute(sql`SELECT category FROM transactions`);
  expect(rows.map((row) => row.category)).toEqual(['other', 'other']);
  const third = await ingestBankNotification(device.token, {
    ...payload,
    occurredAt: '2026-10-31T19:31:00+01:00',
  });
  expect(third.status).toBe('pending');
  expect(
    (await getBankNotificationSettings(user)).events.find((row) => row.id === third.id)?.reason
  ).toBe('possible_duplicate');
});
it('stops a revoked token and a connection whose owner lost account access', async () => {
  const first = await connection();
  await revokeBankConnection(user, first.id);
  await expect(ingestBankNotification(first.token, payload)).rejects.toThrow('unauthorized');
  const second = await connection();
  await db.execute(sql`UPDATE accounts SET user_ids=ARRAY[]::uuid[]`);
  await expect(ingestBankNotification(second.token, payload)).rejects.toThrow(
    'connection_unavailable'
  );
});
it('keeps unrecognized notifications without affecting the ledger', async () => {
  const device = await connection();
  expect(
    (await ingestBankNotification(device.token, { ...payload, provider: 'credem' })).status
  ).toBe('pending');
  const { occurredAt: _, ...missingDate } = payload;
  expect((await ingestBankNotification(device.token, missingDate)).status).toBe('pending');
  const rows = await db.execute(sql`SELECT balance FROM accounts`);
  expect(Number(rows[0]!.balance)).toBe(100);
});
it('rolls back event, ledger and device usage when a balance update fails', async () => {
  const device = await connection();
  await db.execute(sql`UPDATE accounts SET balance=-9999999999.99`);
  await expect(ingestBankNotification(device.token, payload)).rejects.toThrow();
  const rows = await db.execute(
    sql`SELECT (SELECT count(*)::int FROM bank_notification_events) AS events,(SELECT count(*)::int FROM transactions) AS movements,(SELECT rate_count FROM bank_connections) AS used`
  );
  expect(rows[0]).toEqual({ events: 0, movements: 0, used: 0 });
});
it('enforces a persistent per-device rate limit', async () => {
  const device = await connection(false);
  for (let n = 0; n < 60; n++)
    await ingestBankNotification(device.token, { ...payload, eventId: String(n) });
  await expect(
    ingestBankNotification(device.token, { ...payload, eventId: 'overflow' })
  ).rejects.toMatchObject({ code: 'rate_limited', status: 429 });
});

it('learns a category correction made in the ordinary transaction editor', async () => {
  const device = await connection();
  const first = await ingestBankNotification(device.token, payload);
  const event = (await getBankNotificationSettings(user)).events.find(
    (row) => row.id === first.id
  )!;
  await updateTransactionUseCase(
    event.transaction_id!,
    { category: 'other' },
    { groupId: user.group_id!, userId: user.id }
  );
  const next = await ingestBankNotification(device.token, {
    ...payload,
    occurredAt: '2026-10-31T12:00:00+01:00',
  });
  expect(next.status).toBe('imported');
  const rows = await db.execute(sql`SELECT category FROM transactions`);
  expect(rows.map((row) => row.category)).toEqual(['other', 'other']);
});
