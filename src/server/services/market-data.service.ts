import { supabase } from '@/server/db/supabase';
import { twelveData } from '@/lib/twelve-data';
import { cache } from 'react';
import type {
  TimeSeriesEntry,
  MarketDataCacheRow,
  MarketDataBatchResult,
} from '@/lib/types/market-data.types';
import { getLatestCloseFromSeries, normalizeSeriesValues } from '@/lib/types/market-data.types';

/**
 * Service to handle market data fetching with caching strategy.
 * Flow:
 * 1. Check DB for `market_data_cache` entry for the symbol.
 * 2. If exists and fresh (<24h), return cached data.
 * 3. If stale or missing, fetch from Twelve Data API.
 * 4. Upsert data into DB.
 * 5. Return data.
 */
export class MarketDataService {
  private static readonly refreshInFlight = new Map<string, Promise<void>>();
  private static readonly lastRefreshAttemptAt = new Map<string, number>();
  private static readonly REFRESH_COOLDOWN_MS = 60_000;

  static async getCachedSeriesBySymbols(symbols: string[]): Promise<MarketDataCacheRow[]> {
    const normalized = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
    if (normalized.length === 0) return [];

    const { data, error } = await supabase
      .from('market_data_cache')
      .select('symbol, data, last_updated')
      .in('symbol', normalized);

    if (error) {
      console.error('[MarketData] Error fetching cached series:', error);
      return [];
    }

    return (data || []) as MarketDataCacheRow[];
  }

  static async getCachedQuotePrices(symbols: string[]): Promise<Record<string, number>> {
    const normalized = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
    if (normalized.length === 0) return {};

    const { data, error } = await supabase
      .from('market_data_cache')
      .select('symbol, data')
      .in('symbol', normalized);

    if (error) {
      console.error('[MarketData] Error fetching cached quotes:', error);
      return {};
    }

    const priceMap: Record<string, number> = {};
    (data || []).forEach((row) => {
      const cacheRow = row as MarketDataCacheRow;
      const latestClose = getLatestCloseFromSeries(cacheRow?.data);
      const symbol = String(cacheRow?.symbol || '').toUpperCase();
      if (symbol && latestClose > 0) {
        priceMap[symbol] = latestClose;
      }
    });

    return priceMap;
  }

  static async getCachedMarketData(symbol: string): Promise<TimeSeriesEntry[]> {
    const normalizedSymbol = symbol.toUpperCase();
    const { data, error } = await supabase
      .from('market_data_cache')
      .select('data')
      .eq('symbol', normalizedSymbol)
      .single();

    if (!error && data) {
      const cacheData = data as { data?: TimeSeriesEntry[] };
      const values = cacheData.data;
      return Array.isArray(values) ? normalizeSeriesValues(values) : [];
    }

    if (error && error.code !== 'PGRST116') {
      console.error(`[MarketData] Error reading cache for ${normalizedSymbol}:`, error);
    }

    // Cache miss: do not block UI render on external API latency.
    this.refreshMarketDataInBackground(normalizedSymbol);
    return [];
  }

  private static readonly getBatchQuotesCached = cache(async (symbolsKey: string) => {
    const symbols = symbolsKey.split(',').filter(Boolean);
    return twelveData.getQuotes(symbols);
  });

  static async getQuotes(symbols: string[]) {
    const normalized = Array.from(new Set(symbols.map((s) => s.toUpperCase()))).sort((a, b) =>
      a.localeCompare(b)
    );
    if (normalized.length === 0) return {};
    const symbolsKey = normalized.join(',');
    return this.getBatchQuotesCached(symbolsKey);
  }

  static async getMarketData(symbol: string): Promise<TimeSeriesEntry[]> {
    try {
      const normalizedSymbol = symbol.toUpperCase();

      // 1. Check cache
      const cacheResult = await this.getCacheEntry(normalizedSymbol);
      if (cacheResult.isFresh && cacheResult.data) {
        return cacheResult.data;
      }

      // 2. Fetch from API
      const values = await this.fetchMarketDataFromApi(normalizedSymbol);

      // 3. Handle results
      if (values.length > 0) {
        await this.saveMarketDataToCache(normalizedSymbol, values);
        return values;
      }

      // Fallback: return stale cache if API failed
      if (cacheResult.data) {
        console.warn(
          `[MarketData] Returning stale cache for ${normalizedSymbol} due to API error.`
        );
        return cacheResult.data;
      }

      return [];
    } catch (error) {
      console.error('[MarketData] Error in getMarketData:', error);
      return [];
    }
  }

  private static async getCacheEntry(
    symbol: string
  ): Promise<{ data: TimeSeriesEntry[] | null; isFresh: boolean }> {
    const { data: cached } = await supabase
      .from('market_data_cache')
      .select('*')
      .eq('symbol', symbol)
      .single();

    const cachedRow = cached as MarketDataCacheRow | null;
    if (!cachedRow?.data) return { data: null, isFresh: false };

    const now = new Date();
    const isFresh =
      cachedRow.last_updated &&
      now.getTime() - new Date(cachedRow.last_updated).getTime() < 24 * 60 * 60 * 1000;

    const data = Array.isArray(cachedRow.data) ? normalizeSeriesValues(cachedRow.data) : [];
    return { data, isFresh: !!isFresh };
  }

  private static async fetchMarketDataFromApi(symbol: string): Promise<TimeSeriesEntry[]> {
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

    return timeSeries && timeSeries.length > 0
      ? normalizeSeriesValues(timeSeries as TimeSeriesEntry[])
      : [];
  }

  private static async saveMarketDataToCache(symbol: string, data: TimeSeriesEntry[]) {
    try {
      await supabase.from('market_data_cache').upsert(
        {
          symbol,
          data,
          last_updated: new Date().toISOString(),
        } as never,
        { onConflict: 'symbol' }
      );
    } catch (dbError) {
      console.error(`[MarketData] Database save error for ${symbol}:`, dbError);
    }
  }

  private static refreshMarketDataInBackground(symbol: string): void {
    if (this.refreshInFlight.has(symbol)) return;

    const now = Date.now();
    const lastAttempt = this.lastRefreshAttemptAt.get(symbol);
    if (lastAttempt && now - lastAttempt < this.REFRESH_COOLDOWN_MS) {
      return;
    }

    this.lastRefreshAttemptAt.set(symbol, now);

    const refreshPromise: Promise<void> = this.getMarketData(symbol)
      .then(() => undefined)
      .catch((err) => {
        console.error(`[MarketData] Background refresh failed for ${symbol}:`, err);
      })
      .finally(() => {
        this.refreshInFlight.delete(symbol);
      });

    this.refreshInFlight.set(symbol, refreshPromise);
  }

  /**
   * Batch fetch for multiple symbols (used for portfolio)
   */
  static async getBatchMarketData(symbols: string[]): Promise<MarketDataBatchResult[]> {
    // Process in parallel
    const results = await Promise.all(
      symbols.map(async (sym) => ({
        symbol: sym,
        data: await this.getMarketData(sym),
      }))
    );

    return results;
  }
}
