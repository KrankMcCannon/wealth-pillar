import { describe, expect, it } from 'vitest';
import { appliedQueryToListQuery, buildTransactionsQueryString } from './transactions-query';
import type { AppliedTransactionsQuery } from '@/server/use-cases/pages/transactions-page.use-case';

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
