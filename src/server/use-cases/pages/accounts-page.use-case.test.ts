import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, User } from '@/lib/types';

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@/server/request-cache/services', () => ({ getAccountsByGroupDeduped: vi.fn() }));
vi.mock('./transactions-page.use-case', () => ({ getTransactionsListData: vi.fn() }));
vi.mock('@/server/db/telemetry', () => ({
  withDatabaseOperation: (_: string, operation: () => unknown) => operation(),
}));

import { getAccountsByGroupDeduped } from '@/server/request-cache/services';
import { getTransactionsListData } from './transactions-page.use-case';
import { getAccountDetailPageData } from './accounts-page.use-case';

const admin = { id: 'u1', role: 'admin', group_id: 'g1' } as User;
const ownAccount = {
  id: 'a1',
  name: 'Current',
  type: 'cash',
  balance: -20,
  group_id: 'g1',
  user_ids: ['u1'],
} as Account;
const otherAccount = { ...ownAccount, id: 'a2', user_ids: ['u2'] };

describe('getAccountDetailPageData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue([ownAccount, otherAccount]);
    vi.mocked(getTransactionsListData).mockResolvedValue({
      transactions: [],
      categories: [],
      accounts: [ownAccount],
      budgets: [],
      hasMore: false,
      appliedQuery: { type: 'all', dateRange: 'all' },
    });
  });

  it('checks membership and account visibility before loading transactions', async () => {
    await expect(getAccountDetailPageData('foreign', 'a1', admin)).rejects.toThrow('NOT_FOUND');
    expect(getAccountsByGroupDeduped).not.toHaveBeenCalled();
    await expect(
      getAccountDetailPageData('g1', 'a2', { ...admin, role: 'member' })
    ).rejects.toThrow('NOT_FOUND');
    await expect(getAccountDetailPageData('g1', 'missing', admin)).rejects.toThrow('NOT_FOUND');
    vi.mocked(getAccountsByGroupDeduped).mockResolvedValue([
      { ...ownAccount, group_id: 'foreign' },
    ]);
    await expect(getAccountDetailPageData('g1', 'a1', admin)).rejects.toThrow('NOT_FOUND');
    expect(getTransactionsListData).not.toHaveBeenCalled();
  });

  it('preserves the admin person context in the existing account ledger query', async () => {
    const detail = await getAccountDetailPageData('g1', 'a1', admin, 'u2');
    expect(detail.account).toEqual(ownAccount);
    expect(getTransactionsListData).toHaveBeenCalledWith(
      'g1',
      { account: 'a1', user: 'u2' },
      admin
    );
  });

  it('forces member scope even if a direct caller supplies another person', async () => {
    const member = { ...admin, role: 'member' } as User;
    const detail = await getAccountDetailPageData('g1', 'a1', member, 'u2');
    expect(detail.accounts.map((account) => account.id)).toEqual(['a1']);
    expect(getTransactionsListData).toHaveBeenCalledWith(
      'g1',
      { account: 'a1', user: 'u1' },
      member
    );
  });
});
