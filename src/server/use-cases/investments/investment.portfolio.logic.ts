import { financialDateKey } from '@/lib/utils/financial-date';
import {
  buildSeriesIndex,
  getCloseForDate,
  normalizeDateKey,
  type MarketDataCacheRow,
  type ParsedSeriesPoint,
} from '@/lib/types/market-data.types';
import { PortfolioSnapshotRepository } from '@/server/repositories/portfolio-snapshot.repository';
import type { investments } from '@/server/db/schema';
import type {
  AssetAllocationSlice,
  EnrichedInvestment,
  PortfolioSummary,
} from './investment.types';

type InvestmentRow = typeof investments.$inferSelect;

export type SeriesIndex = Record<string, ParsedSeriesPoint[]>;

export type PrecomputedPortfolioTotals = {
  totalInvested: number;
  totalTaxPaid: number;
};

export function batchResultsToSeriesIndex(
  batch: Array<{ symbol: string; data: MarketDataCacheRow['data'] }>
): SeriesIndex {
  const rows: MarketDataCacheRow[] = batch.map((item) => ({
    symbol: item.symbol,
    data: item.data,
  }));
  return buildSeriesIndex(rows);
}

export function enrichPortfolioFromInvestments(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex,
  precomputedTotals?: PrecomputedPortfolioTotals
): {
  investments: EnrichedInvestment[];
  summary: PortfolioSummary;
  assetAllocation: AssetAllocationSlice[];
} {
  let totalInvested = precomputedTotals?.totalInvested ?? 0;
  let totalTaxPaid = precomputedTotals?.totalTaxPaid ?? 0;
  let totalCurrentValue = 0;
  let totalInitialValue = 0;
  let currentComplete = true;
  let initialComplete = true;
  const trackTotalsInLoop = !precomputedTotals;

  const enrichedInvestments: EnrichedInvestment[] = rows.map((inv) => {
    const symbolKey = inv.symbol.toUpperCase();
    const currencyRate = Number(inv.currency_rate) || 1;
    const shares = Number(inv.shares_acquired);

    const symbolData = seriesIndex[symbolKey];
    const livePrice = getCloseForDate(symbolData, financialDateKey(new Date()));
    const currentValue = livePrice == null ? null : livePrice * currencyRate * shares;

    const creationDateKey = financialDateKey(inv.created_at || new Date());
    const initialPrice = getCloseForDate(symbolData, creationDateKey);
    const initialValue = initialPrice == null ? null : initialPrice * currencyRate * shares;

    const investmentAmount = Number(inv.amount);
    const taxPaid = Number(inv.tax_paid) || 0;
    const totalPaid = investmentAmount + taxPaid;
    const totalGain = currentValue == null ? null : currentValue - totalPaid;

    if (trackTotalsInLoop) {
      totalInvested += investmentAmount;
      totalTaxPaid += taxPaid;
    }
    if (currentValue == null) currentComplete = false;
    else totalCurrentValue += currentValue;
    if (initialValue == null) initialComplete = false;
    else totalInitialValue += initialValue;

    return {
      ...inv,
      amount: Number(inv.amount),
      shares_acquired: Number(inv.shares_acquired),
      currency_rate: Number(inv.currency_rate),
      tax_paid: Number(inv.tax_paid),
      net_earn: Number(inv.net_earn),
      priceDate:
        symbolData?.findLast(
          (point) =>
            point.date <= financialDateKey(new Date()) &&
            Number.isFinite(point.close) &&
            point.close > 0
        )?.date ?? null,
      currentPrice: livePrice == null ? null : livePrice * currencyRate,
      currentValue,
      initialValue,
      totalPaid,
      totalGain,
    };
  });

  const totalPaid = totalInvested + totalTaxPaid;
  const totalReturn = currentComplete ? totalCurrentValue - totalPaid : null;
  const totalReturnPercent =
    totalReturn == null ? null : totalPaid > 0 ? (totalReturn / totalPaid) * 100 : 0;

  const allocationMap = new Map<string, number>();
  for (const inv of enrichedInvestments) {
    const key = inv.symbol.toUpperCase();
    allocationMap.set(key, (allocationMap.get(key) || 0) + inv.totalPaid);
  }
  const assetAllocation = [...allocationMap.entries()]
    .map(([symbol, value]) => ({ symbol, value }))
    .sort((a, b) => b.value - a.value);

  return {
    investments: enrichedInvestments,
    summary: {
      totalInvested,
      totalTaxPaid,
      totalPaid,
      totalCurrentValue: currentComplete ? totalCurrentValue : null,
      totalInitialValue: initialComplete ? totalInitialValue : null,
      totalReturn,
      totalReturnPercent,
    },
    assetAllocation,
  };
}

/** Carry the last known close forward; never invent a value before the first quote. */
export function buildPortfolioHistory(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): { date: string; value: number }[] {
  if (rows.length === 0) return [];
  const today = financialDateKey(new Date());
  const lots = rows.map((row) => ({
    start: financialDateKey(row.created_at ?? new Date()),
    symbol: row.symbol.toUpperCase(),
    units: Number(row.shares_acquired) * (Number(row.currency_rate) || 1),
  }));
  const earliest = lots.reduce((min, lot) => (lot.start < min ? lot.start : min), today);
  const current = new Date(`${earliest}T00:00:00Z`);
  const states = new Map<string, { cursor: number; price: number | null }>();
  for (const lot of lots) states.set(lot.symbol, { cursor: 0, price: null });
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
      if (price == null) {
        complete = false;
        break;
      }
      value += price * lot.units;
    }
    // Incomplete totals must never become immutable financial snapshots.
    if (complete) history.push({ date, value });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return history;
}

/**
 * Reads never write projections. Mutations atomically discard snapshots from the
 * first changed accounting day. Available quotes rebuild those points in memory;
 * earlier, unaffected snapshots preserve history outside the quote window.
 */
export async function buildPortfolioHistoryWithSnapshots(
  userIds: string[],
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): Promise<{ date: string; value: number }[]> {
  if (!rows.length) return [];
  const snapshots = await PortfolioSnapshotRepository.findByUserIds(userIds);
  const byUser = new Map<string, Map<string, number>>();
  const starts = new Map<string, string>();
  const dates = new Set<string>();
  const today = financialDateKey(new Date());
  for (const userId of new Set(userIds)) {
    const lots = rows.filter((row) => row.user_id === userId);
    if (!lots.length) continue;
    const start = lots.reduce((first, lot) => {
      const day = financialDateKey(lot.created_at ?? new Date());
      return day < first ? day : first;
    }, today);
    starts.set(userId, start);
    const points = new Map<string, number>();
    for (const point of snapshots.filter((row) => row.user_id === userId)) {
      if (
        point.snapshot_date >= start &&
        point.snapshot_date < today &&
        Number.isFinite(Number(point.value))
      ) {
        points.set(point.snapshot_date, Number(point.value));
      }
    }
    for (const point of buildPortfolioHistory(lots, seriesIndex))
      points.set(point.date, point.value);
    for (const day of points.keys()) dates.add(day);
    byUser.set(userId, points);
  }
  const result: { date: string; value: number }[] = [];
  for (const date of [...dates].sort()) {
    let value = 0;
    let complete = true;
    for (const [userId, points] of byUser) {
      if (starts.get(userId)! > date) continue;
      const point = points.get(date);
      if (point === undefined) {
        complete = false;
        break;
      }
      value += point;
    }
    if (complete) result.push({ date, value });
  }
  return result;
}
