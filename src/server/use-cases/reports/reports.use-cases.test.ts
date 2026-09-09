import { describe, it, expect } from 'vitest';
import { calculatePeriodSummariesUseCase, resolveYtdBudgetStart } from './reports.use-cases';
import type { Account, Budget, BudgetPeriod, Transaction } from '@/lib/types';

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

const spendable: Account = {
  id: 'a-spend',
  name: 'Payroll',
  type: 'payroll',
  user_ids: [userId],
  group_id: 'g1',
  balance: 300,
  liquidity: 'spendable',
  created_at: '',
  updated_at: '',
};

const reserve: Account = {
  id: 'a-reserve',
  name: 'Savings',
  type: 'savings',
  user_ids: [userId],
  group_id: 'g1',
  balance: 500,
  liquidity: 'reserve',
  created_at: '',
  updated_at: '',
};

function tx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 't1',
    description: '',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-06-10',
    user_id: userId,
    account_id: 'a-spend',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function budget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: 'b1',
    description: 'Food',
    amount: 200,
    type: 'monthly',
    icon: null,
    categories: ['food'],
    user_id: userId,
    group_id: 'g1',
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('calculatePeriodSummariesUseCase', () => {
  it('keeps reserve from the snapshot and spends from current budget txs', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [
        makePeriod({
          snapshot_at: '2024-07-01',
          spendable_spent: 156420.06,
          reserve_saved: 1000,
        }),
      ],
      [tx({ amount: 99 })],
      [spendable, reserve],
      [budget({ amount: 4000 })]
    );

    expect(summary!.spendableSpent).toBe(99);
    expect(summary!.reserveSaved).toBe(1000);
    expect(summary!.allocated).toBe(4000);
    expect(summary!.remaining).toBe(3901);
  });

  it('skips transactions with no user_id', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [makePeriod({ snapshot_at: '2024-07-01', reserve_saved: 0 })],
      [tx({ amount: 99, user_id: null })],
      [spendable, reserve],
      [budget({ amount: 4000 })]
    );

    expect(summary!.spendableSpent).toBe(0);
  });

  it('nets a same-category refund so a bank round-trip is zero spent', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [
        makePeriod({
          snapshot_at: '2024-07-01',
          spendable_spent: 156420.06,
          reserve_saved: -11203.31,
        }),
      ],
      [
        tx({ id: 'out', amount: 138000, type: 'expense', category: 'spese_mutuo' }),
        tx({ id: 'in', amount: 138000, type: 'income', category: 'spese_mutuo' }),
        tx({ id: 'food', amount: 50, category: 'food' }),
      ],
      [spendable, reserve],
      [budget({ amount: 2200, categories: ['food', 'spese_mutuo'] })]
    );

    expect(summary!.spendableSpent).toBe(50);
    expect(summary!.remaining).toBe(2150);
    expect(summary!.reserveSaved).toBe(-11203.31);
  });

  it('ignores a mutuo round-trip that is not in the budget categories', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [
        makePeriod({
          snapshot_at: '2024-07-01',
          spendable_spent: 156420.06,
        }),
      ],
      [
        tx({ id: 'out', amount: 138000, type: 'expense', category: 'spese_mutuo' }),
        tx({ id: 'in', amount: 138000, type: 'income', category: 'spese_mutuo' }),
        tx({ id: 'food', amount: 80, category: 'food' }),
      ],
      [spendable, reserve],
      [budget({ amount: 2200, categories: ['food'] })]
    );

    expect(summary!.spendableSpent).toBe(80);
    expect(summary!.remaining).toBe(2120);
  });

  it('does not treat a transfer to reserve as spendable spent when computing live', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [makePeriod()],
      [
        tx({
          type: 'transfer',
          category: 'savings',
          account_id: 'a-spend',
          to_account_id: 'a-reserve',
          amount: 1000,
        }),
      ],
      [spendable, reserve]
    );

    expect(summary!.spendableSpent).toBe(0);
    expect(summary!.reserveSaved).toBe(1000);
  });

  it('does not treat a transfer between spendable accounts as expense or income', () => {
    const cash: Account = { ...spendable, id: 'a-cash', name: 'Cash', type: 'cash', balance: 100 };
    const [summary] = calculatePeriodSummariesUseCase(
      [makePeriod()],
      [
        tx({
          type: 'transfer',
          category: 'transfer',
          account_id: 'a-spend',
          to_account_id: 'a-cash',
          amount: 50,
        }),
      ],
      [spendable, cash]
    );

    expect(summary!.spendableSpent).toBe(0);
    expect(summary!.reserveSaved).toBe(0);
  });

  it('counts live budget-category expenses, not salary or unbudgeted spend', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [makePeriod()],
      [
        tx({ amount: 80, category: 'food' }),
        tx({ id: 'pay', amount: 3000, type: 'income', category: 'stipendio' }),
      ],
      [spendable, reserve],
      [budget({ amount: 200 })]
    );

    expect(summary!.spendableSpent).toBe(80);
    expect(summary!.reserveSaved).toBe(0);
    expect(summary!.allocated).toBe(200);
    expect(summary!.remaining).toBe(120);
  });

  it('subtracts spendable spent from the user allocated budget', () => {
    const [summary] = calculatePeriodSummariesUseCase(
      [makePeriod()],
      [tx({ amount: 80 })],
      [spendable, reserve],
      [
        budget({ id: 'b1', amount: 100 }),
        budget({ id: 'b2', amount: 40 }),
        budget({ id: 'b3', amount: 999, user_id: 'u2' }),
        budget({ id: 'b4', amount: 0 }),
      ]
    );

    expect(summary!.allocated).toBe(140);
    expect(summary!.remaining).toBe(60);
  });

  it('unwinds risparmi start/end from current reserve and period savings', () => {
    const closed = makePeriod({
      id: 'closed',
      start_date: '2024-06-01',
      end_date: '2024-06-30',
      snapshot_at: '2024-07-01',
      reserve_saved: 100,
    });
    const open = makePeriod({
      id: 'open',
      start_date: '2024-07-01',
      end_date: null,
      is_active: true,
      snapshot_at: null,
    });
    const summaries = calculatePeriodSummariesUseCase(
      [closed, open],
      [
        tx({
          id: 'save',
          type: 'transfer',
          category: 'savings',
          date: '2024-07-10',
          account_id: 'a-spend',
          to_account_id: 'a-reserve',
          amount: 200,
        }),
      ],
      [spendable, { ...reserve, balance: 500 }],
      [budget({ amount: 2200 })]
    );

    const byId = Object.fromEntries(summaries.map((s) => [s.id, s]));
    expect(byId.open).toMatchObject({ reserveSaved: 200, reserveStart: 300, reserveEnd: 500 });
    expect(byId.closed).toMatchObject({ reserveSaved: 100, reserveStart: 200, reserveEnd: 300 });
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
