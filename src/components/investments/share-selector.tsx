'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Loader2, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { selectStyles } from '@/styles/system';
import { formStyles, getCategorySelectWidthStyle } from '@/components/form/theme/form-styles';
import { ensureMarketDataAction, getShareAssetTypesAllAction, getShareBySymbolAction, searchSharesAction } from '@/features/investments/actions/share-actions';
import type { Database } from '@/lib/types/database.types';

type AvailableShare = Database['public']['Tables']['available_shares']['Row'];

interface ShareSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

const ASSET_TYPE_LABELS: Record<string, string> = {
  stock: 'Azioni',
  etf: 'ETF',
  forex: 'Forex',
  crypto: 'Crypto',
};

export function ShareSelector({ value, onChange, className }: ShareSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [results, setResults] = React.useState<AvailableShare[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEnsuring, setIsEnsuring] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [selectedShare, setSelectedShare] = React.useState<AvailableShare | null>(null);
  const [assetTypes, setAssetTypes] = React.useState<string[]>([]);
  const [selectedAssetType, setSelectedAssetType] = React.useState<string>('all');
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const debouncedSearch = useDebouncedValue(searchValue, 200);

  React.useEffect(() => {
    let active = true;
    getShareAssetTypesAllAction().then((result) => {
      if (!active) return;
      const types = (result.data || [])
        .map((type) => String(type).toLowerCase())
        .filter(Boolean);
      setAssetTypes(Array.from(new Set(types)));
    });
    return () => {
      active = false;
    };
  }, []);

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

  React.useEffect(() => {
    let active = true;
    const normalizedValue = typeof value === 'string' ? value.trim() : '';

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
  }, [value, selectedShare?.symbol]);

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchValue('');
      setResults([]);
      setHasSearched(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  });

  const handleValueChange = React.useCallback((symbol: string) => {
    const match = results.find((share) => share.symbol === symbol);
    if (match) {
      setSelectedShare(match);
    }
    setIsEnsuring(true);
    void ensureMarketDataAction(symbol)
      .finally(() => {
        setIsEnsuring(false);
        setIsOpen(false);
        onChange(symbol);
      });
  }, [onChange, results]);

  const selectedLabel = selectedShare?.name
    ? `${selectedShare.name} · ${selectedShare.symbol}`
    : value;

  const optimalWidth = React.useMemo(() => {
    const candidates = results.length > 0 ? results : (selectedShare ? [selectedShare] : []);
    if (candidates.length === 0) return 320;

    const longest = candidates.reduce((max, share) => {
      const label = `${share.name || share.symbol}`;
      return Math.max(max, label.length);
    }, 0);

    const estimatedWidth = (longest * 8) + 140;
    return Math.min(Math.max(estimatedWidth, 260), 440);
  }, [results, selectedShare]);

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={handleValueChange}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        className={cn(selectStyles.trigger, className)}
        aria-label="Seleziona benchmark"
      >
        <div className={formStyles.categorySelect.triggerRow}>
          {value ? (
            <span className={formStyles.categorySelect.triggerLabel}>
              {selectedLabel}
            </span>
          ) : (
            <span className={formStyles.categorySelect.triggerPlaceholder}>
              Seleziona benchmark...
            </span>
          )}
        </div>
        <ChevronDown className={selectStyles.icon} />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            formStyles.categorySelect.content,
            formStyles.categorySelect.contentAnim
          )}
          style={getCategorySelectWidthStyle(optimalWidth)}
          position="popper"
          side="top"
          align="start"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          <div className={formStyles.categorySelect.searchWrap}>
            <div className={formStyles.categorySelect.searchFieldWrap}>
              <Search className={formStyles.categorySelect.searchIcon} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cerca titolo USA..."
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className={formStyles.categorySelect.searchInput}
              />
            </div>
          </div>

          <SelectPrimitive.Viewport className={formStyles.categorySelect.viewport}>
            <div className="mb-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedAssetType('all')}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-full border transition-colors",
                  selectedAssetType === 'all'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-primary/20 text-primary/70 hover:border-primary/50"
                )}
              >
                Tutti
              </button>
              {assetTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedAssetType(type)}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-full border transition-colors",
                    selectedAssetType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-primary/20 text-primary/70 hover:border-primary/50"
                  )}
                >
                  {ASSET_TYPE_LABELS[type] || type.toUpperCase()}
                </button>
              ))}
            </div>

            {!debouncedSearch && (
              <div className={formStyles.categorySelect.allHeader}>
                <TrendingUp className={formStyles.categorySelect.allIcon} />
                <span className={formStyles.categorySelect.allLabel}>
                  Cerca un titolo USA
                </span>
              </div>
            )}

            {debouncedSearch.trim().length > 0 && debouncedSearch.trim().length < 3 && (
              <div className={formStyles.categorySelect.empty}>
                Inserisci almeno 3 caratteri
              </div>
            )}

            {(isLoading || isEnsuring) ? (
              <div className={formStyles.categorySelect.empty}>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : results.length === 0 && hasSearched ? (
              <div className={formStyles.categorySelect.empty}>
                Nessun titolo trovato
              </div>
            ) : results.length > 0 ? (
              <div className={formStyles.categorySelect.list}>
                {results.map((share) => (
                  <SelectPrimitive.Item
                    key={share.id}
                    value={share.symbol}
                    className={formStyles.categorySelect.item}
                  >
                    <SelectPrimitive.ItemText>
                      <div
                        className={cn(
                          formStyles.categorySelect.itemRow,
                          share.symbol === value && formStyles.categorySelect.itemSelected
                        )}
                      >
                        <div className="flex min-w-0 flex-col">
                          <span className={formStyles.categorySelect.itemLabel}>
                            {share.name || share.symbol}
                          </span>
                          <span className="text-xs text-primary/60 truncate">
                            {share.symbol}
                            {share.exchange ? ` · ${share.exchange}` : ''}
                            {share.currency ? ` · ${share.currency}` : ''}
                          </span>
                        </div>
                      </div>
                    </SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </div>
            ) : null}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
