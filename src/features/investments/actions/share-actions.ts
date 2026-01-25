'use server';

import { AvailableSharesService, MarketDataService } from '@/server/services';
import { twelveData } from '@/lib/twelve-data';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Get all available regions for the share selector
 */
export async function getShareRegionsAction(): Promise<ServiceResult<string[]>> {
  try {
    const regions = await AvailableSharesService.getRegions();
    return { data: regions, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching regions:', error);
    return { data: null, error: 'Failed to fetch regions' };
  }
}

/**
 * Get asset types for a specific region
 */
export async function getShareAssetTypesAction(region: string): Promise<ServiceResult<string[]>> {
  try {
    const assetTypes = await AvailableSharesService.getAssetTypes(region);
    return { data: assetTypes, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching asset types:', error);
    return { data: null, error: 'Failed to fetch asset types' };
  }
}

/**
 * Get shares filtered by region and asset type
 */
export async function getSharesAction(
  region: string,
  assetType: string
): Promise<ServiceResult<AvailableShare[]>> {
  try {
    const shares = await AvailableSharesService.getShares(region, assetType);
    return { data: shares, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching shares:', error);
    return { data: null, error: 'Failed to fetch shares' };
  }
}

/**
 * Get popular shares for quick access
 */
export async function getPopularSharesAction(): Promise<ServiceResult<AvailableShare[]>> {
  try {
    const shares = await AvailableSharesService.getPopularShares();
    return { data: shares, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching popular shares:', error);
    return { data: null, error: 'Failed to fetch popular shares' };
  }
}

/**
 * Search shares by symbol or name
 */
export async function searchSharesAction(query: string): Promise<ServiceResult<AvailableShare[]>> {
  try {
    const shares = await AvailableSharesService.searchShares(query);
    return { data: shares, error: null };
  } catch (error) {
    console.error('[ShareActions] Error searching shares:', error);
    return { data: null, error: 'Failed to search shares' };
  }
}

/**
 * Fetch a new share from Twelve Data API and save it to the catalog
 * Used when user requests a share not in our database
 */
export async function fetchAndSaveNewShareAction(
  symbol: string,
  region: string = 'north_america',
  assetType: string = 'stock'
): Promise<ServiceResult<AvailableShare>> {
  try {
    // Check if share already exists
    const existingShare = await AvailableSharesService.getShareBySymbol(symbol);
    if (existingShare) {
      return { data: existingShare, error: null };
    }

    // Fetch quote from Twelve Data to get share info
    const quote = await twelveData.getQuote(symbol.toUpperCase());

    if (!quote) {
      return { data: null, error: `Could not find share with symbol: ${symbol}` };
    }

    // Also fetch and cache the market data for this symbol
    await MarketDataService.getMarketData(symbol.toUpperCase());

    // Add to our catalog
    const newShare = await AvailableSharesService.addShare({
      symbol: quote.symbol.toUpperCase(),
      name: quote.name || symbol.toUpperCase(),
      region: region,
      asset_type: assetType,
      exchange: quote.exchange || null,
      currency: quote.currency || 'USD',
      is_popular: false,
    });

    if (!newShare) {
      return { data: null, error: 'Failed to save share to catalog' };
    }

    return { data: newShare, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching and saving share:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch share'
    };
  }
}
