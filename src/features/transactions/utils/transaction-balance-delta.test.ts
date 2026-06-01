import { describe, it, expect } from 'vitest';
import type { Account, Transaction } from '@/lib/types';
import {
  applyTransactionBalanceDelta,
  getTransactionBalanceDeltas,
  patchStoreBalancesForEdit,
} from './transaction-balance-delta';

function account(id: string, balance: number): Account {
  return {
    id,
    name: id,
    type: 'payroll',
    user_ids: ['u1'],
    group_id: 'g1',
    balance,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-01',
    user_id: 'u1',
    account_id: 'a1',
    created_at: '2024-06-01',
    updated_at: '2024-06-01',
    ...overrides,
  };
}

describe('getTransactionBalanceDeltas', () => {
  it('applies income to source account', () => {
    const deltas = getTransactionBalanceDeltas(tx({ type: 'income', amount: 50 }), 1);
    expect(deltas.get('a1')).toBe(50);
  });

  it('applies expense as negative on source account', () => {
    const deltas = getTransactionBalanceDeltas(tx({ type: 'expense', amount: 40 }), 1);
    expect(deltas.get('a1')).toBe(-40);
  });

  it('applies transfer to source and destination', () => {
    const deltas = getTransactionBalanceDeltas(
      tx({ type: 'transfer', amount: 25, to_account_id: 'a2' }),
      1
    );
    expect(deltas.get('a1')).toBe(-25);
    expect(deltas.get('a2')).toBe(25);
  });

  it('reverses with negative multiplier', () => {
    const deltas = getTransactionBalanceDeltas(tx({ type: 'income', amount: 10 }), -1);
    expect(deltas.get('a1')).toBe(-10);
  });
});

describe('applyTransactionBalanceDelta', () => {
  it('updates multiple accounts for transfer', () => {
    const accounts = [account('a1', 100), account('a2', 200)];
    const next = applyTransactionBalanceDelta(
      accounts,
      tx({ type: 'transfer', amount: 30, to_account_id: 'a2' }),
      1
    );
    expect(next.find((a) => a.id === 'a1')?.balance).toBe(70);
    expect(next.find((a) => a.id === 'a2')?.balance).toBe(230);
  });
});

describe('patchStoreBalancesForEdit', () => {
  it('reverses old transaction and applies new amounts', () => {
    const accounts = [account('a1', 100)];
    const updates: Partial<Account>[] = [];
    const updateAccount = (id: string, patch: Partial<Account>) => {
      updates.push({ id, ...patch });
    };

    patchStoreBalancesForEdit(
      accounts,
      updateAccount,
      tx({ type: 'expense', amount: 20 }),
      tx({ type: 'expense', amount: 35 })
    );

    expect(updates).toEqual([{ id: 'a1', balance: 85 }]);
  });
});
