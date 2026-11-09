import { afterAll, beforeAll, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { drizzle } from 'drizzle-orm/postgres-js';
import { boolean, date, jsonb, numeric, pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';
import { eq, sql } from 'drizzle-orm';
import { readWithRetry } from '@/server/db/read-with-retry';
import { createPostgresClient } from '@/server/db/postgres-client';
import { db } from '@/server/db/drizzle';
import { GroupsRepository } from '@/server/repositories/groups.repository';
import { UsersRepository } from '@/server/repositories/users.repository';

const url = process.env.DATABASE_URL!;
const userId = '11111111-1111-4111-8111-111111111111';
const groupId = '22222222-2222-4222-8222-222222222222';
const values = pgTable('driver4_values', {
  id: uuid().primaryKey(),
  day: date({ mode: 'string' }),
  instant: timestamp({ withTimezone: true, mode: 'date' }),
  amount: numeric({ precision: 20, scale: 6 }),
  flag: boolean(),
  members: uuid().array(),
  payload: jsonb(),
});

beforeAll(async () => {
  const ddl = execFileSync(
    'pnpm',
    ['exec', 'drizzle-kit', 'export', '--config', 'tests/drizzle.e2e.config.ts'],
    { encoding: 'utf8' }
  );
  for (const table of ['users', 'groups']) {
    const statement = [...ddl.matchAll(/CREATE TABLE "([^"]+)" \([\s\S]*?\n\);/g)].find(
      (match) => match[1] === table
    )?.[0];
    if (!statement) throw new Error(`Missing ${table} schema`);
    await db.execute(sql.raw(statement));
  }
  await db.execute(
    sql`insert into groups (id, name, user_ids) values (${groupId}::uuid, 'Driver test', ARRAY[${userId}::uuid])`
  );
  await db.execute(
    sql`insert into users (id, clerk_id, name, email, group_id) values (${userId}::uuid, 'driver4-user', 'Test', 'driver4@example.test', ${groupId}::uuid)`
  );
});
afterAll(async () => {
  await db.execute(sql`drop table users, groups cascade`);
  await db.$client.end();
});

it('resolves users concurrently and encodes UUID array overlap as one parameter', async () => {
  const results = await Promise.all(
    Array.from({ length: 30 }, () => UsersRepository.findByClerkId('driver4-user'))
  );
  expect(results.every((row) => row?.id === userId)).toBe(true);
  expect((await GroupsRepository.getByUserIds([userId])).map((row) => row.id)).toEqual([groupId]);
  expect(await GroupsRepository.getByUserIds([])).toEqual([]);
  expect(await GroupsRepository.getByUserIds(['33333333-3333-4333-8333-333333333333'])).toEqual([]);
});

it('round-trips dates, decimals, arrays and JSON through Drizzle with v4 inference', async () => {
  const client = createPostgresClient(url, { max: 1 });
  const database = drizzle(client);
  try {
    await database.transaction(async (tx) => {
      await tx.execute(
        sql`create temporary table driver4_values (id uuid primary key, day date, instant timestamptz, amount numeric(20,6), flag boolean, members uuid[], payload jsonb) on commit drop`
      );
      // A non-UTC session must not shift the financial date or the UTC instant.
      await tx.execute(sql`set local time zone 'Europe/Rome'`);
      const instant = new Date('2026-10-24T23:30:00.123Z');
      await tx.insert(values).values({
        id: userId,
        day: '2026-10-25',
        instant,
        amount: '123456789.123456',
        flag: true,
        members: [userId],
        payload: [],
      });
      const [row] = await tx.select().from(values).where(eq(values.id, userId));
      expect(row).toEqual({
        id: userId,
        day: '2026-10-25',
        instant,
        amount: '123456789.123456',
        flag: true,
        members: [userId],
        payload: [],
      });
      await tx
        .update(values)
        .set({ members: [], payload: { nested: [false, null, 'text'] }, flag: false })
        .where(eq(values.id, userId));
      const [updated] = await tx.select().from(values);
      expect(updated).toMatchObject({
        members: [],
        payload: { nested: [false, null, 'text'] },
        flag: false,
      });
    });
  } finally {
    await client.end({ timeout: 1 });
  }
});

it('cancels a statement in PostgreSQL, rolls back writes and reuses the connection', async () => {
  const client = createPostgresClient(url, { max: 1, connection: { statement_timeout: 60 } });
  try {
    await client`create temporary table driver4_rollback (value int)`;
    await expect(
      client.begin(async (tx) => {
        await tx`insert into driver4_rollback values (1)`;
        await tx`select pg_sleep(1)`;
      })
    ).rejects.toMatchObject({ code: '57014' });
    expect(await client`select * from driver4_rollback`).toHaveLength(0);
    expect((await client`select 1::integer as ok`)[0]?.ok).toBe(1);
  } finally {
    await client.end({ timeout: 1 });
  }
});

it('rejects queued work without sending it when the pool is occupied', async () => {
  const client = createPostgresClient(url, { max: 1, queue_timeout: 0.05 });
  const reserved = await client.reserve();
  try {
    await expect(client`select 1`).rejects.toMatchObject({ code: 'QUEUE_TIMEOUT' });
  } finally {
    reserved.release();
  }
  try {
    expect((await client`select 2::integer as ok`)[0]?.ok).toBe(2);
  } finally {
    await client.end({ timeout: 1 });
  }
});

it('does not amplify a real server statement timeout with another read', async () => {
  const client = createPostgresClient(url, { connection: { statement_timeout: 20 } });
  let attempts = 0;
  try {
    await expect(
      readWithRetry(() => {
        attempts++;
        return client`select pg_sleep(0.1)`;
      })
    ).rejects.toMatchObject({ code: '57014' });
    expect(attempts).toBe(1);
  } finally {
    await client.end({ timeout: 1 });
  }
});
