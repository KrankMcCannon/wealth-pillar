import { describe, it, expect } from 'vitest';
import { computeAccountStats, computeDashboardBalanceViewModel } from './account.logic';
import type { Account } from '@/lib/types';

describe('computeAccountStats', () => {
  it('aggregates balances and counts positive/negative', () => {
    const stats = computeAccountStats([100, -20, 0]);
    expect(stats.totalBalance).toBe(80);
    expect(stats.positiveAccounts).toBe(1);
    expect(stats.negativeAccounts).toBe(1);
    expect(stats.totalAccounts).toBe(3);
  });
});

describe('computeDashboardBalanceViewModel', () => {
  it('precomputes all and per-user totals', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'A',
        type: 'cash',
        user_ids: ['u1'],
        group_id: 'g1',
        balance: 100,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'a2',
        name: 'B',
        type: 'savings',
        user_ids: ['u2'],
        group_id: 'g1',
        balance: 200,
        created_at: '',
        updated_at: '',
      },
    ];
    const vm = computeDashboardBalanceViewModel(accounts, { a1: 100, a2: 200 }, ['u1', 'u2']);
    expect(vm.totalBalanceAll).toBe(300);
    expect(vm.totalBalanceByUserId.u1).toBe(100);
    expect(vm.totalBalanceByUserId.u2).toBe(200);
  });
});
