import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  buildPortfolioHistory,
  enrichPortfolioFromInvestments,
  type SeriesIndex,
} from './investment.portfolio.logic';
import type { investments } from '@/server/db/schema';

type InvestmentRow = typeof investments.$inferSelect;

function row(overrides: Partial<InvestmentRow> = {}): InvestmentRow {
  return {
    id: 'inv-1',
    user_id: 'user-1',
    group_id: 'group-1',
    name: 'Test ETF',
    symbol: 'AAA',
    amount: '1000',
    shares_acquired: '2',
    currency: 'EUR',
    currency_rate: '1',
    tax_paid: '10',
    net_earn: '0',
    created_at: new Date('2024-01-01T12:00:00Z'),
    updated_at: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  } as InvestmentRow;
}

describe('enrichPortfolioFromInvestments', () => {
  const seriesIndex: SeriesIndex = {
    AAA: [
      { date: '2024-01-01', close: 10 },
      { date: '2024-06-01', close: 20 },
    ],
  };

  it('computes summary totals and return percent', () => {
    const { summary, investments } = enrichPortfolioFromInvestments([row()], seriesIndex);

    expect(investments[0]?.currentValue).toBe(40);
    expect(summary.totalInvested).toBe(1000);
    expect(summary.totalTaxPaid).toBe(10);
    expect(summary.totalPaid).toBe(1010);
    expect(summary.totalReturn).toBe(40 - 1010);
    expect(summary.totalReturnPercent).toBeCloseTo(((40 - 1010) / 1010) * 100, 5);
  });

  it('returns zero return percent when nothing was paid', () => {
    const { summary } = enrichPortfolioFromInvestments(
      [row({ amount: '0', tax_paid: '0' })],
      seriesIndex
    );
    expect(summary.totalReturnPercent).toBe(0);
  });

  it('marks missing valuations and portfolio returns unavailable, without losing invested cost', () => {
    const result = enrichPortfolioFromInvestments([row(), row({ symbol: 'MISSING' })], seriesIndex);
    expect(result.investments[1]).toMatchObject({
      currentPrice: null,
      currentValue: null,
      totalGain: null,
    });
    expect(result.summary).toMatchObject({
      totalPaid: 2020,
      totalCurrentValue: null,
      totalReturn: null,
      totalReturnPercent: null,
    });
  });
  it('does not use a future quote as the acquisition value', () => {
    const result = enrichPortfolioFromInvestments([row()], {
      AAA: [{ date: '2024-02-01', close: 20 }],
    });
    expect(result.investments[0]?.initialValue).toBeNull();
    expect(result.summary.totalInitialValue).toBeNull();
  });

  it('uses precomputed SQL totals when provided', () => {
    const { summary } = enrichPortfolioFromInvestments([row()], seriesIndex, {
      totalInvested: 5000,
      totalTaxPaid: 50,
    });

    expect(summary.totalInvested).toBe(5000);
    expect(summary.totalTaxPaid).toBe(50);
    expect(summary.totalPaid).toBe(5050);
  });
});

describe('buildPortfolioHistory', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T18:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('forward-fills prices across gaps', () => {
    const seriesIndex: SeriesIndex = {
      AAA: [
        { date: '2024-01-01', close: 10 },
        { date: '2024-01-04', close: 14 },
      ],
    };

    const history = buildPortfolioHistory([row()], seriesIndex);
    const day2 = history.find((p) => p.date === '2024-01-02');
    const day3 = history.find((p) => p.date === '2024-01-03');
    const day4 = history.find((p) => p.date === '2024-01-04');

    expect(day2?.value).toBe(20);
    expect(day3?.value).toBe(20);
    expect(day4?.value).toBe(28);
  });

  it('retains every holding over a long closure, seeded by a quote before purchase', () => {
    const history = buildPortfolioHistory([row(), row({ symbol: 'BBB', shares_acquired: '3' })], {
      AAA: [
        { date: '2023-12-29', close: 10 },
        { date: '2024-01-12', close: 12 },
      ],
      BBB: [{ date: '2024-01-01', close: 20 }],
    });
    expect(history.find((p) => p.date === '2024-01-10')?.value).toBe(80);
    expect(history.find((p) => p.date === '2024-01-12')?.value).toBe(84);
    expect(history.at(-1)?.value).toBe(84);
  });
  it('does not emit a partial total or look ahead before an owned asset has a quote', () => {
    const history = buildPortfolioHistory([row(), row({ symbol: 'BBB' })], {
      AAA: [{ date: '2024-01-01', close: 10 }],
      BBB: [{ date: '2024-01-10', close: 20 }],
    });
    expect(history[0]).toEqual({ date: '2024-01-10', value: 60 });
    expect(buildPortfolioHistory([row()], {})).toEqual([]);
  });

  it('returns empty history when there are no investments', () => {
    expect(buildPortfolioHistory([], {})).toEqual([]);
  });
});
