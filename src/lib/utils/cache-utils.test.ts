import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  invalidateBudgetPeriodCaches,
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

  it('expires account balance tags immediately and revalidates derived data', () => {
    invalidateTransactionCaches({
      groupId: 'g1',
      accountId: 'a1',
      userId: 'u1',
      toAccountId: 'a2',
      transactionId: 't1',
    });

    const expiredTags = vi.mocked(updateTag).mock.calls.map((call) => call[0]);
    const revalidatedTags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);

    // Balance reads are correctness-critical and must be immediately expired.
    expect(expiredTags).toContain('accounts');
    expect(expiredTags).toContain('account:a1');
    expect(expiredTags).toContain('account:a2');
    expect(expiredTags).toContain('group:g1:accounts');

    // Derived/list data may use stale-while-revalidate.
    expect(revalidatedTags).toContain('transactions');
    expect(revalidatedTags).toContain('account:a1:transactions');
    expect(revalidatedTags).toContain('account:a2:transactions');
    expect(revalidatedTags).toContain('group:g1:transactions');
    expect(revalidatedTags).toContain('group:g1:budgets');
    expect(revalidatedTags).toContain('transaction:t1');

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe('invalidateTransactionUpdateCaches', () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
    vi.mocked(updateTag).mockClear();
    vi.mocked(revalidatePath).mockClear();
  });

  it('expires every affected account immediately and revalidates transaction data', () => {
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

    const expiredTags = vi.mocked(updateTag).mock.calls.map((call) => call[0]);
    const revalidatedTags = vi.mocked(revalidateTag).mock.calls.map((call) => call[0]);

    // Old source, old destination and new source balances all changed.
    expect(expiredTags).toContain('accounts');
    expect(expiredTags).toContain('account:a1');
    expect(expiredTags).toContain('account:a2');
    expect(expiredTags).toContain('account:a3');
    expect(expiredTags).toContain('group:g1:accounts');

    expect(revalidatedTags).toContain('transactions');
    expect(revalidatedTags).toContain('account:a1:transactions');
    expect(revalidatedTags).toContain('account:a2:transactions');
    expect(revalidatedTags).toContain('account:a3:transactions');
    expect(revalidatedTags).toContain('transaction:t1');

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

    const tags = vi.mocked(updateTag).mock.calls.map((call) => call[0]);

    expect(tags).toContain('budget_periods');
    expect(tags).toContain('user:u1:budget_period:active');
    expect(tags).toContain('budget_period:p1');

    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
