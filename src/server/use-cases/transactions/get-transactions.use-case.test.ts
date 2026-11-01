import { beforeEach, expect, it, vi } from 'vitest';
import {
  getTransactionByIdUseCase,
  getTransactionsByUserUseCase,
} from './get-transactions.use-case';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';

const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock('@/lib/cache', () => ({
  cached: (fn: () => Promise<unknown>, key: string[]) => async () => {
    const id = JSON.stringify(key);
    if (!cache.has(id)) cache.set(id, await fn());
    return cache.get(id);
  },
}));
vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/server/repositories/transactions.repository', () => ({
  TransactionsRepository: { getById: vi.fn(), getByUser: vi.fn() },
}));

beforeEach(() => {
  cache.clear();
  vi.clearAllMocks();
});
it('does not reuse an administrator’s cached transaction for a different member', async () => {
  vi.mocked(TransactionsRepository.getById).mockImplementation(async (_id, scope) => {
    if (scope?.userId && scope.userId !== 'owner') return null;
    return { id: 'tx', user_id: 'owner', group_id: 'group', amount: '10' } as NonNullable<
      Awaited<ReturnType<typeof TransactionsRepository.getById>>
    >;
  });
  expect((await getTransactionByIdUseCase('tx', { groupId: 'group' })).user_id).toBe('owner');
  await expect(
    getTransactionByIdUseCase('tx', { groupId: 'group', userId: 'other' })
  ).rejects.toThrow('not found');
  expect(
    (await getTransactionByIdUseCase('tx', { groupId: 'group', userId: 'owner' })).user_id
  ).toBe('owner');
});
it('does not reuse an expense-only ledger for an income query', async () => {
  vi.mocked(TransactionsRepository.getByUser).mockResolvedValue({ data: [], total: 0 });
  await getTransactionsByUserUseCase('owner', { type: 'expense' });
  await getTransactionsByUserUseCase('owner', { type: 'income' });
  expect(TransactionsRepository.getByUser).toHaveBeenCalledTimes(2);
});
