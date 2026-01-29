import { supabase } from '@/server/db/supabase';
import { twelveData } from "@/lib/twelve-data";
import { cache } from 'react';
import type {
  TimeSeriesEntry,
  MarketDataCacheRow,
  MarketDataBatchResult,
} from '@/lib/types/market-data.types';
import {
  getLatestCloseFromSeries,
  normalizeSeriesValues,
} from '@/lib/types/market-data.types';

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
  static async getCachedSeriesBySymbols(symbols: string[]): Promise<MarketDataCacheRow[]> {
    const normalized = Array.from(new Set(symbols.map(s => s.toUpperCase())));
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
    const normalized = Array.from(new Set(symbols.map(s => s.toUpperCase())));
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

    // Fallback: fetch fresh data, save to DB, then read from cache
    await this.getMarketData(normalizedSymbol);

    const { data: refreshed } = await supabase
      .from('market_data_cache')
      .select('data')
      .eq('symbol', normalizedSymbol)
      .single();

    if (!refreshed) {
      return [];
    }

    const refreshedData = refreshed as { data?: TimeSeriesEntry[] };
    const values = refreshedData.data;
    return Array.isArray(values) ? normalizeSeriesValues(values) : [];
  }

  private static getBatchQuotesCached = cache(async (symbolsKey: string) => {
    const symbols = symbolsKey.split(',').filter(Boolean);
    return twelveData.getQuotes(symbols);
  });

  static async getQuotes(symbols: string[]) {
    const normalized = Array.from(new Set(symbols.map(s => s.toUpperCase()))).sort();
    if (normalized.length === 0) return {};
    const symbolsKey = normalized.join(',');
    return this.getBatchQuotesCached(symbolsKey);
  }

  static async getMarketData(symbol: string): Promise<TimeSeriesEntry[]> {
    try {
      const normalizedSymbol = symbol.toUpperCase();

      // 1. Check cache
      const { data: cached } = await supabase
        .from('market_data_cache')
        .select('*')
        .eq('symbol', normalizedSymbol)
        .single();

      const now = new Date();
      const cachedRow = cached as MarketDataCacheRow | null;
      // Freshness check: 24 hours
      const isFresh = cachedRow && cachedRow.last_updated &&
        (now.getTime() - new Date(cachedRow.last_updated).getTime() < 24 * 60 * 60 * 1000);

      if (isFresh && cachedRow?.data) {
        const cachedValues = cachedRow.data;
        return Array.isArray(cachedValues) ? normalizeSeriesValues(cachedValues) : [];
      }

      // 2. Fetch from API
      let timeSeries = await twelveData.getTimeSeries(
        normalizedSymbol,
        "1day",
        365 * 2
      );

      if (!timeSeries || timeSeries.length === 0) {
        const quote = await twelveData.getQuote(normalizedSymbol);
        if (quote?.close) {
          const datetime = quote.datetime || new Date().toISOString();
          timeSeries = [{
            time: datetime,
            open: quote.open,
            high: quote.high,
            low: quote.low,
            close: quote.close,
            volume: quote.volume,
          }];
        }
      }

      if (!timeSeries || timeSeries.length === 0) {
        // If cache exists but is stale, return it as fallback rather than failing
        if (cachedRow?.data) {
          console.warn(`[MarketData] Returning stale cache for ${normalizedSymbol} due to API error.`);
          const cachedValues = cachedRow.data;
          return Array.isArray(cachedValues) ? normalizeSeriesValues(cachedValues) : [];
        }
        return [];
      }

      const values = normalizeSeriesValues(timeSeries as TimeSeriesEntry[]);

      // 3. Update Cache
      try {
        await supabase
          .from('market_data_cache')
          .upsert({
            symbol: normalizedSymbol,
            data: values,
            last_updated: now.toISOString()
          } as never, { onConflict: 'symbol' });
      } catch (dbError) {
        console.error(`[MarketData] Database save error for ${normalizedSymbol}:`, dbError);
        // Don't throw, just log and return values so UI still works (non-cached)
      }

      return values;

    } catch (error) {
      console.error("[MarketData] Error in getMarketData:", error);
      // Fallback: try to return cache if possible even if checking failed (unlikely) or just return empty
      return [];
    }
  }

  /**
   * Batch fetch for multiple symbols (used for portfolio)
   */
  static async getBatchMarketData(symbols: string[]): Promise<MarketDataBatchResult[]> {
    // Process in parallel
    const results = await Promise.all(
      symbols.map(async (sym) => ({
        symbol: sym,
        data: await this.getMarketData(sym)
      }))
    );

    return results;
  }
}
