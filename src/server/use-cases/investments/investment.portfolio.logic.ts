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

const MAX_GAP_FILL_DAYS = 3;

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
  const trackTotalsInLoop = !precomputedTotals;

  const enrichedInvestments: EnrichedInvestment[] = rows.map((inv) => {
    const symbolKey = inv.symbol.toUpperCase();
    const currencyRate = Number(inv.currency_rate) || 1;
    const shares = Number(inv.shares_acquired);

    const symbolData = seriesIndex[symbolKey];
    const livePrice = symbolData ? getCloseForDate(symbolData) : 0;
    const currentValue = livePrice * currencyRate * shares;

    const creationDateKey = normalizeDateKey(inv.created_at || new Date());
    const initialPrice = symbolData ? getCloseForDate(symbolData, creationDateKey) : 0;
    const initialValue = initialPrice * currencyRate * shares;

    const investmentAmount = Number(inv.amount);
    const taxPaid = Number(inv.tax_paid) || 0;
    const totalPaid = investmentAmount + taxPaid;
    const totalGain = currentValue - totalPaid;

    if (trackTotalsInLoop) {
      totalInvested += investmentAmount;
      totalTaxPaid += taxPaid;
    }
    totalCurrentValue += currentValue;
    totalInitialValue += initialValue;

    return {
      ...inv,
      amount: Number(inv.amount),
      shares_acquired: Number(inv.shares_acquired),
      currency_rate: Number(inv.currency_rate),
      tax_paid: Number(inv.tax_paid),
      net_earn: Number(inv.net_earn),
      currentPrice: livePrice * currencyRate,
      currentValue,
      initialValue,
      totalPaid,
      totalGain,
    } as EnrichedInvestment;
  });

  const totalPaid = totalInvested + totalTaxPaid;
  const totalReturn = totalCurrentValue - totalPaid;
  const totalReturnPercent = totalPaid > 0 ? (totalReturn / totalPaid) * 100 : 0;

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
      totalCurrentValue,
      totalInitialValue,
      totalReturn,
      totalReturnPercent,
    },
    assetAllocation,
  };
}

function seriesIndexToDailyPrices(
  seriesIndex: SeriesIndex
): Record<string, Record<string, number>> {
  const historyMap: Record<string, Record<string, number>> = {};
  for (const [symbol, points] of Object.entries(seriesIndex)) {
    const symbolMap: Record<string, number> = {};
    for (const point of points) {
      symbolMap[point.date] = point.close;
    }
    historyMap[symbol] = symbolMap;
  }
  return historyMap;
}

function daysBetweenLater(laterDateKey: string, earlierDateKey: string): number {
  const later = new Date(`${laterDateKey}T00:00:00Z`).getTime();
  const earlier = new Date(`${earlierDateKey}T00:00:00Z`).getTime();
  return Math.round((later - earlier) / 86_400_000);
}

type SymbolPriceState = { price: number; dateKey: string };

function resolvePriceForDay(
  dailyPrices: Record<string, number>,
  dateKey: string,
  state: SymbolPriceState | undefined
): { price: number | undefined; nextState: SymbolPriceState | undefined } {
  const exact = dailyPrices[dateKey];
  if (exact !== undefined) {
    return { price: exact, nextState: { price: exact, dateKey } };
  }
  if (state && daysBetweenLater(dateKey, state.dateKey) <= MAX_GAP_FILL_DAYS) {
    return { price: state.price, nextState: state };
  }
  return { price: undefined, nextState: state };
}

export function buildPortfolioHistory(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): { date: string; value: number }[] {
  if (rows.length === 0) return [];

  const historyMap = seriesIndexToDailyPrices(seriesIndex);

  const earliestDate = rows.reduce((min: Date, inv) => {
    const d = new Date(inv.created_at || new Date());
    return d < min ? d : min;
  }, new Date());

  const endDate = new Date();
  const portfolioHistory: { date: string; value: number }[] = [];
  const currentDate = new Date(earliestDate);
  const symbolStates: Record<string, SymbolPriceState | undefined> = {};

  while (currentDate.getTime() <= endDate.getTime()) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateStr) {
      let totalValue = 0;

      for (const inv of rows) {
        const invDate = new Date(inv.created_at || new Date());
        if (invDate > currentDate) continue;

        const symbol = inv.symbol.toUpperCase();
        const dailyPrices = historyMap[symbol];
        if (!dailyPrices) continue;

        const { price } = resolvePriceForDay(dailyPrices, dateStr, symbolStates[symbol]);
        if (price !== undefined) {
          totalValue += price * Number(inv.shares_acquired) * (Number(inv.currency_rate) || 1);
        }
      }

      for (const symbol of Object.keys(historyMap)) {
        const dailyPrices = historyMap[symbol];
        if (!dailyPrices) continue;
        const { nextState } = resolvePriceForDay(dailyPrices, dateStr, symbolStates[symbol]);
        symbolStates[symbol] = nextState;
      }

      if (totalValue > 0) {
        portfolioHistory.push({ date: dateStr, value: totalValue });
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return portfolioHistory;
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
  const merged = mergeSnapshotsByDate([
    ...allSnapshots,
    ...snapshotsToPersist.map((snap) => ({
      snapshot_date: snap.snapshot_date,
      value: snap.value,
    })),
  ]);

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
