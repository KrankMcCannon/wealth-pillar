import { describe, expect, it } from 'vitest';
import {
  appliedQueryToListQuery,
  buildTransactionsQueryString,
  matchesAppliedQuery,
} from './transactions-query';
import type { AppliedTransactionsQuery } from '@/server/use-cases/pages/transactions-page.use-case';
import type { Transaction } from '@/lib/types';

describe('appliedQueryToListQuery', () => {
  it('maps applied filters and debounced search to list query', () => {
    const applied: AppliedTransactionsQuery = {
      type: 'expense',
      dateRange: 'month',
      user: 'u1',
      account: 'acc-1',
    };
    const query = appliedQueryToListQuery(applied, '  pizza  ');
    expect(query).toEqual({
      type: 'expense',
      dateRange: 'month',
      user: 'u1',
      account: 'acc-1',
      q: 'pizza',
    });
  });

  it('omits empty search from query', () => {
    const applied: AppliedTransactionsQuery = { type: 'all', dateRange: 'all' };
    const query = appliedQueryToListQuery(applied, '   ');
    expect(query.q).toBeUndefined();
  });
});

describe('buildTransactionsQueryString', () => {
  it('serializes filter state without page params', () => {
    const qs = buildTransactionsQueryString(
      {
        searchQuery: 'caffè',
        type: 'expense',
        dateRange: 'month',
        categoryKey: 'all',
        accountId: 'acc-1',
      },
      'user-1'
    );
    expect(qs).toContain('user=user-1');
    expect(qs).toMatch(/q=caff/);
    expect(qs).not.toContain('page=');
    expect(qs).not.toContain('pageSize=');
  });
});

describe('matchesAppliedQuery', () => {
  const transaction: Transaction = {
    id: 'tx-1',
    description: 'Pizza night',
    amount: 20,
    type: 'expense',
    category: 'food',
    date: '2024-06-01',
    user_id: 'u1',
    account_id: 'acc-1',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-01T10:00:00Z',
  };

  it('matches user, type, and account filters', () => {
    const applied: AppliedTransactionsQuery = {
      user: 'u1',
      type: 'expense',
      dateRange: 'all',
      account: 'acc-1',
    };

    expect(matchesAppliedQuery(transaction, applied, '')).toBe(true);
    expect(matchesAppliedQuery(transaction, applied, 'pizza')).toBe(true);
    expect(matchesAppliedQuery({ ...transaction, user_id: 'u2' }, applied, '')).toBe(false);
    expect(matchesAppliedQuery({ ...transaction, type: 'income' }, applied, '')).toBe(false);
  });
});
