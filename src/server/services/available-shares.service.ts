import { supabase } from '@/server/db/supabase';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];
type AvailableShareInsert = Database['public']['Tables']['available_shares']['Insert'];

type ShareListRow = Pick<
  AvailableShare,
  'id' | 'symbol' | 'name' | 'region' | 'asset_type' | 'exchange' | 'currency' | 'is_popular'
>;

type RegionRow = { region: string };
type AssetTypeRow = { asset_type: string };

/**
 * Available Shares Service
 * 
 * Manages the catalog of available shares for the Trade Republic-style
 * cascading dropdown selector.
 */
export class AvailableSharesService {
  private static async getDistinctColumn(
    column: 'region' | 'asset_type',
    filters?: { region?: string }
  ): Promise<string[]> {
    const supabaseAny = supabase as any;

    if (column === 'region') {
      const { data, error } = await supabaseAny.rpc('get_available_share_regions');
      if (error) {
        console.error('[AvailableSharesService] Error fetching regions:', error);
        return [];
      }
      return ((data || []) as RegionRow[]).map((row) => row.region);
    }

    const { data, error } = await supabaseAny.rpc('get_available_share_asset_types', {
      p_region: filters?.region ?? null,
    });

    if (error) {
      console.error('[AvailableSharesService] Error fetching asset types:', error);
      return [];
    }

    return ((data || []) as AssetTypeRow[]).map((row) => row.asset_type);
  }

  /**
   * Get all distinct regions
   */
  static async getRegions(): Promise<string[]> {
    return this.getDistinctColumn('region');
  }

  /**
   * Get asset types for a specific region
   */
  static async getAssetTypes(region: string): Promise<string[]> {
    return this.getDistinctColumn('asset_type', { region });
  }

  /**
   * Get all distinct asset types
   */
  static async getAssetTypesAll(): Promise<string[]> {
    return this.getDistinctColumn('asset_type');
  }

  /**
   * Get shares filtered by region and asset type
   */
  static async getShares(region: string, assetType: string): Promise<AvailableShare[]> {
    const { data, error } = await supabase
      .from('available_shares')
      .select('id, symbol, name, region, asset_type, exchange, currency, is_popular')
      .eq('region', region)
      .eq('asset_type', assetType)
      .order('is_popular', { ascending: false })
      .order('name');

    if (error) {
      console.error('[AvailableSharesService] Error fetching shares:', error);
      return [];
    }

    return data as ShareListRow[] as AvailableShare[];
  }

  /**
   * Get popular shares (for quick access)
   */
  static async getPopularShares(): Promise<AvailableShare[]> {
    const supabaseAny = supabase as any;
    const { data, error } = await supabaseAny.rpc('get_popular_shares', { p_limit: 12 });

    if (error) {
      console.error('[AvailableSharesService] Error fetching popular shares:', error);
      return [];
    }

    return data as ShareListRow[] as AvailableShare[];
  }

  /**
   * Search shares by symbol or name
   */
  static async searchShares(query: string, assetType?: string): Promise<AvailableShare[]> {
    const searchTerm = `%${query.toLowerCase()}%`;

    let queryBuilder = supabase
      .from('available_shares')
      .select('id, symbol, name, region, asset_type, exchange, currency, is_popular')
      .or(`symbol.ilike.${searchTerm},name.ilike.${searchTerm}`);

    if (assetType) {
      queryBuilder = queryBuilder.eq('asset_type', assetType);
    }

    const { data, error } = await queryBuilder
      .order('is_popular', { ascending: false })
      .order('name')
      .limit(20);

    if (error) {
      console.error('[AvailableSharesService] Error searching shares:', error);
      return [];
    }

    return data as ShareListRow[] as AvailableShare[];
  }

  /**
   * Get a single share by symbol
   */
  static async getShareBySymbol(symbol: string): Promise<AvailableShare | null> {
    const { data, error } = await supabase
      .from('available_shares')
      .select('id, symbol, name, region, asset_type, exchange, currency, is_popular')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Not found is not an error
        console.error('[AvailableSharesService] Error fetching share:', error);
      }
      return null;
    }

    return data as AvailableShare;
  }

  /**
   * Add a new share to the catalog
   * Used when user requests a share not in the database
   */
  static async addShare(shareData: AvailableShareInsert): Promise<AvailableShare | null> {
    const { data, error } = await supabase
      .from('available_shares')
      .insert(shareData as never)
      .select()
      .single();

    if (error) {
      console.error('[AvailableSharesService] Error adding share:', error);
      return null;
    }

    return data as AvailableShare;
  }

  /**
   * Check if a share exists in the catalog
   */
  static async shareExists(symbol: string): Promise<boolean> {
    const share = await this.getShareBySymbol(symbol);
    return share !== null;
  }
}
