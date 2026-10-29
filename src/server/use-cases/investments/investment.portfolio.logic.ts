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
    const livePrice = getCloseForDate(symbolData, normalizeDateKey(new Date()));
    const currentValue = livePrice == null ? null : livePrice * currencyRate * shares;

    const creationDateKey = normalizeDateKey(inv.created_at || new Date());
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
            point.date <= normalizeDateKey(new Date()) &&
            Number.isFinite(point.close) &&
            point.close > 0
        )?.date ?? null,
      currentPrice: livePrice == null ? null : livePrice * currencyRate,
      currentValue,
      initialValue,
      totalPaid,
      totalGain,
    } as EnrichedInvestment;
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
  const today = normalizeDateKey(new Date());
  const lots = rows.map((row) => ({
    start: normalizeDateKey(row.created_at ?? new Date()),
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

function todayDateKey(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0] ?? '';
}

function mergeSnapshotsByDate(
  snapshots: Array<{ snapshot_date: string; value: string | number }>
): Map<string, number> {
  const merged = new Map<string, number>();
  for (const row of snapshots) {
    const dateKey = row.snapshot_date;
    const value = Number(row.value);
    merged.set(dateKey, (merged.get(dateKey) ?? 0) + value);
  }
  return merged;
}

export async function buildPortfolioHistoryWithSnapshots(
  userIds: string[],
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): Promise<{ date: string; value: number }[]> {
  if (rows.length === 0) return [];

  const todayKey = todayDateKey();
  const yesterdayKey = yesterdayDateKey();
  const rowsByUser = new Map<string, InvestmentRow[]>();

  for (const row of rows) {
    const list = rowsByUser.get(row.user_id) ?? [];
    list.push(row);
    rowsByUser.set(row.user_id, list);
  }

  const existingSnapshots = await PortfolioSnapshotRepository.findByUserIds(userIds);
  const snapshotsToPersist: Array<{ user_id: string; snapshot_date: string; value: string }> = [];

  for (const userId of userIds) {
    const userRows = rowsByUser.get(userId) ?? [];
    if (userRows.length === 0) continue;

    const userSnapshots = existingSnapshots.filter((s) => s.user_id === userId);
    const latestSnapshotDate = userSnapshots.reduce<string | null>((max, snap) => {
      if (!max || snap.snapshot_date > max) return snap.snapshot_date;
      return max;
    }, null);

    const fullHistory = buildPortfolioHistory(userRows, seriesIndex);
    const closedHistory = fullHistory.filter(
      (point) => point.date <= yesterdayKey && point.date > (latestSnapshotDate ?? '')
    );

    for (const point of closedHistory) {
      snapshotsToPersist.push({
        user_id: userId,
        snapshot_date: point.date,
        value: point.value.toFixed(2),
      });
    }
  }

  if (snapshotsToPersist.length > 0) {
    await PortfolioSnapshotRepository.upsertMany(snapshotsToPersist);
  }

  const allSnapshots = await PortfolioSnapshotRepository.findByUserIds(userIds);
  const merged = mergeSnapshotsByDate(allSnapshots);
  const present = new Set(
    allSnapshots.map((snapshot) => `${snapshot.user_id}:${snapshot.snapshot_date}`)
  );
  for (const date of merged.keys()) {
    // A group total is unavailable if any user holding assets that day has no snapshot.
    const complete = rows.every(
      (row) =>
        normalizeDateKey(row.created_at ?? new Date()) > date ||
        present.has(`${row.user_id}:${date}`)
    );
    if (!complete) merged.delete(date);
  }

  if (merged.size === 0) {
    return buildPortfolioHistory(rows, seriesIndex);
  }

  const liveToday = buildPortfolioHistory(rows, seriesIndex).find((p) => p.date === todayKey);
  if (liveToday && liveToday.value > 0) {
    merged.set(todayKey, liveToday.value);
  }

  return [...merged.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
