import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/drizzle';
import { createPostgresClient } from '@/server/db/postgres-client';
import { migrateDatabase } from '../../scripts/db/migrations.mjs';
import {
  executeFinancialOperation,
  readFinancialOperation,
} from '@/server/use-cases/shared/financial-operation';
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from '@/features/transactions/actions/transaction-actions';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { RecurringRepository } from '@/server/repositories/recurring.repository';
import { PortfolioSnapshotRepository } from '@/server/repositories/portfolio-snapshot.repository';
import { updateAccountUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { BudgetsRepository } from '@/server/repositories/budgets.repository';
import { financialTransaction } from '@/server/repositories/db-executor';
import { GroupsRepository } from '@/server/repositories/groups.repository';
import { createTransactionUseCase } from '@/server/use-cases/transactions/create-transaction.use-case';
import { recalculateAccountBalanceUseCase } from '@/server/use-cases/accounts/account.use-cases';
import type { User } from '@/lib/types';
import type { Account } from '@/lib/types';
import { transactionVisibilityPredicate } from '@/server/ledger/visibility-predicate';
import { transactionInvolvesUser } from '@/server/ledger';
import { RecentActivityRepository } from '@/server/repositories/recent-activity.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';

const session = vi.hoisted(() => ({ actor: null as User | null }));
const cache = vi.hoisted(() => ({ invalidate: vi.fn() }));
vi.mock('@/lib/auth/cached-auth', () => ({ getCurrentUser: vi.fn(async () => session.actor) }));
vi.mock('next/cache', () => ({
  revalidateTag: cache.invalidate,
  unstable_cache: (fn: unknown) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

const client = createPostgresClient(process.env.DATABASE_URL!, { max: 1, onnotice: () => {} });
const group = randomUUID();
const foreignGroup = randomUUID();
const actorId = randomUUID();
const otherId = randomUUID();
const account = randomUUID();
const destination = randomUUID();
const actor = {
  id: actorId,
  group_id: group,
  role: 'admin',
  name: 'Synthetic',
  email: 'synthetic@example.test',
  clerk_id: 'synthetic',
} as User;

it('rolls back budget mutations with their owning transaction', async () => {
  const budget = await BudgetsRepository.create(
    {
      description: 'Rollback',
      amount: '10.00',
      categories: ['synthetic_food'],
      user_id: actorId,
      group_id: group,
    },
    db
  );
  await expect(
    financialTransaction(async (tx) => {
      await BudgetsRepository.update(budget.id, { amount: '20.00' }, tx, { groupId: group });
      throw new Error('rollback');
    })
  ).rejects.toThrow('rollback');
  expect(Number((await BudgetsRepository.getById(budget.id))?.amount)).toBe(10);
  await expect(
    financialTransaction(async (tx) => {
      await BudgetsRepository.delete(budget.id, tx, { groupId: group });
      throw new Error('rollback');
    })
  ).rejects.toThrow('rollback');
  expect(await BudgetsRepository.getById(budget.id)).not.toBeNull();
});

it('rolls back account, recurring and portfolio writes with their owning transaction', async () => {
  const seriesId = randomUUID();
  await expect(
    financialTransaction(async (tx) => {
      await updateAccountUseCase(account, { name: 'Uncommitted' });
      await RecurringRepository.create(
        {
          id: seriesId,
          description: 'Synthetic',
          amount: '10.00',
          type: 'expense',
          category: 'synthetic_food',
          account_id: account,
          start_date: '2026-11-01',
          frequency: 'monthly',
          user_ids: [actorId],
        },
        tx
      );
      await PortfolioSnapshotRepository.upsertMany(
        [{ user_id: actorId, snapshot_date: '2026-11-01', value: '10.00' }],
        tx
      );
      throw new Error('rollback');
    })
  ).rejects.toThrow('rollback');
  expect((await AccountsRepository.findById(account))?.name).toBe('Source');
  expect(await RecurringRepository.findById(seriesId)).toBeNull();
  expect(await PortfolioSnapshotRepository.findByUserIds([actorId])).toEqual([]);
});
const input = () => ({
  description: 'Synthetic expense',
  amount: 0.01,
  type: 'expense' as const,
  category: 'synthetic_food',
  date: '2026-11-01',
  user_id: actorId,
  account_id: account,
  group_id: group,
});

beforeAll(async () => {
  vi.stubEnv('DB_DURABLE_OPERATIONS', 'true');
  vi.stubEnv('DB_RELATIONAL_READS', 'true');
  await client.begin(async (tx) => {
    await tx.unsafe(readFileSync('tests/integration/platform-prerequisites.sql', 'utf8'));
    await migrateDatabase(tx);
  });
});
beforeEach(async () => {
  cache.invalidate.mockReset();
  session.actor = actor;
  await client.unsafe(
    'TRUNCATE groups, users, orphan_users, market_data_cache, available_shares CASCADE'
  );
  await client`insert into groups(id,name,user_ids) values(${group},'Synthetic',ARRAY[]::uuid[]),(${foreignGroup},'Other',ARRAY[]::uuid[])`;
  await client`insert into users(id,group_id,role,name,email,clerk_id) values(${actorId},${group},'admin','Synthetic','a@example.test','synthetic'),(${otherId},${foreignGroup},'member','Other','b@example.test','other')`;
  await client`insert into accounts(id,name,type,group_id,user_ids,balance,liquidity) values(${account},'Source','payroll',${group},ARRAY[${actorId}]::uuid[],0,'spendable'),(${destination},'Destination','savings',${group},ARRAY[${actorId}]::uuid[],0,'reserve')`;
  await client`insert into categories(key,label,icon,color,group_id) values('synthetic_food','Synthetic','Circle','#000000',${group})`;
});
afterAll(async () => {
  session.actor = null;
  vi.unstubAllEnvs();
  await client.unsafe(
    'DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS wealth_pillar_migrations CASCADE; DROP ROLE anon; DROP ROLE authenticated; DROP ROLE service_role; DROP ROLE pool_user;'
  );
  await client.end();
  await db.$client.end();
});

it('persists one effect for concurrent submissions and replays the authoritative revision', async () => {
  const operation = randomUUID();
  const results = await Promise.all(
    Array.from({ length: 10 }, () => createTransactionAction(input(), operation))
  );
  expect(results.every((result) => !result.error)).toBe(true);
  expect(new Set(results.map((result) => result.data?.id)).size).toBe(1);
  expect(
    new Set(results.map((result) => result.data?.accountBalanceVersions?.[account])).size
  ).toBe(1);
  const [ledger] = await client`select count(*)::int as count from transactions`;
  const [balance] =
    await client`select balance::text as balance,balance_version::text as revision from accounts where id=${account}`;
  expect(ledger?.count).toBe(1);
  expect(balance).toMatchObject({ balance: '-0.01', revision: '1' });
  expect(await readFinancialOperation(actor, 'createTransactionAction', operation)).toMatchObject({
    status: 'committed',
    result: results[0],
  });
  expect((await createTransactionAction({ ...input(), amount: 1 }, operation)).error).toBeTruthy();
});

it('does not disclose a stored receipt after account visibility is revoked', async () => {
  const operationId = randomUUID();
  const created = await createTransactionAction(input(), operationId);
  expect(created.error).toBeNull();
  const replacement = randomUUID();
  await client`insert into users(id,group_id,role,name,email,clerk_id) values(${replacement},${group},'member','Replacement','replacement@example.test','replacement')`;
  await client`update accounts set user_ids=ARRAY[${replacement}]::uuid[] where id=${account}`;
  await client`update users set role='member' where id=${actorId}`;
  const member = { ...actor, role: 'member' } as User;
  await expect(
    readFinancialOperation(member, 'createTransactionAction', operationId)
  ).rejects.toThrow();
  session.actor = member;
  expect((await createTransactionAction(input(), operationId)).error).toBeTruthy();
  expect((await client`select count(*)::int as count from transactions`)[0]?.count).toBe(1);
});

it('preserves a committed success when invalidation fails and reconciles edits/deletes', async () => {
  cache.invalidate.mockImplementation(() => {
    throw new Error('cache offline');
  });
  const created = await createTransactionAction(input(), randomUUID());
  expect(created.error).toBeNull();
  expect(created.data).toBeTruthy();
  const edited = await updateTransactionAction(created.data!.id, { amount: 0.03 }, randomUUID());
  expect(edited.error).toBeNull();
  const deletionId = randomUUID();
  const removed = await deleteTransactionAction(created.data!.id, deletionId);
  expect(removed.error).toBeNull();
  expect(await deleteTransactionAction(created.data!.id, deletionId)).toEqual(removed);
  expect((await AccountsRepository.findById(account))?.balance).toBe('0.00');
});

it('rolls back the operation identity and ledger together on failure', async () => {
  const operationId = randomUUID();
  await expect(
    executeFinancialOperation({
      actor,
      kind: 'test.rollback',
      operationId,
      payload: input(),
      execute: async () => {
        await createTransactionUseCase(input());
        throw new Error('forced rollback');
      },
    })
  ).rejects.toThrow('forced rollback');
  expect(await readFinancialOperation(actor, 'test.rollback', operationId)).toEqual({
    status: 'unknown',
  });
  expect(await client`select id from transactions`).toHaveLength(0);
  expect((await AccountsRepository.findById(account))?.balance).toBe('0.00');
  expect(cache.invalidate).not.toHaveBeenCalled();
});

it('uses normalized associations and authoritative user membership', async () => {
  expect((await AccountsRepository.findByUser(actorId)).map((row) => row.id).sort()).toEqual(
    [account, destination].sort()
  );
  expect((await GroupsRepository.getByUserIds([actorId])).map((row) => row.id)).toEqual([group]);
  const budget = await BudgetsRepository.create(
    {
      description: 'Synthetic',
      amount: '10.00',
      categories: ['synthetic_food'],
      user_id: actorId,
      group_id: group,
    },
    db
  );
  expect((await BudgetsRepository.getById(budget.id))?.categories).toEqual(['synthetic_food']);
  await expect(
    client`update accounts set user_ids=ARRAY[${otherId}]::uuid[] where id=${account}`
  ).rejects.toMatchObject({ code: '23503' });
  await expect(
    client`update users set group_id=${foreignGroup} where id=${actorId}`
  ).rejects.toMatchObject({ code: '23503' });
  await client`select verify_association_backfill()`;
});

it('keeps the legacy group membership usable across concurrent joins, moves and deletion', async () => {
  const ids = [randomUUID(), randomUUID()] as const;
  const concurrent = createPostgresClient(process.env.DATABASE_URL!, {
    max: 2,
    onnotice: () => {},
  });
  try {
    await Promise.all(
      ids.map(
        (id) => concurrent`insert into users(id,group_id,role,name,email,clerk_id)
      values(${id},${group},'member','Synthetic',${`${id}@example.test`},${id})`
      )
    );
    let [legacy] = await client`select user_ids from groups where id=${group}`;
    expect(new Set(legacy?.user_ids)).toEqual(new Set([actorId, ...ids]));
    await client`update users set group_id=${foreignGroup} where id=${ids[0]}`;
    await client`delete from users where id=${ids[1]}`;
    [legacy] = await client`select user_ids from groups where id=${group}`;
    expect(legacy?.user_ids).toEqual([actorId]);
    const [other] = await client`select user_ids from groups where id=${foreignGroup}`;
    expect(new Set(other?.user_ids)).toEqual(new Set([otherId, ids[0]]));
  } finally {
    await concurrent.end();
  }
});

it('refuses cross-group and revoked authorization and keeps lookup isolated', async () => {
  const operationId = randomUUID();
  const created = await createTransactionAction(input(), operationId);
  expect(created.error).toBeNull();
  const foreignActor = { ...actor, id: otherId, group_id: foreignGroup, role: 'member' as const };
  expect(
    await readFinancialOperation(foreignActor, 'createTransactionAction', operationId)
  ).toEqual({ status: 'unknown' });
  session.actor = foreignActor;
  expect((await createTransactionAction(input(), randomUUID())).error).toBeTruthy();
  await client`update users set role='member' where id=${actorId}`;
  session.actor = actor;
  expect((await createTransactionAction(input(), randomUUID())).error).toBeTruthy();
});

it('recalculates the complete exact ledger under the account lock', async () => {
  await Promise.all(
    Array.from({ length: 10 }, () => createTransactionAction(input(), randomUUID()))
  );
  await client`update accounts set balance='99.99' where id=${account}`;
  const result = await recalculateAccountBalanceUseCase(account);
  expect(result.balance).toBe(-0.1);
  expect((await client`select sum(amount)::text as total from transactions`)[0]?.total).toBe(
    '0.10'
  );
  const [state] = await db.execute(
    sql`select balance::text as balance from accounts where id=${account}::uuid`
  );
  expect(state?.balance).toBe('-0.10');
});

it('matches activity SQL to the domain for all shared, ownerless and transfer combinations', async () => {
  const members = [actorId, randomUUID()];
  const accounts = ([[], [members[0]], [members[1]], members] as string[][]).flatMap((userIds) =>
    ['spendable', 'reserve'].map(
      (liquidity) =>
        ({ id: randomUUID(), user_ids: userIds, liquidity, type: 'payroll' }) as Account
    )
  );
  const rows = accounts.flatMap((source) =>
    accounts
      .filter((destination) => destination.id !== source.id)
      .flatMap((destination) =>
        [null, ...members].flatMap((userId) =>
          [0, 1].map((amount) => ({
            key: randomUUID(),
            account_id: source.id,
            to_account_id: destination.id,
            type: 'transfer' as const,
            user_id: userId,
            amount,
            category: 'synthetic_food',
            date: '2026-11-01',
          }))
        )
      )
  );
  const accountScope = accounts.map((account) => ({
    ...account,
    spendable: resolveAccountLiquidity(account) === 'spendable',
  }));
  const result = await db.execute<{ key: string; user_id: string; visible: boolean | null }>(sql`
    with account_scope as(select * from jsonb_to_recordset(${JSON.stringify(accountScope)}::jsonb) as a(id uuid,user_ids uuid[],spendable boolean)),
    entries as(select * from jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) as r(key text,account_id uuid,to_account_id uuid,type text,user_id uuid,amount numeric))
    select t.key,scope.user_id,${transactionVisibilityPredicate(sql`scope.user_id`)} as visible
    from entries t cross join jsonb_array_elements_text(${JSON.stringify(members)}::jsonb) member
    cross join lateral(select member.value::uuid as user_id) scope
    left join account_scope source on source.id=t.account_id left join account_scope destination on destination.id=t.to_account_id
  `);
  const expected = new Map<string, import('@/server/ledger/aggregate').LedgerEntry>(
    rows.map((row) => [row.key, row])
  );
  for (const row of result)
    expect(Boolean(row.visible)).toBe(
      transactionInvolvesUser(expected.get(row.key)!, row.user_id, accounts)
    );
});

it('returns bounded activity and keyset pages across null and microsecond timestamps', async () => {
  await expect(TransactionsRepository.getByGroup(group, { offset: 1 })).rejects.toThrow(
    'Offset pagination requires an explicit total'
  );
  await client`insert into transactions(description,amount,type,category,date,account_id,user_id,group_id,created_at)
    select 'Synthetic page',0.01,'expense','synthetic_food','2026-11-01',${account},${actorId},${group},
      case when n>70 then null else '2026-11-01 12:00:00+00'::timestamptz+n*interval '1 microsecond' end from generate_series(1,130) n`;
  const accounts = await AccountsRepository.findByGroup(group);
  const recent = await RecentActivityRepository.byGroupScopes(group, [actorId], accounts);
  expect(recent.all).toHaveLength(3);
  expect(recent.byUserId[actorId]).toHaveLength(3);
  const ids = new Set<string>();
  let cursor:
    import('@/server/repositories/transactions.repository').TransactionCursorAfter | undefined;
  let pages = 0;
  do {
    const page = await TransactionsRepository.getByGroup(group, {
      ...(cursor ? { cursorAfter: cursor } : {}),
      limit: 50,
      countTotal: true,
    });
    expect(page.total).toBe(130);
    expect(page.data.length).toBeLessThanOrEqual(50);
    for (const row of page.data) {
      expect(ids.has(row.id)).toBe(false);
      ids.add(row.id);
    }
    pages++;
    if (!page.hasMore) break;
    const last = page.data.at(-1)!;
    cursor = { date: last.date, createdAt: last.created_at, id: last.id };
  } while (pages < 10);
  expect(ids.size).toBe(130);
  expect(pages).toBe(3);
});

it('removes a group without leaving financial references or stale membership', async () => {
  expect((await createTransactionAction(input(), randomUUID())).error).toBeNull();
  await client`delete from groups where id=${group}`;
  expect(await client`select id from accounts where group_id=${group}`).toHaveLength(0);
  expect(await client`select id from transactions where group_id=${group}`).toHaveLength(0);
  expect((await client`select group_id from users where id=${actorId}`)[0]?.group_id).toBeNull();
});

it('rejects a category owned by another group at the database boundary', async () => {
  await client`insert into categories(key,label,icon,color,group_id) values('foreign_food','Synthetic','Circle','#000000',${foreignGroup})`;
  expect(
    (await createTransactionAction({ ...input(), category: 'foreign_food' }, randomUUID())).error
  ).toBeTruthy();
  expect(await client`select id from transactions`).toHaveLength(0);
});
