import { prisma } from "@/server/db/prisma";
import { twelveData } from "@/lib/twelve-data";

/**
 * Service to handle market data fetching with caching strategy.
 * Flow:
 * 1. Check DB for `market_data_cache` entry for the symbol.
 * 2. If exists and fresh (< 24h), return cached data.
 * 3. If stale or missing, fetch from Twelve Data API.
 * 4. Upsert data into DB.
 * 5. Return data.
 */
export const MarketDataService = {
  async getMarketData(symbol: string) {
    try {
      const normalizedSymbol = symbol.toUpperCase();

      // 1. Check cache
      const cached = await prisma.market_data_cache.findUnique({
        where: { symbol: normalizedSymbol }
      });

      const now = new Date();
      // Freshness check: 24 hours
      const isFresh = cached && (now.getTime() - new Date(cached.last_updated).getTime() < 24 * 60 * 60 * 1000);

      if (isFresh && cached.data) {
        console.log(`[MarketData] Returning cached data for ${normalizedSymbol}`);
        return cached.data;
      }

      // 2. Fetch from API
      console.log(`[MarketData] Fetching fresh data for ${normalizedSymbol}`);

      const timeSeries = await twelveData.getTimeSeries(
        normalizedSymbol,
        "1day",
        365 * 2
      );

      if (!timeSeries || timeSeries.length === 0) {
        // If cache exists but is stale, return it as fallback rather than failing
        if (cached?.data) {
          console.warn(`[MarketData] Returning stale cache for ${normalizedSymbol} due to API error.`);
          return cached.data;
        }
        return [];
      }

      const values = timeSeries;

      // 3. Update Cache
      console.log(`[MarketData] Saving to cache for ${normalizedSymbol}...`);
      try {
        await prisma.market_data_cache.upsert({
          where: { symbol: normalizedSymbol },
          create: {
            symbol: normalizedSymbol,
            data: values as any, // Cast to any to satisfy Prisma Json type constraints
            last_updated: now
          },
          update: {
            data: values as any,
            last_updated: now
          }
        });
        console.log(`[MarketData] Successfully saved cache for ${normalizedSymbol}`);
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
  },

  /**
   * Batch fetch for multiple symbols (used for portfolio)
   */
  async getBatchMarketData(symbols: string[]) {
    // Process in parallel
    const results = await Promise.all(
      symbols.map(async (sym) => ({
        symbol: sym,
        data: await this.getMarketData(sym)
      }))
    );

    return results;
  }
};
