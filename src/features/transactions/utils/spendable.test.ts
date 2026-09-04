import { describe, expect, it } from 'vitest';
import type { Account, Transaction } from '@/lib/types';
import { currentSpendable, spendableByDay } from './spendable';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'cash',
    name: 'Cash',
    type: 'payroll',
    user_ids: ['u1'],
    group_id: 'g1',
    balance: 1000,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-02',
    user_id: 'u1',
    account_id: 'cash',
    created_at: '2024-06-02',
    updated_at: '2024-06-02',
    ...overrides,
  };
}

describe('currentSpendable', () => {
  it('sums spendable accounts and skips reserves', () => {
    expect(
      currentSpendable([
        account({ id: 'cash', balance: 400 }),
        account({ id: 'vault', type: 'savings', balance: 9000 }),
      ])
    ).toBe(400);
  });
});

describe('spendableByDay', () => {
  it('pins newest day to live remaining and rewinds older days by newer spendable net', () => {
    const accounts = [account({ balance: 500 })];
    const days = [
      {
        isoDate: '2024-06-02',
        transactions: [tx({ id: 'today', amount: 80, type: 'expense', date: '2024-06-02' })],
      },
      {
        isoDate: '2024-06-01',
        transactions: [tx({ id: 'yday', amount: 50, type: 'income', date: '2024-06-01' })],
      },
    ];

    const byDay = spendableByDay(days, 500, accounts);

    expect(byDay.get('2024-06-02')).toBe(500);
    expect(byDay.get('2024-06-01')).toBe(580);
  });
});
