import { db } from '@/server/db/drizzle';
import { marketDataCache } from '@/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { MarketDataCacheRow } from '@/lib/types/market-data.types';

export class MarketDataRepository {
  static async findBySymbol(symbol: string): Promise<MarketDataCacheRow | null> {
    const records = await db
      .select()
      .from(marketDataCache)
      .where(eq(marketDataCache.symbol, symbol.toUpperCase()));
    return records.length > 0 ? (records[0] as unknown as MarketDataCacheRow) : null;
  }

  static async findBySymbols(symbols: string[]): Promise<MarketDataCacheRow[]> {
    if (symbols.length === 0) return [];
    const normalized = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
    const records = await db
      .select()
      .from(marketDataCache)
      .where(inArray(marketDataCache.symbol, normalized));
    return records as unknown as MarketDataCacheRow[];
  }

  static async upsert(symbol: string, data: unknown) {
    await db
      .insert(marketDataCache)
      .values({
        symbol: symbol.toUpperCase(),
        data,
        last_updated: new Date(),
      })
      .onConflictDoUpdate({
        target: marketDataCache.symbol,
        set: {
          data,
          last_updated: new Date(),
        },
      });
  }
}
