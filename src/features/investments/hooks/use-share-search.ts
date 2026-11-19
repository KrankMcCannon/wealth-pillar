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
  const [searchValue, setSearchValueState] = React.useState('');
  const [searchResponse, setSearchResponse] = React.useState<{
    key: string;
    results: AvailableShare[];
  } | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isEnsuring, setIsEnsuring] = React.useState(false);
  const [selection, setSelection] = React.useState<{
    value: string;
    share: AvailableShare | null;
  } | null>(null);
  const [assetTypes, setAssetTypes] = React.useState<string[]>([]);
  const [selectedAssetType, setSelectedAssetTypeState] = React.useState<string>('all');

  const debouncedSearch = useDebouncedValue(searchValue, 200);
  const trimmedSearch = debouncedSearch.trim();
  const hasSearched = trimmedSearch.length >= 3;
  const searchKey = JSON.stringify([trimmedSearch, selectedAssetType]);
  const requestGeneration = React.useRef(0);
  const activeSearchKey = React.useRef<string | null>(null);
  const isLoading = hasSearched && isSearching;
  const results = React.useMemo(
    () => (hasSearched && searchResponse?.key === searchKey ? searchResponse.results : []),
    [hasSearched, searchResponse, searchKey]
  );
  const normalizedValue =
    initialValue === undefined ? (selection?.value ?? '') : initialValue.trim();
  const selectedShare = selection?.value === normalizedValue ? selection.share : null;

  const setSearchValue = React.useCallback((value: string) => {
    requestGeneration.current += 1;
    activeSearchKey.current = null;
    setSearchValueState(value);
    setSearchError(null);
    setIsSearching(value.trim().length >= 3);
  }, []);

  const setSelectedAssetType = React.useCallback(
    (assetType: string) => {
      requestGeneration.current += 1;
      activeSearchKey.current = null;
      setSelectedAssetTypeState(assetType);
      setSearchError(null);
      setIsSearching(searchValue.trim().length >= 3);
    },
    [searchValue]
  );

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

  const runSearch = React.useCallback(async (key: string, query: string, assetType: string) => {
    const generation = ++requestGeneration.current;
    activeSearchKey.current = key;
    const assetTypeFilter = assetType === 'all' ? undefined : assetType;

    try {
      const result = await searchSharesAction(query, assetTypeFilter);
      if (generation !== requestGeneration.current) return;
      if (result.error) {
        setSearchResponse({ key, results: [] });
        setSearchError(key);
        return;
      }
      setSearchResponse({ key, results: result.data ?? [] });
    } catch {
      if (generation !== requestGeneration.current) return;
      setSearchResponse({ key, results: [] });
      setSearchError(key);
    } finally {
      if (generation === requestGeneration.current) {
        activeSearchKey.current = null;
        setIsSearching(false);
      }
    }
  }, []);

  // The effect and retry both use this one request path. Changing the key first
  // invalidates any old response, including one that resolves after the selector closes.
  React.useEffect(() => {
    if (!hasSearched) {
      requestGeneration.current += 1;
      activeSearchKey.current = null;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- only the asynchronous action settles state.
    runSearch(searchKey, trimmedSearch, selectedAssetType).catch(() => undefined);
    return () => {
      requestGeneration.current += 1;
    };
  }, [hasSearched, runSearch, searchKey, selectedAssetType, trimmedSearch]);

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
  }, [setSearchValue]);

  const retrySearch = React.useCallback(() => {
    if (!hasSearched || isSearching || activeSearchKey.current === searchKey) return;
    setIsSearching(true);
    setSearchError(null);
    runSearch(searchKey, trimmedSearch, selectedAssetType).catch(() => undefined);
  }, [hasSearched, isSearching, runSearch, searchKey, selectedAssetType, trimmedSearch]);

  return {
    searchValue,
    setSearchValue,
    results,
    isLoading,
    searchFailed: searchError === searchKey,
    isEnsuring,
    hasSearched,
    selectedShare,
    assetTypes,
    selectedAssetType,
    setSelectedAssetType,
    debouncedSearch,
    handleSelect,
    clearSearch,
    retrySearch,
  };
}
