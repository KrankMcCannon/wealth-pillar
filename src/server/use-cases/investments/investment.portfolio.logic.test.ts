import { describe, it, expect } from 'vitest';
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
});

describe('buildPortfolioHistory', () => {
  it('forward-fills prices within three calendar days', () => {
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

  it('returns empty history when there are no investments', () => {
    expect(buildPortfolioHistory([], {})).toEqual([]);
  });
});
