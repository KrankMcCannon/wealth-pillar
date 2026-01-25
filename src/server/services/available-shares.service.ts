import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];
type AvailableShareInsert = Database['public']['Tables']['available_shares']['Insert'];

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
    let query = supabase
      .from('available_shares')
      .select(column)
      .order(column);

    if (filters?.region) {
      query = query.eq('region', filters.region);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AvailableSharesService] Error fetching distinct values:', error);
      return [];
    }

    const values = (data as Record<string, string>[]).map(item => item[column]);
    return [...new Set(values)];
  }

  /**
   * Get all distinct regions
   */
  static getRegions = cache(async (): Promise<string[]> => {
    return this.getDistinctColumn('region');
  });

  /**
   * Get asset types for a specific region
   */
  static getAssetTypes = cache(async (region: string): Promise<string[]> => {
    return this.getDistinctColumn('asset_type', { region });
  });

  /**
   * Get shares filtered by region and asset type
   */
  static getShares = cache(async (region: string, assetType: string): Promise<AvailableShare[]> => {
    const { data, error } = await supabase
      .from('available_shares')
      .select('*')
      .eq('region', region)
      .eq('asset_type', assetType)
      .order('is_popular', { ascending: false })
      .order('name');

    if (error) {
      console.error('[AvailableSharesService] Error fetching shares:', error);
      return [];
    }

    return data as AvailableShare[];
  });

  /**
   * Get popular shares (for quick access)
   */
  static getPopularShares = cache(async (): Promise<AvailableShare[]> => {
    const { data, error } = await supabase
      .from('available_shares')
      .select('*')
      .eq('is_popular', true)
      .order('name');

    if (error) {
      console.error('[AvailableSharesService] Error fetching popular shares:', error);
      return [];
    }

    return data as AvailableShare[];
  });

  /**
   * Search shares by symbol or name
   */
  static searchShares = cache(async (query: string): Promise<AvailableShare[]> => {
    const searchTerm = `%${query.toLowerCase()}%`;

    const { data, error } = await supabase
      .from('available_shares')
      .select('*')
      .or(`symbol.ilike.${searchTerm},name.ilike.${searchTerm}`)
      .order('is_popular', { ascending: false })
      .order('name')
      .limit(20);

    if (error) {
      console.error('[AvailableSharesService] Error searching shares:', error);
      return [];
    }

    return data as AvailableShare[];
  });

  /**
   * Get a single share by symbol
   */
  static getShareBySymbol = cache(async (symbol: string): Promise<AvailableShare | null> => {
    const { data, error } = await supabase
      .from('available_shares')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Not found is not an error
        console.error('[AvailableSharesService] Error fetching share:', error);
      }
      return null;
    }

    return data as AvailableShare;
  });

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
