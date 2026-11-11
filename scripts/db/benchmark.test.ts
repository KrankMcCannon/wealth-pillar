import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { AsyncLocalStorage } from 'node:async_hooks';
import { channel, subscribe, unsubscribe } from 'node:diagnostics_channel';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { db } from '@/server/db/drizzle';
import { createPostgresClient } from '@/server/db/postgres-client';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import { RecentActivityRepository } from '@/server/repositories/recent-activity.repository';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { createTransactionUseCase } from '@/server/use-cases/transactions/create-transaction.use-case';
import { executeFinancialOperation } from '@/server/use-cases/shared/financial-operation';
import { migrateDatabase } from './migrations.mjs';
import type { User } from '@/lib/types';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));
const admin = createPostgresClient(process.env.DATABASE_URL!, {
  max: 1,
  onnotice: () => {},
  connection: { statement_timeout: 0, transaction_timeout: 0 },
});
const group = randomUUID();
const users = Array.from({ length: 10 }, () => randomUUID());
const accounts = Array.from({ length: 20 }, () => randomUUID());
const actor = { id: users[0]!, group_id: group, role: 'admin' } as User;
const scope = new AsyncLocalStorage<{ queries: number }>();
const query = () => {
  const state = scope.getStore();
  if (state) state.queries++;
};
type Measurement = {
  rows: number;
  concurrency: number;
  operation: string;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  maxMs: number;
  queriesMin: number;
  queriesMax: number;
  errors: number;
  maxConnections: number;
  maxWaiting: number;
  poolRetirements: number;
};
const measurements: Measurement[] = [];
const pool = { maxConnections: 0, maxWaiting: 0, retirements: 0 };
const poolEvent = (message: unknown) => {
  const event = message as { event: string; stats: { connections: number; waiting: number } };
  pool.maxConnections = Math.max(pool.maxConnections, event.stats.connections);
  pool.maxWaiting = Math.max(pool.maxWaiting, event.stats.waiting);
  if (event.event === 'close') pool.retirements++;
};
let owns = false;
beforeAll(async () => {
  vi.stubEnv('DB_DURABLE_OPERATIONS', 'true');
  vi.stubEnv('DB_RELATIONAL_READS', 'true');
  const [existing] =
    await admin`select count(*)::int as count from pg_tables where schemaname='public'`;
  if (existing?.count) throw new Error('Benchmark requires an empty isolated test database');
  await admin.begin(async (tx) => {
    await tx.unsafe(readFileSync('tests/integration/platform-prerequisites.sql', 'utf8'));
    await migrateDatabase(tx);
  });
  owns = true;
  await admin`insert into groups(id,name,user_ids) values(${group},'Synthetic benchmark',ARRAY[]::uuid[])`;
  for (let i = 0; i < users.length; i++)
    await admin`insert into users(id,group_id,role,name,email,clerk_id) values(${users[i]!},${group},'admin','Synthetic',${`synthetic-${i}@example.test`},${`synthetic-${i}`})`;
  for (let i = 0; i < accounts.length; i++)
    await admin`insert into accounts(id,group_id,name,type,liquidity,user_ids,balance) values(${accounts[i]!},${group},'Synthetic','payroll',${i < 10 ? 'spendable' : 'reserve'},ARRAY[${users[i % 10]!}]::uuid[],0)`;
  await admin`insert into categories(key,label,icon,color,group_id) values('synthetic_food','Synthetic','Circle','#000000',${group})`;
  for (const user of users)
    await admin`insert into budget_periods(user_id,start_date,is_active) values(${user},current_date-30,true)`;
  subscribe('tracing:postgres:query:start', query);
  channel('postgres:pool').subscribe(poolEvent);
});
afterAll(async () => {
  channel('postgres:pool').unsubscribe(poolEvent);
  unsubscribe('tracing:postgres:query:start', query);
  vi.unstubAllEnvs();
  if (owns)
    await admin.unsafe(
      'DROP SCHEMA public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS auth CASCADE; DROP SCHEMA IF EXISTS extensions CASCADE; DROP SCHEMA IF EXISTS wealth_pillar_migrations CASCADE; DROP ROLE anon; DROP ROLE authenticated; DROP ROLE service_role; DROP ROLE pool_user;'
    );
  await admin.end();
  await db.$client.end();
});

async function measure(
  rows: number,
  concurrency: number,
  operation: string,
  work: () => Promise<unknown>
) {
  pool.maxConnections = 0;
  pool.maxWaiting = 0;
  pool.retirements = 0;
  await work(); // warm query plans/connections; excluded from percentiles
  const samples: { ms: number; queries: number }[] = [];
  let errors = 0;
  let next = 0;
  const count = Math.max(20, concurrency * 2);
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (next++ < count) {
        const state = { queries: 0 };
        const start = performance.now();
        await scope.run(state, async () => {
          try {
            await work();
          } catch {
            errors++;
          }
        });
        samples.push({ ms: performance.now() - start, queries: state.queries });
      }
    })
  );
  const times = samples.map((x) => x.ms).sort((a, b) => a - b);
  const at = (p: number) =>
    Math.round(times[Math.min(times.length - 1, Math.ceil(times.length * p) - 1)]! * 100) / 100;
  const result = {
    rows,
    concurrency,
    operation,
    p50Ms: at(0.5),
    p95Ms: at(0.95),
    p99Ms: at(0.99),
    maxMs: at(1),
    queriesMin: Math.min(...samples.map((x) => x.queries)),
    queriesMax: Math.max(...samples.map((x) => x.queries)),
    errors,
    maxConnections: pool.maxConnections,
    maxWaiting: pool.maxWaiting,
    poolRetirements: pool.retirements,
  };
  measurements.push(result);
  process.stdout.write(JSON.stringify(result) + '\n');
  expect(errors).toBe(0);
}

