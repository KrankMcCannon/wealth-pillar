import { MarketDataRepository } from '@/server/repositories/market-data.repository';
import { twelveData } from '@/lib/twelve-data';
import type { TimeSeriesEntry, MarketDataBatchResult } from '@/lib/types/market-data.types';
import {
  normalizeSeriesValues,
  getLatestCloseFromSeries as getLatestClose,
} from '@/lib/types/market-data.types';

const refreshInFlight = new Map<string, Promise<void>>();
const lastRefreshAttemptAt = new Map<string, number>();
const REFRESH_COOLDOWN_MS = 60_000;

export async function getMarketDataUseCase(symbol: string): Promise<TimeSeriesEntry[]> {
  const normalizedSymbol = symbol.toUpperCase();

  // 1. Check cache
  const cached = await MarketDataRepository.findBySymbol(normalizedSymbol);
  const now = new Date();
  const isFresh =
    cached?.last_updated &&
    now.getTime() - new Date(cached.last_updated).getTime() < 24 * 60 * 60 * 1000;

  if (isFresh && cached?.data) {
    return normalizeSeriesValues(cached.data);
  }

  // 2. Refresh needed - handle in background if we have stale data
  if (cached?.data) {
    refreshMarketDataInBackground(normalizedSymbol);
    return normalizeSeriesValues(cached.data);
  }

  // 3. Force fetch if no data at all
  return await fetchAndCacheMarketData(normalizedSymbol);
}

export async function getBatchMarketDataUseCase(
  symbols: string[]
): Promise<MarketDataBatchResult[]> {
  const results = await Promise.all(
    symbols.map(async (sym) => ({
      symbol: sym,
      data: await getMarketDataUseCase(sym),
    }))
  );
  return results;
}

export async function getCachedQuotePricesUseCase(
  symbols: string[]
): Promise<Record<string, number>> {
  const records = await MarketDataRepository.findBySymbols(symbols);
  const priceMap: Record<string, number> = {};

  records.forEach((row) => {
    const latestClose = getLatestClose(row.data);
    if (latestClose > 0) {
      priceMap[row.symbol.toUpperCase()] = latestClose;
    }
  });

  return priceMap;
}

// Internal Helpers

async function fetchAndCacheMarketData(symbol: string): Promise<TimeSeriesEntry[]> {
  try {
    let timeSeries = await twelveData.getTimeSeries(symbol, '1day', 365 * 2);

    if (!timeSeries || timeSeries.length === 0) {
      const quote = await twelveData.getQuote(symbol);
      if (quote?.close) {
        const datetime = quote.datetime || new Date().toISOString();
        timeSeries = [
          {
            time: datetime,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume,
          },
        ];
      }
    }

    const values =
      timeSeries && timeSeries.length > 0
        ? normalizeSeriesValues(timeSeries as TimeSeriesEntry[])
        : [];

    if (values.length > 0) {
      await MarketDataRepository.upsert(symbol, values);
    }

    return values;
  } catch (error) {
    console.error(`[MarketDataUseCase] Error fetching data for ${symbol}:`, error);
    return [];
  }
}

function refreshMarketDataInBackground(symbol: string): void {
  if (refreshInFlight.has(symbol)) return;

  const now = Date.now();
  const lastAttempt = lastRefreshAttemptAt.get(symbol);
  if (lastAttempt && now - lastAttempt < REFRESH_COOLDOWN_MS) return;

  lastRefreshAttemptAt.set(symbol, now);

  const refreshPromise = fetchAndCacheMarketData(symbol)
    .then(() => undefined)
    .catch((err) =>
      console.error(`[MarketDataUseCase] Background refresh failed for ${symbol}:`, err)
    )
    .finally(() => refreshInFlight.delete(symbol));

  refreshInFlight.set(symbol, refreshPromise);
}
