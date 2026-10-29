import { describe, expect, it } from 'vitest';
import {
  deriveBudgetStatus,
  deriveUserBudgetStatus,
  getBudgetCategoryStatus,
} from './budget-status';

describe('deriveBudgetStatus', () => {
  it('returns over when remaining is negative', () => {
    expect(deriveBudgetStatus(-1, 80)).toBe('over');
  });

  it('returns over when percentage exceeds 100', () => {
    expect(deriveBudgetStatus(0, 101)).toBe('over');
  });

  it('returns fixed when fully used with non-negative remaining', () => {
    expect(deriveBudgetStatus(0, 100)).toBe('fixed');
  });

  it('returns onTrack below the limit', () => {
    expect(deriveBudgetStatus(50, 75)).toBe('onTrack');
  });
});

describe('getBudgetCategoryStatus', () => {
  it('mirrors envelope remaining/percentage', () => {
    expect(
      getBudgetCategoryStatus({
        id: '1',
        description: 'Food',
        amount: 100,
        spent: 40,
        remaining: 60,
        percentage: 40,
        categories: [],
        transactionCount: 0,
      })
    ).toBe('onTrack');
  });
});

describe('deriveUserBudgetStatus', () => {
  it('uses rollup remaining and overall percentage', () => {
    expect(deriveUserBudgetStatus({ totalRemaining: -10, overallPercentage: 90 })).toBe('over');
    expect(deriveUserBudgetStatus({ totalRemaining: 0, overallPercentage: 100 })).toBe('fixed');
    expect(deriveUserBudgetStatus({ totalRemaining: 20, overallPercentage: 50 })).toBe('onTrack');
  });
});
