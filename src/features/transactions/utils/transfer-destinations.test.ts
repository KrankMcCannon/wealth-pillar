import { describe, expect, it } from 'vitest';
import type { Account } from '@/lib/types';
import { accountSelectLabel, getTransferDestinationAccounts } from './transfer-destinations';

function account(id: string, userIds: string[], name = id): Account {
  return {
    id,
    name,
    type: 'payroll',
    user_ids: userIds,
    group_id: 'g1',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };
}

describe('getTransferDestinationAccounts', () => {
  it('keeps other users accounts and drops the source', () => {
    const alice = account('a1', ['u1'], 'Checking');
    const bob = account('a2', ['u2'], 'Checking');
    expect(getTransferDestinationAccounts([alice, bob], 'a1')).toEqual([bob]);
  });
});

describe('accountSelectLabel', () => {
  it('appends owner names so same-named accounts stay distinct', () => {
    expect(
      accountSelectLabel(account('a2', ['u2'], 'Checking'), [
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ])
    ).toBe('Checking (Bob)');
  });
});
