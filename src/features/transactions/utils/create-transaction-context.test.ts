import { describe, expect, it } from 'vitest';
import type { Account, User } from '@/lib/types';
import { resolveTransactionCreateContext } from './create-transaction-context';
const user = { id: 'u1', role: 'member', group_id: 'g' } as User;
const other = { id: 'u2', role: 'member', group_id: 'g', default_account_id: 'a2' } as User;
const accounts = [
  { id: 'a1', user_ids: ['u1'] },
  { id: 'a2', user_ids: ['u2'] },
  { id: 'shared', user_ids: ['u1', 'u2'] },
] as Account[];
const resolve = (query: string, current = user, options = accounts) =>
  resolveTransactionCreateContext(new URLSearchParams(query), current, [user, other], options);
describe('transaction creation context', () => {
  it('prefills permitted member, account and type without copying a filter date', () => {
    expect(
      resolve('user=u2&account=shared&type=income&from=2020-01-01', { ...user, role: 'admin' })
    ).toEqual({ user_id: 'u2', account_id: 'shared', type: 'income' });
  });
  it('ignores unauthorized members and accounts', () => {
    expect(resolve('user=u2&account=a2&type=bogus')).toEqual({
      user_id: 'u1',
      account_id: 'a1',
      type: 'expense',
    });
  });
  it('uses the selected member default and rejects an unknown member', () => {
    expect(resolve('user=u2', { ...user, role: 'admin' }).account_id).toBe('a2');
    expect(resolve('user=foreign', { ...user, role: 'admin' }).user_id).toBe('u1');
  });
  it('does not fall back to an account owned only by someone else', () => {
    expect(resolve('account=a2', user, [accounts[1]!]).account_id).toBe('');
  });
});
