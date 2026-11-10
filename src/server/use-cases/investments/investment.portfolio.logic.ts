import { financialDecimal } from '@/lib/utils/financial-decimal';
import { financialDateKey } from '@/lib/utils/financial-date';
import {
  buildSeriesIndex,
  getExactCloseForDate,
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

import { conversionSymbol } from './currency-conversion';

type InvestmentRow = typeof investments.$inferSelect;

export type SeriesIndex = Record<string, ParsedSeriesPoint[]>;

export type PrecomputedPortfolioTotals = {
  totalInvested: string | number;
  totalTaxPaid: string | number;
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
  let totalInvested = financialDecimal(precomputedTotals?.totalInvested ?? 0);
  let totalTaxPaid = financialDecimal(precomputedTotals?.totalTaxPaid ?? 0);
  let totalCurrentValue = financialDecimal(0);
  let totalInitialValue = financialDecimal(0);
  let currentComplete = true;
  let initialComplete = true;
  const trackTotalsInLoop = !precomputedTotals;

  const enrichedInvestments: EnrichedInvestment[] = rows.map((inv) => {
    const symbolKey = inv.symbol.toUpperCase();
    const rateSymbol = conversionSymbol(inv.currency);
    const currencyRate =
      inv.currency === 'EUR'
        ? '1'
        : rateSymbol
          ? getExactCloseForDate(seriesIndex[rateSymbol], financialDateKey(new Date()))
          : null;
    const shares = financialDecimal(inv.shares_acquired);

    const symbolData = seriesIndex[symbolKey];
    const livePrice = getExactCloseForDate(symbolData, financialDateKey(new Date()));
    const currentValue =
      livePrice == null || currencyRate == null
        ? null
        : financialDecimal(livePrice).times(currencyRate).times(shares);

    const creationDateKey = financialDateKey(inv.created_at || new Date());
    const initialPrice = getExactCloseForDate(symbolData, creationDateKey);
    const historicalRate = financialDecimal(inv.currency === 'EUR' ? '1' : inv.currency_rate);
    const initialValue =
      initialPrice == null || !historicalRate.isFinite() || historicalRate.lte(0)
        ? null
        : financialDecimal(initialPrice).times(historicalRate).times(shares);

    const investmentAmount = financialDecimal(inv.amount);
    const taxPaid = financialDecimal(inv.tax_paid);
    const totalPaid = investmentAmount.plus(taxPaid);
    const totalGain = currentValue == null ? null : currentValue.minus(totalPaid);

    if (trackTotalsInLoop) {
      totalInvested = totalInvested.plus(investmentAmount);
      totalTaxPaid = totalTaxPaid.plus(taxPaid);
    }
    if (currentValue == null) currentComplete = false;
    else totalCurrentValue = totalCurrentValue.plus(currentValue);
    if (initialValue == null) initialComplete = false;
    else totalInitialValue = totalInitialValue.plus(initialValue);

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
      currentPrice:
        livePrice == null || currencyRate == null
          ? null
          : financialDecimal(livePrice).times(currencyRate).toNumber(),
      currentValue: currentValue?.toNumber() ?? null,
      initialValue: initialValue?.toNumber() ?? null,
      totalPaid: totalPaid.toNumber(),
      totalGain: totalGain?.toNumber() ?? null,
    };
  });

  const totalPaid = totalInvested.plus(totalTaxPaid);
  const totalReturn = currentComplete ? totalCurrentValue.minus(totalPaid) : null;
  const totalReturnPercent =
    totalReturn == null
      ? null
      : totalPaid.gt(0)
        ? totalReturn.div(totalPaid).times(100).toNumber()
        : 0;

  const allocationMap = new Map<string, ReturnType<typeof financialDecimal>>();
  for (const inv of rows) {
    const key = inv.symbol.toUpperCase();
    allocationMap.set(
      key,
      (allocationMap.get(key) ?? financialDecimal(0)).plus(inv.amount).plus(inv.tax_paid)
    );
  }
  const assetAllocation = [...allocationMap.entries()]
    .map(([symbol, value]) => ({ symbol, value: value.toNumber() }))
    .sort((a, b) => b.value - a.value);

  return {
    investments: enrichedInvestments,
    summary: {
      totalInvested: totalInvested.toNumber(),
      totalTaxPaid: totalTaxPaid.toNumber(),
      totalPaid: totalPaid.toNumber(),
      totalCurrentValue: currentComplete ? totalCurrentValue.toNumber() : null,
      totalInitialValue: initialComplete ? totalInitialValue.toNumber() : null,
      totalReturn: totalReturn?.toNumber() ?? null,
      totalReturnPercent,
    },
    assetAllocation,
  };
}

