import { db } from '@/server/db/drizzle';
import { availableShares } from '@/server/db/schema';
import { eq, and, ilike, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export class AvailableSharesRepository {
  static async getRegions(): Promise<string[]> {
    const records = await db.execute<{ region: string }>(
      sql`SELECT region FROM get_available_share_regions()`
    );
    return (records as unknown as { region: string }[]).map((r) => r.region);
  }

  static async getAssetTypes(region: string | null): Promise<string[]> {
    const records = await db.execute<{ asset_type: string }>(
      sql`SELECT asset_type FROM get_available_share_asset_types(${region})`
    );
    return (records as unknown as { asset_type: string }[]).map((r) => r.asset_type);
  }

  static async getPopular(limit: number) {
    const records = await db.execute(sql`SELECT * FROM get_popular_shares(${limit})`);
    return records;
  }

  static async findByFilters(region: string, assetType: string) {
    return await db
      .select()
      .from(availableShares)
      .where(and(eq(availableShares.region, region), eq(availableShares.asset_type, assetType)))
      .orderBy(sql`${availableShares.is_popular} DESC, ${availableShares.name} ASC`);
  }

  static async search(query: string, assetType?: string) {
    const searchTerm = `%${query}%`;
    let whereClause = or(
      ilike(availableShares.symbol, searchTerm),
      ilike(availableShares.name, searchTerm)
    );

    if (assetType) {
      whereClause = and(whereClause, eq(availableShares.asset_type, assetType));
    }

    return await db
      .select()
      .from(availableShares)
      .where(whereClause)
      .orderBy(sql`${availableShares.is_popular} DESC, ${availableShares.name} ASC`)
      .limit(20);
  }

  static async findBySymbol(symbol: string) {
    const records = await db
      .select()
      .from(availableShares)
      .where(eq(availableShares.symbol, symbol.toUpperCase()));
    return records.length > 0 ? records[0] : null;
  }

  static async create(data: typeof availableShares.$inferInsert) {
    const records = await db.insert(availableShares).values(data).returning();
    return records.length > 0 ? records[0] : null;
  }
}
