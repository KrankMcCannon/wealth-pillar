import { describe, it, expect } from 'vitest';
import { calculatePeriodSummariesUseCase, resolveYtdBudgetStart } from './reports.use-cases';
import type { Account, BudgetPeriod, Transaction } from '@/lib/types';

const userId = 'u1';

function makePeriod(overrides: Partial<BudgetPeriod> = {}): BudgetPeriod {
  const now = new Date().toISOString();
  return {
    id: 'p1',
    start_date: '2024-06-01',
    end_date: '2024-06-30',
    is_active: false,
    user_id: userId,
    created_at: now,
    updated_at: now,
    ...overrides,
  };
}

describe('calculatePeriodSummariesUseCase', () => {
  it('splits start and end balances by spendable and reserve', () => {
    const accounts: Account[] = [
      {
        id: 'a-spend',
        name: 'Payroll',
        type: 'payroll',
        user_ids: [userId],
        group_id: 'g1',
        balance: 300,
        liquidity: 'spendable',
        created_at: '',
        updated_at: '',
      },
      {
        id: 'a-reserve',
        name: 'Savings',
        type: 'savings',
        user_ids: [userId],
        group_id: 'g1',
        balance: 500,
        liquidity: 'reserve',
        created_at: '',
        updated_at: '',
      },
    ];

    const transactions: Transaction[] = [
      {
        id: 't1',
        description: '',
        amount: 100,
        type: 'transfer',
        category: 'savings',
        date: '2024-06-10',
        user_id: userId,
        account_id: 'a-spend',
        to_account_id: 'a-reserve',
        frequency: 'once',
        recurring_series_id: null,
        group_id: 'g1',
        created_at: '',
        updated_at: '',
      },
    ];

    const [summary] = calculatePeriodSummariesUseCase([makePeriod()], transactions, accounts);

    expect(summary).toBeDefined();
    expect(summary!.spendable.endBalance).toBe(300);
    expect(summary!.reserve.endBalance).toBe(500);
    expect(summary!.spendable.startBalance).toBe(400);
    expect(summary!.reserve.startBalance).toBe(400);
    expect(summary!.startBalance).toBe(
      summary!.spendable.startBalance + summary!.reserve.startBalance
    );
    expect(summary!.endBalance).toBe(summary!.spendable.endBalance + summary!.reserve.endBalance);
    expect(summary!.endBalance).toBeGreaterThanOrEqual(summary!.startBalance);
  });

  it('uses resolveAccountLiquidity defaults when liquidity is unset', () => {
    const accounts: Account[] = [
      {
        id: 'a1',
        name: 'Savings',
        type: 'savings',
        user_ids: [userId],
        group_id: 'g1',
        balance: 200,
        created_at: '',
        updated_at: '',
      },
      {
        id: 'a2',
        name: 'Cash',
        type: 'cash',
        user_ids: [userId],
        group_id: 'g1',
        balance: 100,
        created_at: '',
        updated_at: '',
      },
    ];

    const [summary] = calculatePeriodSummariesUseCase([makePeriod()], [], accounts);

    expect(summary!.reserve.endBalance).toBe(200);
    expect(summary!.spendable.endBalance).toBe(100);
    expect(summary!.endBalance).toBe(300);
  });
});

describe('resolveYtdBudgetStart', () => {
  const now = new Date('2024-03-15');
  const ymd = (d: Date | null) =>
    d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : null;

  it('returns the start of the period straddling 1 Jan of the current year', () => {
    const periods: BudgetPeriod[] = [
      makePeriod({ id: 'dec', start_date: '2023-12-10', end_date: '2024-01-09' }),
      makePeriod({ id: 'jan', start_date: '2024-01-10', end_date: '2024-02-09' }),
    ];

    expect(ymd(resolveYtdBudgetStart(periods, now))).toBe('2023-12-10');
  });

  it('picks the earliest straddling start across users', () => {
    const periods: BudgetPeriod[] = [
      makePeriod({ id: 'u1', user_id: 'u1', start_date: '2023-12-10', end_date: '2024-01-09' }),
      makePeriod({ id: 'u2', user_id: 'u2', start_date: '2023-12-05', end_date: '2024-01-04' }),
    ];

    expect(ymd(resolveYtdBudgetStart(periods, now))).toBe('2023-12-05');
  });

  it('returns null when no period straddles 1 Jan', () => {
    const periods: BudgetPeriod[] = [
      makePeriod({ id: 'feb', start_date: '2024-02-01', end_date: '2024-02-29' }),
    ];

    expect(resolveYtdBudgetStart(periods, now)).toBeNull();
  });

  it('treats an open period (no end_date) as ending now', () => {
    const periods: BudgetPeriod[] = [
      makePeriod({ id: 'open', start_date: '2023-12-20', end_date: null }),
    ];

    expect(ymd(resolveYtdBudgetStart(periods, now))).toBe('2023-12-20');
  });
});
