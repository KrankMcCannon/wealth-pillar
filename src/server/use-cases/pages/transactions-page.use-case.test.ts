import { describe, expect, it } from 'vitest';
import type { User } from '@/lib/types';
import {
  buildAppliedQuery,
  buildTransactionRepositoryOptions,
  resolveDateRange,
  resolveTransactionsFilters,
  TRANSACTIONS_LIST_PAGE_SIZE,
} from './transactions-page.use-case';

const admin: User = {
  id: 'admin-1',
  role: 'admin',
  group_id: 'g1',
} as User;

const member: User = {
  id: 'member-1',
  role: 'member',
  group_id: 'g1',
} as User;

describe('resolveTransactionsFilters', () => {
  it('scopes members to their own user id', () => {
    const filters = resolveTransactionsFilters({ user: 'other-user' }, member);
    expect(filters.userId).toBe('member-1');
  });

  it('allows admin to filter by user query param', () => {
    const filters = resolveTransactionsFilters({ user: 'user-2' }, admin);
    expect(filters.userId).toBe('user-2');
  });

  it('parses comma-separated category keys', () => {
    const filters = resolveTransactionsFilters({ categories: 'food, transport ' }, admin);
    expect(filters.categoryKeys).toEqual(['food', 'transport']);
  });

  it('maps custom date range from query strings', () => {
    const range = resolveDateRange({
      dateRange: 'custom',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    });
    expect(range.startDate).toBeInstanceOf(Date);
    expect(range.endDate).toBeInstanceOf(Date);
  });
});

describe('buildAppliedQuery', () => {
  it('reflects member user in applied query', () => {
    const applied = buildAppliedQuery({ type: 'expense' }, member);
    expect(applied.user).toBe('member-1');
    expect(applied.type).toBe('expense');
  });
});

describe('buildTransactionRepositoryOptions', () => {
  it('uses keyset mode without count and default page size', () => {
    const filters = resolveTransactionsFilters({}, admin);
    const opts = buildTransactionRepositoryOptions(filters);
    expect(opts.countTotal).toBe(false);
    expect(opts.limit).toBe(TRANSACTIONS_LIST_PAGE_SIZE);
    expect(opts.offset).toBeUndefined();
  });
});
