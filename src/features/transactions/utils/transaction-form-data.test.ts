import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/lib/types';
import { mapTransactionToFormData } from './transaction-form-data';

const baseTransaction: Transaction = {
  id: 'tx-1',
  description: 'Groceries',
  amount: 42.5,
  type: 'expense',
  category: 'food',
  date: '2026-05-20',
  user_id: 'user-1',
  account_id: 'account-1',
  to_account_id: null,
  created_at: '2026-05-20T10:00:00.000Z',
  updated_at: '2026-05-20T10:00:00.000Z',
};

describe('mapTransactionToFormData', () => {
  it('maps all transaction fields to form values', () => {
    expect(mapTransactionToFormData(baseTransaction)).toEqual({
      description: 'Groceries',
      amount: '42.5',
      type: 'expense',
      category: 'food',
      date: '2026-05-20',
      user_id: 'user-1',
      account_id: 'account-1',
      to_account_id: '',
    });
  });

  it('normalizes nullable fields and ISO date strings', () => {
    expect(
      mapTransactionToFormData({
        ...baseTransaction,
        description: null as unknown as string,
        category: null as unknown as string,
        user_id: null,
        account_id: null as unknown as string,
        to_account_id: null,
        date: '2026-05-21T00:00:00.000Z',
      })
    ).toEqual({
      description: '',
      amount: '42.5',
      type: 'expense',
      category: '',
      date: '2026-05-21',
      user_id: '',
      account_id: '',
      to_account_id: '',
    });
  });
});
