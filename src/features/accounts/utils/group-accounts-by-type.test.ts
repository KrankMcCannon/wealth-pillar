import { describe, expect, it } from 'vitest';
import type { Account } from '@/lib/types';
import { groupAccountsByType } from './group-accounts-by-type';

function account(id: string, type: Account['type']): Account {
  return {
    id,
    name: id,
    type,
    user_ids: ['u1'],
    group_id: 'g1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };
}

describe('groupAccountsByType', () => {
  it('groups in checking, cash, savings, investments order and drops empty types', () => {
    const grouped = groupAccountsByType([
      account('sav', 'savings'),
      account('pay', 'payroll'),
      account('inv', 'investments'),
      account('pay-2', 'payroll'),
    ]);
    expect(grouped.map((group) => group.type)).toEqual(['payroll', 'savings', 'investments']);
    expect(grouped[0]?.accounts.map((item) => item.id)).toEqual(['pay', 'pay-2']);
  });
});
