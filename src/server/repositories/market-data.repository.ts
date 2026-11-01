import { resolveDb, type DbExecutor } from './db-executor';
import { db } from '@/server/db/drizzle';
import { marketDataCache } from '@/server/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
import { normalizeSeriesValues } from '@/lib/types/market-data.types';
import type { MarketDataCacheRow, TimeSeriesEntry } from '@/lib/types/market-data.types';

export class MarketDataRepository {
  static async findBySymbol(symbol: string): Promise<MarketDataCacheRow | null> {
    const records = await db
      .select()
      .from(marketDataCache)
      .where(eq(marketDataCache.symbol, symbol.toUpperCase()));
    return records.length > 0 ? (records[0] as unknown as MarketDataCacheRow) : null;
  }

  static async findBySymbols(
    symbols: string[],
    executor?: DbExecutor
  ): Promise<MarketDataCacheRow[]> {
    if (symbols.length === 0) return [];
    const normalized = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
    const records = await resolveDb(executor)
      .select()
      .from(marketDataCache)
      .where(inArray(marketDataCache.symbol, normalized));
    return records as unknown as MarketDataCacheRow[];
  }

  static async upsert(symbol: string, data: TimeSeriesEntry[]) {
    await db
      .insert(marketDataCache)
      .values({
        symbol: symbol.toUpperCase(),
        data: normalizeSeriesValues(data),
        last_updated: new Date(),
      })
      .onConflictDoUpdate({
        target: marketDataCache.symbol,
        set: {
          // Keep older closes when providers return only a rolling quote window.
          data: sql`(select coalesce(jsonb_agg(point order by point->>'datetime' desc), '[]'::jsonb)
            from (select distinct on (point->>'datetime') point
              from (select value as point, 0 as priority from jsonb_array_elements(
                case when jsonb_typeof(${marketDataCache.data}) = 'array' then ${marketDataCache.data} else '[]'::jsonb end)
                union all select value, 1 from jsonb_array_elements(excluded.data)) values_by_source
              order by point->>'datetime', priority desc) unique_days)`,
          last_updated: new Date(),
        },
      });
  }
}
