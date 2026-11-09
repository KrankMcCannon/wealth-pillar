import { describe, expect, it } from 'vitest';
import { minorUnitsToMoney, moneyToMinorUnits } from './exact-money';
import { computeExactBalanceDeltas } from '@/server/use-cases/transactions/transaction-balance-delta.core';

describe('exact persisted EUR amounts', () => {
  it.each(['0.00', '0.01', '-0.01', '9999999999999.99', '-9999999999999.99'])(
    'round trips %s without binary arithmetic',
    (value) => {
      expect(minorUnitsToMoney(moneyToMinorUnits(value))).toBe(value);
    }
  );
  it.each(['', 'NaN', '1.001', '1e3', 'Infinity', ' 1', '1,00'])(
    'rejects invalid persisted value %s',
    (value) => {
      expect(() => moneyToMinorUnits(value)).toThrow();
    }
  );
  it('accumulates and cancels small deltas exactly', () => {
    let total = BigInt(0);
    for (let i = 0; i < 10000; i++) total += moneyToMinorUnits('0.01');
    expect(minorUnitsToMoney(total)).toBe('100.00');
  });
  it('nets both sides of a self transfer', () => {
    expect(
      computeExactBalanceDeltas(
        { amount: '1.01', type: 'transfer', account_id: 'a', to_account_id: 'a' },
        1
      ).get('a')
    ).toBe(BigInt(0));
  });
});
