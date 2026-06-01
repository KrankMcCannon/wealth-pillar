import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invalidateTransactionCaches, invalidateTransactionUpdateCaches } from './cache-utils';
import { revalidateTag } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe('invalidateTransactionCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
  });

  it('invalidates account entity tag and group accounts tag', () => {
    invalidateTransactionCaches({
      groupId: 'g1',
      accountId: 'a1',
      userId: 'u1',
      toAccountId: 'a2',
    });

    const tags = vi.mocked(revalidateTag).mock.calls.map((c) => c[0]);
    expect(tags).toContain('account:a1');
    expect(tags).toContain('account:a2');
    expect(tags).toContain('group:g1:accounts');
    expect(tags).toContain('group:g1:budgets');
  });
});

describe('invalidateTransactionUpdateCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
  });

  it('invalidates per-account tags and group accounts on update', () => {
    invalidateTransactionUpdateCaches(
      {
        userId: 'u1',
        accountId: 'a1',
        toAccountId: 'a2',
        groupId: 'g1',
      },
      { accountId: 'a3' }
    );

    const tags = vi.mocked(revalidateTag).mock.calls.map((c) => c[0]);
    expect(tags).toContain('account:a1');
    expect(tags).toContain('account:a2');
    expect(tags).toContain('account:a3');
    expect(tags).toContain('group:g1:accounts');
  });
});
