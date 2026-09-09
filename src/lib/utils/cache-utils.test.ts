import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  invalidateInvestmentCaches,
  invalidateTransactionCaches,
  invalidateTransactionUpdateCaches,
} from './cache-utils';
import { revalidatePath, revalidateTag } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

describe('invalidateTransactionCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('invalidates tags without revalidatePath or refresh', () => {
    invalidateTransactionCaches({
      groupId: 'g1',
      accountId: 'a1',
      userId: 'u1',
      toAccountId: 'a2',
      transactionId: 't1',
    });

    const tags = vi.mocked(revalidateTag).mock.calls.map((c) => c[0]);
    expect(tags).toContain('account:a1');
    expect(tags).toContain('account:a2');
    expect(tags).toContain('group:g1:accounts');
    expect(tags).toContain('group:g1:budgets');
    expect(tags).toContain('transaction:t1');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateTransactionUpdateCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('invalidates per-account tags and group accounts on update', () => {
    invalidateTransactionUpdateCaches(
      {
        userId: 'u1',
        accountId: 'a1',
        toAccountId: 'a2',
        groupId: 'g1',
        id: 't1',
      },
      { accountId: 'a3' }
    );

    const tags = vi.mocked(revalidateTag).mock.calls.map((c) => c[0]);
    expect(tags).toContain('account:a1');
    expect(tags).toContain('account:a2');
    expect(tags).toContain('account:a3');
    expect(tags).toContain('group:g1:accounts');
    expect(tags).toContain('transaction:t1');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateInvestmentCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('invalidates investment tags without revalidatePath', () => {
    invalidateInvestmentCaches({ groupId: 'g1', userId: 'u1' });

    const tags = vi.mocked(revalidateTag).mock.calls.map((c) => c[0]);
    expect(tags).toContain('group:g1:investments');
    expect(tags).toContain('user:u1:investments');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
