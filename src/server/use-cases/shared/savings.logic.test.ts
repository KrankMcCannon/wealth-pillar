import { describe, it, expect } from 'vitest';
import { classifyTransferSavingsDelta, computeNetSavings } from './savings.logic';
import type { Account, Transaction } from '@/lib/types';

const window = {
  start: new Date('2024-06-01'),
  end: new Date('2024-06-30T23:59:59'),
};

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    name: 'A',
    type: 'payroll',
    user_ids: ['u1'],
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: '',
    amount: 100,
    type: 'transfer',
    category: 'savings',
    date: '2024-06-10',
    user_id: 'u1',
    account_id: 'a1',
    to_account_id: 'a2',
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('classifyTransferSavingsDelta', () => {
  it('deposit: spendable to reserve', () => {
    expect(
      classifyTransferSavingsDelta(
        account({ type: 'payroll' }),
        account({ id: 'a2', type: 'savings' }),
        50
      )
    ).toBe(50);
  });

  it('withdrawal: reserve to spendable', () => {
    expect(
      classifyTransferSavingsDelta(
        account({ type: 'savings' }),
        account({ id: 'a2', type: 'payroll' }),
        30
      )
    ).toBe(-30);
  });

  it('neutral: spendable to spendable', () => {
    expect(
      classifyTransferSavingsDelta(
        account({ type: 'payroll' }),
        account({ id: 'a2', type: 'cash' }),
        20
      )
    ).toBe(0);
  });
});

describe('computeNetSavings', () => {
  const accounts = [account({ id: 'a1', type: 'payroll' }), account({ id: 'a2', type: 'savings' })];

  it('sums deposits and withdrawals in window', () => {
    const result = computeNetSavings(
      [
        tx({ account_id: 'a1', to_account_id: 'a2', amount: 100 }),
        tx({
          id: 'tx-2',
          account_id: 'a2',
          to_account_id: 'a1',
          amount: 40,
        }),
        tx({
          id: 'tx-3',
          date: '2024-05-01',
          account_id: 'a1',
          to_account_id: 'a2',
          amount: 999,
        }),
      ],
      accounts,
      window,
      'u1'
    );
    expect(result.deposits).toBe(100);
    expect(result.withdrawals).toBe(40);
    expect(result.net).toBe(60);
  });
});
