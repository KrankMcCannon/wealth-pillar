import { AvailableSharesRepository } from '@/server/repositories/available-shares.repository';
import { cached } from '@/lib/cache';
import { serialize } from '@/lib/utils/serializer';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];
type AvailableShareInsert = Database['public']['Tables']['available_shares']['Insert'];

export async function getRegionsUseCase(): Promise<string[]> {
  const getCachedRegions = cached(
    async () => await AvailableSharesRepository.getRegions(),
    ['available-shares-regions'],
    { revalidate: 3600 }
  );
  return await getCachedRegions();
}

export async function getAssetTypesUseCase(region: string): Promise<string[]> {
  const getCachedAssetTypes = cached(
    async () => await AvailableSharesRepository.getAssetTypes(region),
    ['available-shares-asset-types', region],
    { revalidate: 3600 }
  );
  return await getCachedAssetTypes();
}

export async function getAssetTypesAllUseCase(): Promise<string[]> {
  const getCachedAssetTypes = cached(
    async () => await AvailableSharesRepository.getAssetTypes(null),
    ['available-shares-asset-types-all'],
    { revalidate: 3600 }
  );
  return await getCachedAssetTypes();
}

export async function getSharesUseCase(
  region: string,
  assetType: string
): Promise<AvailableShare[]> {
  const getCachedShares = cached(
    async () => {
      const shares = await AvailableSharesRepository.findByFilters(region, assetType);
      return serialize(shares) as unknown as AvailableShare[];
    },
    ['available-shares-list', region, assetType],
    { revalidate: 3600 }
  );
  return await getCachedShares();
}

export async function getPopularSharesUseCase(): Promise<AvailableShare[]> {
  const getCachedPopular = cached(
    async () => {
      const shares = await AvailableSharesRepository.getPopular(12);
      return serialize(shares) as unknown as AvailableShare[];
    },
    ['available-shares-popular'],
    { revalidate: 3600 }
  );
  return await getCachedPopular();
}

export async function searchSharesUseCase(
  query: string,
  assetType?: string
): Promise<AvailableShare[]> {
  const shares = await AvailableSharesRepository.search(query, assetType);
  return serialize(shares) as unknown as AvailableShare[];
}

export async function getShareBySymbolUseCase(symbol: string): Promise<AvailableShare | null> {
  const share = await AvailableSharesRepository.findBySymbol(symbol);
  return share ? (serialize(share) as unknown as AvailableShare) : null;
}

export async function addShareUseCase(data: AvailableShareInsert): Promise<AvailableShare | null> {
  const share = await AvailableSharesRepository.create(data);
  return share ? (serialize(share) as unknown as AvailableShare) : null;
}
