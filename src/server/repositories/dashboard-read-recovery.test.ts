import { beforeEach, describe, expect, it, vi } from 'vitest';
import { transactionContext } from '@/server/db/transaction-context';
import type { DbExecutor } from './db-executor';

const mocks = vi.hoisted(() => ({ resolveDb: vi.fn(), execute: vi.fn() }));
vi.mock('./db-executor', () => ({ resolveDb: mocks.resolveDb }));

import { GroupsRepository } from './groups.repository';
import { UsersRepository } from './users.repository';
import { BudgetsRepository } from './budgets.repository';
import { BudgetPeriodsRepository } from './budget-periods.repository';
import { RecurringRepository } from './recurring.repository';
import { TransactionsRepository } from './transactions.repository';
import { RecentActivityRepository } from './recent-activity.repository';

const groupId = '00000000-0000-0000-0000-000000000001';
const userId = '00000000-0000-0000-0000-000000000002';
const reads = [
  { name: 'group context', read: () => GroupsRepository.getById(groupId) },
  { name: 'members', read: () => UsersRepository.findByGroupId(groupId) },
  { name: 'budgets', read: () => BudgetsRepository.getByGroup(groupId) },
  { name: 'active periods', read: () => BudgetPeriodsRepository.findActiveByUserIds([userId]) },
  { name: 'recurring series', read: () => RecurringRepository.findByUserIds([userId], groupId) },
  { name: 'complete ledger totals', read: () => TransactionsRepository.aggregateByGroup(groupId) },
  {
    name: 'recent activity',
    read: () => RecentActivityRepository.byGroupScopes(groupId, [userId], []),
  },
];

let database: DbExecutor;
beforeEach(() => {
  mocks.execute.mockReset();
  // Like a driver query, each builder executes once. Recovery must build a fresh query.
  const createBuilder = () => {
    let result: Promise<never[]> | undefined;
    const query = {
      then: (resolve: (rows: never[]) => unknown, reject: (error: unknown) => unknown) =>
        (result ??= mocks.execute()).then(resolve, reject),
      as: () => ({}),
    };
    const builder = new Proxy(query, {
      get(target, key) {
        return key in target ? Reflect.get(target, key) : () => builder;
      },
    });
    return builder;
  };
  database = {
    select: createBuilder,
    execute: createBuilder,
    $with: createBuilder,
    with: () => ({ select: createBuilder }),
  } as unknown as DbExecutor;
  mocks.resolveDb.mockReturnValue(database);
});

describe.each(reads)('dashboard read recovery: $name', ({ read }) => {
  it('recovers one dropped connection with a fresh read', async () => {
    const failure = new Error('query failed', {
      cause: Object.assign(new Error('connection closed'), { code: 'CONNECTION_CLOSED' }),
    });
    mocks.execute.mockRejectedValueOnce(failure).mockResolvedValueOnce([]);
    await expect(read()).resolves.toBeDefined();
    expect(mocks.execute).toHaveBeenCalledTimes(2);
  });

  it.each(['42501', '42P01', '57014', 'QUEUE_TIMEOUT'])(
    'propagates permanent failures and saturation without retry or empty data (%s)',
    async (code) => {
      const failure = Object.assign(new Error('read failed'), { code });
      mocks.execute.mockRejectedValue(failure);
      await expect(read()).rejects.toBe(failure);
      expect(mocks.execute).toHaveBeenCalledTimes(1);
    }
  );

  it('does not replay a read inside a financial transaction', async () => {
    const failure = Object.assign(new Error('connection closed'), { code: 'CONNECTION_CLOSED' });
    mocks.execute.mockRejectedValue(failure);
    await expect(
      transactionContext.run(
        { executor: database, afterCommit: new Map() },
        async () => await read()
      )
    ).rejects.toBe(failure);
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });
});

it('does not replay an aggregate read with an explicit financial executor', async () => {
  const failure = Object.assign(new Error('connection closed'), { code: 'CONNECTION_CLOSED' });
  mocks.execute.mockRejectedValue(failure);
  await expect(TransactionsRepository.aggregateByGroup(groupId, {}, database)).rejects.toBe(
    failure
  );
  expect(mocks.execute).toHaveBeenCalledTimes(1);
});
