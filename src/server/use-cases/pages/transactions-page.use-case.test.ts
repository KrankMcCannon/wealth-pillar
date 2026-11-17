import { describe, expect, it } from 'vitest';
import type { User } from '@/lib/types';
import {
  buildAppliedQuery,
  buildTransactionRepositoryOptions,
  matchesReserveTransaction,
  parseTransactionsListType,
  resolveDateRange,
  resolveTransactionsFilters,
  TRANSACTIONS_LIST_PAGE_SIZE,
} from './transactions-page.use-case';
import { accountsToMap } from '@/server/ledger';
import type { Account, Transaction } from '@/lib/types';

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

const reserveAccounts = [
  { id: 'spendable', type: 'checking', liquidity: 'spendable', user_ids: ['member-1'] },
  { id: 'reserve', type: 'savings', liquidity: 'reserve', user_ids: ['member-1'] },
] as Account[];

const reserveTransfer = {
  id: 'reserve-transfer',
  user_id: 'member-1',
  type: 'transfer',
  amount: 10,
  account_id: 'spendable',
  to_account_id: 'reserve',
  date: '2026-11-11',
  category: '',
} as Transaction;

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

describe('parseTransactionsListType', () => {
  it('accepts transfer so reserve links can filter the ledger', () => {
    expect(parseTransactionsListType('transfer')).toBe('transfer');
    expect(parseTransactionsListType('expense')).toBe('expense');
    expect(parseTransactionsListType('income')).toBe('income');
    expect(parseTransactionsListType('all')).toBe('all');
    expect(parseTransactionsListType('other')).toBeUndefined();
    expect(parseTransactionsListType(undefined)).toBeUndefined();
  });
});

describe('buildAppliedQuery', () => {
  it('reflects member user in applied query', () => {
    const applied = buildAppliedQuery({ type: 'expense' }, member);
    expect(applied.user).toBe('member-1');
    expect(applied.type).toBe('expense');
  });

  it('retains the reserve marker while forcing a member attribution', () => {
    expect(buildAppliedQuery({ reserve: true, user: 'other' }, member)).toMatchObject({
      reserve: true,
      user: 'member-1',
    });
  });
});

describe('matchesReserveTransaction', () => {
  it('uses the report savings attribution and excludes other transfer kinds', () => {
    const accountMap = accountsToMap(reserveAccounts);
    expect(matchesReserveTransaction(reserveTransfer, accountMap, 'member-1')).toBe(true);
    expect(matchesReserveTransaction(reserveTransfer, accountMap, 'other')).toBe(false);
    expect(
      matchesReserveTransaction(
        { ...reserveTransfer, to_account_id: 'spendable' },
        accountMap,
        'member-1'
      )
    ).toBe(false);
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
