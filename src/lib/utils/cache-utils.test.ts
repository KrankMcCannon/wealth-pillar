import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  invalidateBudgetPeriodCaches,
  invalidateRecurringCaches,
  invalidateInvestmentCaches,
  invalidateTransactionCaches,
  invalidateTransactionUpdateCaches,
} from './cache-utils';
import { revalidatePath, revalidateTag, updateTag } from 'next/cache';

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

describe('invalidateTransactionCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(updateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('expires balances, transactions and budgets before the next read', () => {
    invalidateTransactionCaches({
      groupId: 'g1',
      accountId: 'a1',
      userId: 'u1',
      toAccountId: 'a2',
      transactionId: 't1',
    });

    const expiredTags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);
    expect(updateTag).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(revalidateTag)
        .mock.calls.every(([, profile]) => typeof profile === 'object' && profile.expire === 0)
    ).toBe(true);

    // Balance reads are correctness-critical and must be immediately expired.
    expect(expiredTags).not.toContain('accounts');
    expect(expiredTags).toContain('account:a1');
    expect(expiredTags).toContain('account:a2');
    expect(expiredTags).toContain('group:g1:accounts');

    // The next financial read must include the committed mutation.
    expect(expiredTags).not.toContain('transactions');
    expect(expiredTags).toContain('account:a1:transactions');
    expect(expiredTags).toContain('account:a2:transactions');
    expect(expiredTags).toContain('group:g1:transactions');
    expect(expiredTags).toContain('group:g1:budgets');
    expect(expiredTags).toContain('transaction:t1');

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateTransactionUpdateCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(updateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('expires every affected account and derived financial total immediately', () => {
    invalidateTransactionUpdateCaches(
      {
        userId: 'u1',
        accountId: 'a1',
        toAccountId: 'a2',
        groupId: 'g1',
        id: 't1',
      },
      {
        accountId: 'a3',
      }
    );

    const expiredTags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);
    expect(updateTag).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(revalidateTag)
        .mock.calls.every(([, profile]) => typeof profile === 'object' && profile.expire === 0)
    ).toBe(true);

    // Old source, old destination and new source balances all changed.
    expect(expiredTags).not.toContain('accounts');
    expect(expiredTags).toContain('account:a1');
    expect(expiredTags).toContain('account:a2');
    expect(expiredTags).toContain('account:a3');
    expect(expiredTags).toContain('group:g1:accounts');

    expect(expiredTags).not.toContain('transactions');
    expect(expiredTags).toContain('account:a1:transactions');
    expect(expiredTags).toContain('account:a2:transactions');
    expect(expiredTags).toContain('account:a3:transactions');
    expect(expiredTags).toContain('transaction:t1');

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateInvestmentCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(updateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('invalidates investment tags without revalidatePath', () => {
    invalidateInvestmentCaches({
      groupId: 'g1',
      userId: 'u1',
    });

    const tags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);

    expect(tags).toContain('group:g1:investments');
    expect(tags).toContain('user:u1:investments');
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateBudgetPeriodCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(updateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('expires period tags immediately so the budgets page can refresh', () => {
    invalidateBudgetPeriodCaches({
      userId: 'u1',
      periodId: 'p1',
    });

    const tags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);

    expect(tags).toContain('user:u1:budget_periods');
    expect(tags).toContain('user:u1:budget_period:active');
    expect(tags).toContain('budget_period:p1');

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('recurring Dashboard invalidation', () => {
  beforeEach(() => vi.clearAllMocks());
  it('expires series and aggregate dependencies immediately, even without a resolved group', () => {
    invalidateRecurringCaches({ seriesId: 'r1', userIds: ['u1'], groupId: 'g1' });
    expect(revalidateTag).not.toHaveBeenCalledWith('recurring_series', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('user:u1:recurring', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('group:g1:recurring', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('recurring:r1', { expire: 0 });
    vi.clearAllMocks();
    invalidateRecurringCaches({ userIds: ['u1'] });
    expect(revalidateTag).not.toHaveBeenCalledWith('recurring_series', { expire: 0 });
    expect(revalidateTag).toHaveBeenCalledWith('user:u1:recurring', { expire: 0 });
    expect(updateTag).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(revalidateTag)
        .mock.calls.every(([, profile]) => typeof profile === 'object' && profile.expire === 0)
    ).toBe(true);
  });
});
