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

interface UseShareSearchProps {
  initialValue?: string;
  onSelect?: (symbol: string) => void;
}

export function useShareSearch({ initialValue, onSelect }: UseShareSearchProps = {}) {
  const [searchValue, setSearchValue] = React.useState('');
  const [results, setResults] = React.useState<AvailableShare[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEnsuring, setIsEnsuring] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [selectedShare, setSelectedShare] = React.useState<AvailableShare | null>(null);
  const [assetTypes, setAssetTypes] = React.useState<string[]>([]);
  const [selectedAssetType, setSelectedAssetType] = React.useState<string>('all');

  const debouncedSearch = useDebouncedValue(searchValue, 200);

  // Fetch Asset Types
  React.useEffect(() => {
    let active = true;
    getShareAssetTypesAllAction().then((result) => {
      if (!active) return;
      const types = (result.data || []).map((type) => String(type).toLowerCase()).filter(Boolean);
      setAssetTypes(Array.from(new Set(types)));
    });
    return () => {
      active = false;
    };
  }, []);

  // Search Logic
  React.useEffect(() => {
    let active = true;

    const trimmedSearch = debouncedSearch.trim();
    if (!trimmedSearch || trimmedSearch.length < 3) {
      setResults([]);
      setIsLoading(false);
      setHasSearched(false);
      return () => {
        active = false;
      };
    }

    setIsLoading(true);
    setHasSearched(true);

    const assetTypeFilter = selectedAssetType === 'all' ? undefined : selectedAssetType;
    searchSharesAction(trimmedSearch, assetTypeFilter).then((result) => {
      if (!active) return;
      setResults(result.data || []);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [debouncedSearch, selectedAssetType]);

  // Initial Value Sync
  React.useEffect(() => {
    let active = true;
    const normalizedValue = typeof initialValue === 'string' ? initialValue.trim() : '';

    if (!normalizedValue) {
      setSelectedShare(null);
      return () => {
        active = false;
      };
    }

    if (selectedShare?.symbol === normalizedValue) {
      return () => {
        active = false;
      };
    }

    getShareBySymbolAction(normalizedValue).then((result) => {
      if (!active) return;
      setSelectedShare(result.data || null);
    });

    return () => {
      active = false;
    };
  }, [initialValue, selectedShare?.symbol]);

  const handleSelect = React.useCallback(
    (symbol: string) => {
      const match = results.find((share) => share.symbol === symbol);
      if (match) {
        setSelectedShare(match);
      }
      setIsEnsuring(true);
      void ensureMarketDataAction(symbol).finally(() => {
        setIsEnsuring(false);
        if (onSelect) {
          onSelect(symbol);
        }
      });
    },
    [results, onSelect]
  );

  const clearSearch = React.useCallback(() => {
    setSearchValue('');
    setResults([]);
    setHasSearched(false);
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