it('measures the synthetic load matrix and reconciles every account against the ledger', async () => {
  const sizes = (process.env.WP_BENCHMARK_SIZES ?? '10000,100000,1000000').split(',').map(Number);
  const levels = (process.env.WP_BENCHMARK_CONCURRENCY ?? '1,5,10,25,50').split(',').map(Number);
  for (const rows of sizes) {
    if (![10000, 100000, 1000000].includes(rows)) throw new Error('Unsupported benchmark size');
    await admin`truncate transactions,financial_operations cascade`;
    // Only synthetic rows; retain FK/check enforcement. Avoid legacy presentation triggers during bulk fixture setup.
    await admin`alter table transactions disable trigger user`;
    try {
      await admin`insert into transactions(id,description,amount,type,category,date,account_id,to_account_id,user_id,group_id,created_at)
      select gen_random_uuid(),'Synthetic',0.01,case when n%10=0 then 'transfer' else 'expense' end,'synthetic_food',current_date-(n%365)::int,
        (array(select value::uuid from jsonb_array_elements_text(${admin.json(accounts)}::jsonb)))[(n%10+1)::int],
        case when n%10=0 then (array(select value::uuid from jsonb_array_elements_text(${admin.json(accounts)}::jsonb)))[(n%10+11)::int] else null end,
        (array(select value::uuid from jsonb_array_elements_text(${admin.json(users)}::jsonb)))[(n%10+1)::int],${group}::uuid,
        now()-n*interval '1 microsecond' from generate_series(1,${rows}::int) n`;
    } finally {
      await admin`alter table transactions enable trigger user`;
    }
    await admin`update accounts a set balance=coalesce((select sum(case when t.account_id=a.id then -t.amount else t.amount end) from transactions t where t.account_id=a.id or(t.type='transfer' and t.to_account_id=a.id)),0) where a.group_id=${group}`;
    await admin`analyze transactions`;
    const accountRows = await AccountsRepository.findByGroup(group);
    for (const concurrency of levels) {
      await measure(rows, concurrency, 'recentActivity', () =>
        RecentActivityRepository.byGroupScopes(group, users, accountRows)
      );
      await measure(rows, concurrency, 'periodsBatch', () =>
        BudgetPeriodsRepository.findByUserIds(users)
      );
      await measure(rows, concurrency, 'ledgerPage', () =>
        TransactionsRepository.getByGroup(group, { limit: 50 })
      );
      const mutationIds = new Set<string>();
      await measure(rows, concurrency, 'ordinaryMutation', () => {
        const operationId = randomUUID();
        mutationIds.add(operationId);
        return executeFinancialOperation({
          actor,
          kind: 'benchmark.create',
          operationId,
          payload: { amount: '0.01' },
          execute: () =>
            createTransactionUseCase({
              description: 'Synthetic',
              amount: 0.01,
              type: 'expense',
              category: 'synthetic_food',
              date: new Date().toISOString().slice(0, 10),
              account_id: accounts[0]!,
              user_id: users[0]!,
              group_id: group,
            }),
        });
      });
      const ids = [...mutationIds];
      const receipts = await admin`
        select count(*)::int as total,
          count(*) filter (where committed_at is null)::int as unknown
        from financial_operations where group_id=${group} and kind='benchmark.create'
          and operation_id = any(${ids}::uuid[])
      `;
      const actual = await admin`
        select count(*)::int as total, count(distinct id)::int as distinct
        from transactions where group_id=${group} and description='Synthetic'
          and id in (select (result->>'id')::uuid from financial_operations
            where group_id=${group} and kind='benchmark.create' and operation_id=any(${ids}::uuid[])
              and result ? 'id')
      `;
      expect(receipts[0]?.total).toBe(ids.length);
      expect(receipts[0]?.unknown).toBe(0);
      expect(actual[0]?.total).toBe(ids.length);
      expect(actual[0]?.distinct).toBe(ids.length);
    }
    const mismatch =
      await admin`select count(*)::int as count from accounts a where a.group_id=${group} and a.balance is distinct from coalesce((select sum(case when t.account_id=a.id then case when t.type='income' then t.amount else -t.amount end else t.amount end) from transactions t where t.account_id=a.id or(t.type='transfer' and t.to_account_id=a.id)),0)`;
    expect(mismatch[0]?.count).toBe(0);
    const plans = await admin.unsafe(
      `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM transactions WHERE group_id='${group}' ORDER BY date DESC,created_at DESC NULLS LAST,id DESC LIMIT 50`
    );
    mkdirSync('output/database', { recursive: true });
    writeFileSync(`output/database/explain-${rows}.json`, JSON.stringify(plans, null, 2) + '\n');
    writeFileSync(
      'output/database/benchmark.json',
      JSON.stringify(
        {
          environment: 'isolated local PostgreSQL 17; database workloads, not hosted HTTP latency',
          generatedAt: new Date().toISOString(),
          measurements,
        },
        null,
        2
      ) + '\n'
    );
  }
});
