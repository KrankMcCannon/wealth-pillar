import { describe, it, expect } from 'vitest';
import { groupByDay } from './group-by-day';
import type { Transaction } from '@/lib/types';

const base = {
  id: 'x',
  description: 'd',
  user_id: 'u1',
  account_id: 'a1',
  category: 'food',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
  group_id: 'g1',
} satisfies Partial<Transaction>;

function tx(
  partial: Partial<Transaction> & Pick<Transaction, 'id' | 'amount' | 'type' | 'date'>
): Transaction {
  return { ...base, ...partial } as Transaction;
}

describe('groupByDay', () => {
  it('orders day groups newest first', () => {
    const list = groupByDay(
      [
        tx({ id: '1', amount: 10, type: 'expense', date: '2024-01-10' }),
        tx({ id: '2', amount: 5, type: 'income', date: '2024-01-12' }),
        tx({ id: '3', amount: 1, type: 'expense', date: '2024-01-11' }),
      ],
      'en-US'
    );
    expect(list.map((g) => g.isoDate)).toEqual(['2024-01-12', '2024-01-11', '2024-01-10']);
  });

  it('aggregates income, expense and net per day', () => {
    const list = groupByDay(
      [
        tx({ id: '1', amount: 100, type: 'income', date: '2024-06-01' }),
        tx({ id: '2', amount: 30, type: 'expense', date: '2024-06-01' }),
        tx({ id: '3', amount: 20, type: 'expense', date: '2024-06-01' }),
      ],
      'en-US'
    );
    expect(list).toHaveLength(1);
    const g = list[0]!;
    expect(g.income).toBe(100);
    expect(g.expense).toBe(50);
    expect(g.net).toBe(50);
    expect(g.transactions).toHaveLength(3);
  });

  it('ignores transfer for daily income/expense buckets', () => {
    const list = groupByDay(
      [
        tx({ id: '1', amount: 10, type: 'transfer', date: '2024-05-01' }),
        tx({ id: '2', amount: 5, type: 'expense', date: '2024-05-01' }),
      ],
      'en-US'
    );
    expect(list[0]!.income).toBe(0);
    expect(list[0]!.expense).toBe(5);
    expect(list[0]!.net).toBe(-5);
  });

  it('skips transactions with invalid dates', () => {
    const list = groupByDay(
      [tx({ id: '1', amount: 1, type: 'expense', date: '' as unknown as string })],
      'en-US'
    );
    expect(list).toEqual([]);
  });
});