/** Carry the last known close forward; never invent a value before the first quote. */
export function buildPortfolioHistoryExact(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): { date: string; value: string }[] {
  if (rows.length === 0) return [];
  const today = financialDateKey(new Date());
  const lots = rows.map((row) => ({
    start: financialDateKey(row.created_at ?? new Date()),
    symbol: row.symbol.toUpperCase(),
    units: financialDecimal(row.shares_acquired),
    currency: row.currency,
    rateSymbol: conversionSymbol(row.currency),
  }));
  const earliest = lots.reduce((min, lot) => (lot.start < min ? lot.start : min), today);
  const current = new Date(`${earliest}T00:00:00Z`);
  const states = new Map<string, { cursor: number; price: string | null }>();
  for (const lot of lots) {
    states.set(lot.symbol, { cursor: 0, price: null });
    if (lot.rateSymbol) states.set(lot.rateSymbol, { cursor: 0, price: null });
  }
  const history: { date: string; value: string }[] = [];
  const startDates = new Set(lots.map((lot) => lot.start));
  const valuedGroups = new Map<
    string,
    {
      units: ReturnType<typeof financialDecimal>;
      active: boolean;
      currency: string;
      priceState: { cursor: number; price: string | null };
      rateState: { cursor: number; price: string | null } | undefined;
    }
  >();
  for (const lot of lots) {
    const key = `${lot.symbol}:${lot.currency}`;
    if (!valuedGroups.has(key))
      valuedGroups.set(key, {
        units: financialDecimal(0),
        active: false,
        currency: lot.currency,
        priceState: states.get(lot.symbol)!,
        rateState: lot.rateSymbol ? states.get(lot.rateSymbol) : undefined,
      });
  }
  const acquisitions = [...lots].sort((a, b) => a.start.localeCompare(b.start));
  let acquisition = 0;
  let complete = false;
  let value = financialDecimal(0);
  let firstDay = true;
  while (normalizeDateKey(current) <= today) {
    const date = normalizeDateKey(current);
    let changed = firstDay || startDates.has(date);
    for (const [symbol, state] of states) {
      const series = seriesIndex[symbol] ?? [];
      while (state.cursor < series.length && series[state.cursor]!.date <= date) {
        const point = series[state.cursor++]!;
        if (
          Number.isFinite(point.close) &&
          point.close > 0 &&
          (point.exactClose ?? String(point.close)) !== state.price
        ) {
          state.price = point.exactClose ?? String(point.close);
          changed = true;
        }
      }
    }
    while (acquisition < acquisitions.length && acquisitions[acquisition]!.start <= date) {
      const lot = acquisitions[acquisition++]!;
      const group = valuedGroups.get(`${lot.symbol}:${lot.currency}`)!;
      group.units = group.units.plus(lot.units);
      group.active = true;
      changed = true;
    }
    // Reuse the previous daily total only when both holdings and valid prices are unchanged.
    if (changed) {
      complete = true;
      value = financialDecimal(0);
      for (const lot of valuedGroups.values()) {
        if (!lot.active) continue;
        const price = lot.priceState.price;
        const rate = lot.currency === 'EUR' ? 1 : lot.rateState?.price;
        if (price == null || rate == null) {
          complete = false;
          break;
        }
        // Preserve the full quantity and exchange-rate scale until presentation.
        value = value.plus(financialDecimal(price).times(lot.units).times(rate));
      }
    }
    // Incomplete totals must never become immutable financial snapshots.
    if (complete) history.push({ date, value: value.toString() });
    firstDay = false;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return history;
}

export function buildPortfolioHistory(
  rows: InvestmentRow[],
  seriesIndex: SeriesIndex
): { date: string; value: number }[] {
  return buildPortfolioHistoryExact(rows, seriesIndex).map((point) => ({
    date: point.date,
    value: Number(point.value),
  }));
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
  const lotsByUser = new Map<string, InvestmentRow[]>();
  for (const row of rows) {
    const lots = lotsByUser.get(row.user_id) ?? [];
    lots.push(row);
    lotsByUser.set(row.user_id, lots);
  }
  const snapshotsByUser = new Map<string, typeof snapshots>();
  for (const snapshot of snapshots) {
    const points = snapshotsByUser.get(snapshot.user_id) ?? [];
    points.push(snapshot);
    snapshotsByUser.set(snapshot.user_id, points);
  }
  for (const userId of new Set(userIds)) {
    const lots = lotsByUser.get(userId) ?? [];
    if (!lots.length) continue;
    const start = lots.reduce((first, lot) => {
      const day = financialDateKey(lot.created_at ?? new Date());
      return day < first ? day : first;
    }, today);
    starts.set(userId, start);
    const points = new Map<string, number>();
    for (const point of snapshotsByUser.get(userId) ?? []) {
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
    let value = financialDecimal(0);
    let complete = true;
    for (const [userId, points] of byUser) {
      if (starts.get(userId)! > date) continue;
      const point = points.get(date);
      if (point === undefined) {
        complete = false;
        break;
      }
      value = value.plus(point);
    }
    if (complete) result.push({ date, value: value.toNumber() });
  }
  return result;
}
