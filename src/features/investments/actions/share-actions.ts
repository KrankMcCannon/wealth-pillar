'use server';

import {
  getRegionsUseCase,
  getAssetTypesUseCase,
  getAssetTypesAllUseCase,
  getSharesUseCase,
  getPopularSharesUseCase,
  searchSharesUseCase,
  getShareBySymbolUseCase,
  addShareUseCase,
} from '@/server/use-cases/investments/available-shares.use-cases';
import { getMarketDataUseCase } from '@/server/use-cases/market-data/market-data.use-cases';
import { twelveData } from '@/lib/twelve-data';
import type { Database } from '@/lib/types/database.types';

import type { ServiceResult } from '@/lib/types/service-result';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];

/**
 * Get all available regions for the share selector
 */
export async function getShareRegionsAction(): Promise<ServiceResult<string[]>> {
  try {
    const regions = await getRegionsUseCase();
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
    const assetTypes = await getAssetTypesUseCase(region);
    return { data: assetTypes, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching asset types:', error);
    return { data: null, error: 'Failed to fetch asset types' };
  }
}

/**
 * Get asset types (all)
 */
export async function getShareAssetTypesAllAction(): Promise<ServiceResult<string[]>> {
  try {
    const assetTypes = await getAssetTypesAllUseCase();
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
    const shares = await getSharesUseCase(region, assetType);
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
    const shares = await getPopularSharesUseCase();
    return { data: shares, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching popular shares:', error);
    return { data: null, error: 'Failed to fetch popular shares' };
  }
}

/**
 * Search shares by symbol or name
 */
export async function searchSharesAction(
  query: string,
  assetType?: string
): Promise<ServiceResult<AvailableShare[]>> {
  try {
    const shares = await searchSharesUseCase(query, assetType);
    const needle = query.toLowerCase().trim();

    const scoreShare = (share: AvailableShare): number => {
      const symbol = share.symbol?.toLowerCase() || '';
      const name = share.name?.toLowerCase() || '';

      if (symbol === needle) return 0;
      if (symbol.startsWith(needle)) return 1;
      if (symbol.includes(needle)) return 2;
      if (name.startsWith(needle)) return 3;
      if (name.includes(needle)) return 4;
      return 5;
    };

    const sorted = [...shares].sort((a, b) => {
      const scoreDiff = scoreShare(a) - scoreShare(b);
      if (scoreDiff !== 0) return scoreDiff;
      const symbolDiff = (a.symbol || '').length - (b.symbol || '').length;
      if (symbolDiff !== 0) return symbolDiff;
      return (a.name || '').localeCompare(b.name || '', 'it');
    });

    return { data: sorted, error: null };
  } catch (error) {
    console.error('[ShareActions] Error searching shares:', error);
    return { data: null, error: 'Failed to search shares' };
  }
}

/**
 * Ensure market data is cached for a symbol
 */
export async function ensureMarketDataAction(symbol: string): Promise<ServiceResult<boolean>> {
  try {
    await getMarketDataUseCase(symbol.toUpperCase());
    return { data: true, error: null };
  } catch (error) {
    console.error('[ShareActions] Error ensuring market data:', error);
    return { data: null, error: 'Failed to cache market data' };
  }
}

/**
 * Get a single share by symbol
 */
export async function getShareBySymbolAction(
  symbol: string
): Promise<ServiceResult<AvailableShare | null>> {
  try {
    const share = await getShareBySymbolUseCase(symbol);
    return { data: share, error: null };
  } catch (error) {
    console.error('[ShareActions] Error fetching share by symbol:', error);
    return { data: null, error: 'Failed to fetch share' };
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
    const existingShare = await getShareBySymbolUseCase(symbol);
    if (existingShare) {
      return { data: existingShare, error: null };
    }

    // Fetch quote from Twelve Data to get share info
    const quote = await twelveData.getQuote(symbol.toUpperCase());

    if (!quote) {
      return { data: null, error: `Could not find share with symbol: ${symbol}` };
    }

    // Also fetch and cache the market data for this symbol
    await getMarketDataUseCase(symbol.toUpperCase());

    // Add to our catalog
    const newShare = await addShareUseCase({
      symbol: quote.symbol.toUpperCase(),
      name: quote.name || symbol.toUpperCase(),
      region,
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
      error: error instanceof Error ? error.message : 'Failed to fetch share',
    };
  }
}
