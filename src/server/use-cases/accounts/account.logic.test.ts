import { describe, it, expect } from 'vitest';
import { computeAccountStats, computeDashboardBalanceViewModel } from './account.logic';
import type { Account } from '@/lib/types';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    name: 'A',
    type: 'cash',
    user_ids: ['u1'],
    group_id: 'g1',
    balance: 100,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('computeAccountStats', () => {
  it('aggregates balances and splits spendable vs reserve', () => {
    const accounts = [
      account({ id: 'a1', type: 'cash', balance: 100 }),
      account({ id: 'a2', type: 'savings', balance: 200 }),
      account({ id: 'a3', type: 'payroll', balance: -20 }),
    ];
    const stats = computeAccountStats(accounts, {
      a1: 100,
      a2: 200,
      a3: -20,
    });
    expect(stats.totalBalance).toBe(280);
    expect(stats.spendableBalance).toBe(80);
    expect(stats.reserveBalance).toBe(200);
    expect(stats.positiveAccounts).toBe(2);
    expect(stats.negativeAccounts).toBe(1);
    expect(stats.totalAccounts).toBe(3);
  });
});

describe('computeDashboardBalanceViewModel', () => {
  it('precomputes spendable, reserve, and per-user totals without double-counting shared savings', () => {
    const accounts: Account[] = [
      account({ id: 'a1', type: 'cash', user_ids: ['u1', 'u2'], balance: 100 }),
      account({
        id: 'a2',
        type: 'savings',
        user_ids: ['u1', 'u2'],
        balance: 200,
        liquidity: 'reserve',
      }),
    ];
    const vm = computeDashboardBalanceViewModel(accounts, { a1: 100, a2: 200 }, ['u1', 'u2']);
    expect(vm.totalBalanceAll).toBe(300);
    expect(vm.spendableBalanceAll).toBe(100);
    expect(vm.reserveBalanceAll).toBe(200);
    expect(vm.totalBalanceByUserId.u1).toBe(300);
    expect(vm.spendableByUserId.u1).toBe(100);
    expect(vm.reserveByUserId.u1).toBe(200);
    expect(vm.totalBalanceByUserId.u2).toBe(300);
  });
});
