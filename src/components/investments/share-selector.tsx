'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Loader2, Search, TrendingUp } from 'lucide-react';
import { cn } from '@/lib';
import { selectStyles } from '@/styles/system';
import { formStyles, getCategorySelectWidthStyle } from '@/components/form/theme/form-styles';
import { useShareSearch, type AvailableShare } from '@/features/investments/hooks/use-share-search';

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

// Helper to render search results
function renderSearchResults(
  isLoading: boolean,
  isEnsuring: boolean,
  results: AvailableShare[],
  hasSearched: boolean,
  currentValue: string
) {
  if (isLoading || isEnsuring) {
    return (
      <div className={formStyles.categorySelect.empty}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (results.length === 0 && hasSearched) {
    return (
      <div className={formStyles.categorySelect.empty}>
        Nessun titolo trovato
      </div>
    );
  }

  if (results.length > 0) {
    return (
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
                  share.symbol === currentValue && formStyles.categorySelect.itemSelected
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
    );
  }

  return null;
}

export function ShareSelector({ value, onChange, className }: Readonly<ShareSelectorProps>) {
  const [isOpen, setIsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
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
    clearSearch
  } = useShareSearch({
    initialValue: value,
    onSelect: (symbol) => {
      setIsOpen(false);
      onChange(symbol);
    }
  });

  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      clearSearch();
    }
  }, [clearSearch]);

  React.useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [isOpen]);

  const selectedLabel = selectedShare?.name
    ? `${selectedShare.name} · ${selectedShare.symbol}`
    : value;

  const optimalWidth = React.useMemo(() => {
    let candidates = results;
    if (results.length === 0 && selectedShare) {
      candidates = [selectedShare];
    } else if (results.length === 0) {
      candidates = [];
    }
    
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
      onValueChange={handleSelect}
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

            {renderSearchResults(
              isLoading, 
              isEnsuring, 
              results, 
              hasSearched, 
              value
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
