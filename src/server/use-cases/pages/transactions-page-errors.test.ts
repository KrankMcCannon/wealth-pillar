import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@/lib/types';
import { getTransactionsListData } from './transactions-page.use-case';
import { getTransactionsByGroupUseCase } from '../transactions/get-transactions.use-case';
import {
  getAccountsByGroupDeduped,
  getAllCategoriesDeduped,
} from '@/server/request-cache/services';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('../transactions/get-transactions.use-case', () => ({
  getTransactionsByGroupUseCase: vi.fn(),
}));
vi.mock('@/server/request-cache/services', () => ({
  getAccountsByGroupDeduped: vi.fn(),
  getAllCategoriesDeduped: vi.fn(),
}));

const user = { id: 'u1', role: 'admin', group_id: 'g1' } as User;
describe('transaction page load failures', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getTransactionsByGroupUseCase).mockResolvedValue({
      data: [],
      total: 0,
      hasMore: false,
    });
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue([]);
    vi.mocked(getAllCategoriesDeduped).mockResolvedValue([]);
  });
  it('propagates ledger failures and can recover on a subsequent request', async () => {
    vi.mocked(getTransactionsByGroupUseCase).mockRejectedValueOnce(new Error('offline'));
    await expect(getTransactionsListData('g1', {}, user)).rejects.toThrow('offline');
    await expect(getTransactionsListData('g1', {}, user)).resolves.toMatchObject({
      transactions: [],
      hasMore: false,
    });
  });
  it('does not pretend missing account metadata is a successful empty response', async () => {
    vi.mocked(getAccountsByGroupDeduped).mockRejectedValueOnce(new Error('accounts unavailable'));
    await expect(getTransactionsListData('g1', {}, user)).rejects.toThrow('accounts unavailable');
  });
});
