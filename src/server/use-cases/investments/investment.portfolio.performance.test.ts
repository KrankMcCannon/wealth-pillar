import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { buildPortfolioHistory, type SeriesIndex } from './investment.portfolio.logic';
import { financialDateKey } from '@/lib/utils/financial-date';
import { normalizeDateKey } from '@/lib/types/market-data.types';
import { conversionSymbol } from './currency-conversion';
import type { investments } from '@/server/db/schema';

type InvestmentRow = typeof investments.$inferSelect;
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
});
afterEach(() => vi.useRealTimers());

it.each(
  [10, 100, 1000].flatMap((count) =>
    ['monthly', 'daily', 'rolling'].map((quotes) => ({ count, quotes }))
  )
)(
  'preserves ten years of daily values for $count lots with $quotes quotes',
  ({ count, quotes }) => {
    const rows = Array.from(
      { length: count },
      (_, index) =>
        ({
          id: `lot-${index}`,
          user_id: `user-${index % 4}`,
          symbol: `ASSET${index % 10}`,
          shares_acquired: String((index + 1) / 7),
          currency: index % 3 === 0 ? 'USD' : 'EUR',
          created_at: new Date(Date.UTC(2016 + (index % 10), index % 12, 1, 12)),
        }) as InvestmentRow
    );
    const series: SeriesIndex = {};
    for (let symbol = 0; symbol < 10; symbol++) {
      series[`ASSET${symbol}`] = Array.from(
        { length: quotes === 'monthly' ? 120 : quotes === 'rolling' ? 730 : 3963 },
        (_, index) => ({
          date: (quotes === 'monthly'
            ? new Date(Date.UTC(2016, index, 1))
            : new Date(Date.UTC(quotes === 'rolling' ? 2024 : 2016, 0, index + 1))
          )
            .toISOString()
            .slice(0, 10),
          close: 10 + symbol + index / 7,
        })
      );
    }
    // FX starts late, with invalid quotes interleaved. Those days must stay unavailable.
    series['USD/EUR'] = [
      { date: '2016-03-01', close: 0.88 },
      { date: '2020-04-01', close: NaN },
      { date: '2021-03-28', close: 0.83 },
      { date: '2024-10-27', close: 0 },
      { date: '2025-01-01', close: 0.96 },
    ];
    // Deliberately unsorted lots preserve the original floating-point summation order.
    rows.reverse();
    const expected = buildReferenceHistory(rows, series);
    const actual = buildPortfolioHistory(rows, series);
    expect(actual).toEqual(expected);
    expect(actual[0]?.date).toBe(quotes === 'rolling' ? '2024-01-01' : '2016-03-01');
    expect(actual.at(-1)?.date).toBe('2026-11-06');
  }
);

// Pre-optimization daily valuation: guards exact rounding, missing data and acquisition semantics.
function buildReferenceHistory(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): { date: string; value: number }[] {
  if (rows.length === 0) return [];
  const today = financialDateKey(new Date());
  const lots = rows.map((row) => ({
    start: financialDateKey(row.created_at ?? new Date()),
    symbol: row.symbol.toUpperCase(),
    units: Number(row.shares_acquired),
    currency: row.currency,
    rateSymbol: conversionSymbol(row.currency),
  }));
  const earliest = lots.reduce((min, lot) => (lot.start < min ? lot.start : min), today);
  const current = new Date(`${earliest}T00:00:00Z`);
  const states = new Map<string, { cursor: number; price: number | null }>();
  for (const lot of lots) {
    states.set(lot.symbol, { cursor: 0, price: null });
    if (lot.rateSymbol) states.set(lot.rateSymbol, { cursor: 0, price: null });
  }
  const history: { date: string; value: number }[] = [];
  while (normalizeDateKey(current) <= today) {
    const date = normalizeDateKey(current);
    for (const [symbol, state] of states) {
      const series = seriesIndex[symbol] ?? [];
      while (state.cursor < series.length && series[state.cursor]!.date <= date) {
        const point = series[state.cursor++]!;
        if (Number.isFinite(point.close) && point.close > 0) state.price = point.close;
      }
    }
    let complete = true;
    let value = 0;
    for (const lot of lots) {
      if (lot.start > date) continue;
      const price = states.get(lot.symbol)!.price;
      const rate =
        lot.currency === 'EUR' ? 1 : lot.rateSymbol ? states.get(lot.rateSymbol)?.price : null;
      if (price == null || rate == null) {
        complete = false;
        break;
      }
      value += price * lot.units * rate;
    }
    // Incomplete totals must never become immutable financial snapshots.
    if (complete) history.push({ date, value });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return history;
}
