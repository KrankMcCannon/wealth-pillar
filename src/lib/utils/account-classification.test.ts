import { describe, it, expect } from 'vitest';
import {
  resolveAccountLiquidity,
  defaultLiquidityForType,
  isSpendableAccount,
  isReserveAccount,
} from './account-classification';
import type { Account } from '@/lib/types';

function account(overrides: Partial<Account> = {}): Account {
  return {
    id: 'a1',
    name: 'Test',
    type: 'payroll',
    user_ids: ['u1'],
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('resolveAccountLiquidity', () => {
  it('uses explicit liquidity when set', () => {
    expect(resolveAccountLiquidity(account({ type: 'savings', liquidity: 'spendable' }))).toBe(
      'spendable'
    );
  });

  it('derives from type when liquidity is null', () => {
    expect(resolveAccountLiquidity(account({ type: 'savings', liquidity: null }))).toBe('reserve');
    expect(resolveAccountLiquidity(account({ type: 'payroll', liquidity: null }))).toBe(
      'spendable'
    );
  });
});

describe('defaultLiquidityForType', () => {
  it('maps account types to liquidity', () => {
    expect(defaultLiquidityForType('cash')).toBe('spendable');
    expect(defaultLiquidityForType('investments')).toBe('reserve');
  });
});

describe('liquidity helpers', () => {
  it('isSpendableAccount and isReserveAccount', () => {
    expect(isSpendableAccount(account({ type: 'cash' }))).toBe(true);
    expect(isReserveAccount(account({ type: 'savings' }))).toBe(true);
  });
});
