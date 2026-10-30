import * as React from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  ensureMarketDataAction,
  getShareAssetTypesAllAction,
  getShareBySymbolAction,
  searchSharesAction,
} from '@/features/investments/actions/share-actions';
import type { Database } from '@/lib/types/database.types';

export type AvailableShare = Database['public']['Tables']['available_shares']['Row'];

let assetTypesCache: Promise<string[]> | null = null;

function getAssetTypesCached(): Promise<string[]> {
  if (!assetTypesCache) {
    assetTypesCache = getShareAssetTypesAllAction().then((r) => {
      const types = (r.data || []).map((type) => String(type).toLowerCase()).filter(Boolean);
      return Array.from(new Set(types));
    });
  }
  return assetTypesCache;
}

interface UseShareSearchProps {
  initialValue?: string;
  onSelect?: (symbol: string) => void;
}

export function useShareSearch({ initialValue, onSelect }: UseShareSearchProps = {}) {
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResponse, setSearchResponse] = React.useState<{
    key: string;
    results: AvailableShare[];
  } | null>(null);
  const [isEnsuring, setIsEnsuring] = React.useState(false);
  const [selection, setSelection] = React.useState<{
    value: string;
    share: AvailableShare | null;
  } | null>(null);
  const [assetTypes, setAssetTypes] = React.useState<string[]>([]);
  const [selectedAssetType, setSelectedAssetType] = React.useState<string>('all');

  const debouncedSearch = useDebouncedValue(searchValue, 200);
  const trimmedSearch = debouncedSearch.trim();
  const hasSearched = trimmedSearch.length >= 3;
  const searchKey = JSON.stringify([trimmedSearch, selectedAssetType]);
  const isLoading = hasSearched && searchResponse?.key !== searchKey;
  const results = React.useMemo(
    () => (hasSearched && searchResponse?.key === searchKey ? searchResponse.results : []),
    [hasSearched, searchResponse, searchKey]
  );
  const normalizedValue =
    initialValue === undefined ? (selection?.value ?? '') : initialValue.trim();
  const selectedShare = selection?.value === normalizedValue ? selection.share : null;

  // Fetch Asset Types
  React.useEffect(() => {
    let active = true;
    getAssetTypesCached().then((types) => {
      if (!active) return;
      setAssetTypes(types);
    });
    return () => {
      active = false;
    };
  }, []);

  // Search Logic
  React.useEffect(() => {
    let active = true;

    if (!hasSearched) return;

    const assetTypeFilter = selectedAssetType === 'all' ? undefined : selectedAssetType;
    searchSharesAction(trimmedSearch, assetTypeFilter).then(
      (result) => {
        if (active) setSearchResponse({ key: searchKey, results: result.data || [] });
      },
      () => {
        if (active) setSearchResponse({ key: searchKey, results: [] });
      }
    );

    return () => {
      active = false;
    };
  }, [hasSearched, trimmedSearch, selectedAssetType, searchKey]);

  // Initial Value Sync
  React.useEffect(() => {
    let active = true;
    if (!normalizedValue || selectedShare?.symbol === normalizedValue) return;

    getShareBySymbolAction(normalizedValue).then(
      (result) => {
        if (active) setSelection({ value: normalizedValue, share: result.data || null });
      },
      () => {
        if (active) setSelection({ value: normalizedValue, share: null });
      }
    );

    return () => {
      active = false;
    };
  }, [normalizedValue, selectedShare?.symbol]);

  const handleSelect = React.useCallback(
    (symbol: string) => {
      const match = results.find((share) => share.symbol === symbol);
      if (match) {
        setSelection({ value: symbol, share: match });
      }

      // Do not block user navigation on external market API latency.
      if (onSelect) {
        onSelect(symbol);
      }

      setIsEnsuring(true);
      ensureMarketDataAction(symbol).finally(() => {
        setIsEnsuring(false);
      });
    },
    [results, onSelect]
  );

  const clearSearch = React.useCallback(() => {
    setSearchValue('');
    setSearchResponse(null);
  }, []);

  return {
    searchValue,
    setSearchValue,
    results,
    isLoading,
    isEnsuring,
    hasSearched,
    selectedShare,
    assetTypes,
    selectedAssetType,
    setSelectedAssetType,
    debouncedSearch,
    handleSelect,
    clearSearch,
  };
}
