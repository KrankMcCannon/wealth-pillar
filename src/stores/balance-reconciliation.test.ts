import { expect, it } from 'vitest';
import type { Account } from '@/lib/types';
import {
  acceptBalances,
  beginBalanceMutation,
  displayBalances,
  emptyBalanceState,
  finishBalanceMutation,
  seedBalances,
} from './balance-reconciliation';

const account = { id: 'a', balance: 100, balance_version: '1' } as Account;
const result = (balance: number, version: string) => ({
  accountBalances: { a: balance },
  accountBalanceVersions: { a: version },
});

it.each([false, true])(
  'converges when responses complete in reverse order (first fails: %s)',
  (fails) => {
    let state = seedBalances(emptyBalanceState(), [account]);
    state = beginBalanceMutation(state, [account], 'first', { a: -10 });
    state = beginBalanceMutation(state, [account], 'second', { a: -20 });
    expect(displayBalances([account], state)[0]?.balance).toBe(70);
    state = finishBalanceMutation(state, 'second', result(fails ? 80 : 70, '3'));
    expect(displayBalances([account], state)[0]?.balance).toBe(70);
    state = finishBalanceMutation(state, 'first', fails ? undefined : result(90, '2'));
    expect(displayBalances([account], state)[0]?.balance).toBe(fails ? 80 : 70);
    expect(state.pending).toEqual({});
    state = acceptBalances(state, { a: 90 }, { a: '2' });
    expect(displayBalances([account], state)[0]?.balance).toBe(fails ? 80 : 70);
  }
);

it('keeps pending transfer and edit deltas across refreshes, rolling back only the failed operation', () => {
  const accounts = [account, { ...account, id: 'b', balance: 0 }];
  let state = seedBalances(emptyBalanceState(), accounts);
  state = beginBalanceMutation(state, accounts, 'transfer', { a: -30, b: 30 });
  state = beginBalanceMutation(state, accounts, 'edit', { a: -5 });
  state = seedBalances(state, [{ ...account, balance: 70, balance_version: '2' }]);
  expect(displayBalances(accounts, state).map((a) => a.balance)).toEqual([65, 30]);
  state = finishBalanceMutation(state, 'edit');
  state = finishBalanceMutation(state, 'transfer', {
    accountBalances: { a: 70, b: 30 },
    accountBalanceVersions: { a: '2', b: '2' },
  });
  expect(displayBalances(accounts, state).map((a) => a.balance)).toEqual([70, 30]);
});
