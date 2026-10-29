import { describe, expect, it } from 'vitest';
import { sumAccountBalanceFromRows } from './transaction-balance-delta.core';

describe('sumAccountBalanceFromRows', () => {
  it('rebuilds the account total from income, expense, and both sides of transfers', () => {
    expect(
      sumAccountBalanceFromRows('a1', [
        { amount: 100, type: 'income', account_id: 'a1' },
        { amount: 30, type: 'expense', account_id: 'a1' },
        { amount: 20, type: 'transfer', account_id: 'a1', to_account_id: 'a2' },
        { amount: 15, type: 'transfer', account_id: 'a2', to_account_id: 'a1' },
        { amount: 999, type: 'income', account_id: 'a2' },
      ])
    ).toBe(65);
  });

  it('returns 0 when the account has no affecting transactions', () => {
    expect(sumAccountBalanceFromRows('a1', [])).toBe(0);
  });
});
