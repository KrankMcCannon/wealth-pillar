'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Loader2, Search, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { getCategorySelectWidthStyle } from '@/components/form/theme/form-styles';
import { useShareSearch, type AvailableShare } from '@/features/investments/hooks/use-share-search';
import { investmentsStyles } from '@/features/investments';

interface ShareSelectorProps {
  value: string;
  onChange: (symbol: string) => void;
  className?: string;
}

interface SearchResultLabels {
  noResults: string;
  searchLoading: string;
}

// Helper to render search results
function renderSearchResults(
  isLoading: boolean,
  isEnsuring: boolean,
  results: AvailableShare[],
  hasSearched: boolean,
  labels: SearchResultLabels,
  styles: typeof investmentsStyles.selector
) {
  if (isLoading || isEnsuring) {
    return (
      <div
        className={styles.empty}
        role="status"
        aria-live="polite"
        aria-label={labels.searchLoading}
      >
        <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" aria-hidden />
      </div>
    );
  }

  if (results.length === 0 && hasSearched) {
    return <div className={styles.empty}>{labels.noResults}</div>;
  }

  if (results.length > 0) {
    return (
      <div className="space-y-1">
        {results.map((share) => (
          <SelectPrimitive.Item key={share.id} value={share.symbol} className={styles.item}>
            <SelectPrimitive.ItemText>
              <div className="flex min-w-0 flex-col">
                <span className={styles.itemLabel}>{share.name || share.symbol}</span>
                <span className={styles.itemSublabel}>
                  {share.symbol}
                  {share.exchange ? ` · ${share.exchange}` : ''}
                  {share.currency ? ` · ${share.currency}` : ''}
                </span>
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
  const t = useTranslations('Investments.ShareSelector');
  const searchFieldId = React.useId();
  const [isOpen, setIsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const ASSET_TYPE_LABELS: Record<string, string> = {
    stock: t('assetTypes.stock'),
    etf: t('assetTypes.etf'),
    forex: t('assetTypes.forex'),
    crypto: t('assetTypes.crypto'),
  };

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
    clearSearch,
  } = useShareSearch({
    initialValue: value,
    onSelect: (symbol) => {
      setIsOpen(false);
      onChange(symbol);
    },
  });

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setIsOpen(open);
      if (!open) {
        clearSearch();
      }
    },
    [clearSearch]
  );

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

    const estimatedWidth = longest * 8 + 140;
    return Math.min(Math.max(estimatedWidth, 260), 440);
  }, [results, selectedShare]);

  const styles = investmentsStyles.selector;

  return (
    <SelectPrimitive.Root
      value={value}
      onValueChange={handleSelect}
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <SelectPrimitive.Trigger
        className={cn(styles.trigger, className)}
        aria-label={t('ariaLabel')}
      >
        <div className="flex items-center gap-3 truncate">
          <TrendingUp className={styles.triggerIcon} />
          <span className={styles.triggerLabel}>{selectedLabel || t('placeholder')}</span>
        </div>
        <ChevronDown className="h-4 w-4 text-primary/60" />
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={styles.content}
          style={getCategorySelectWidthStyle(optimalWidth)}
          position="popper"
          side="bottom"
          align="end"
          sideOffset={8}
          avoidCollisions
          collisionPadding={12}
        >
          <div className={styles.searchWrap}>
            <label htmlFor={searchFieldId} className="sr-only">
              {t('searchInputLabel')}
            </label>
            <div className={styles.searchFieldWrap}>
              <Search className={styles.searchIcon} aria-hidden />
              <input
                id={searchFieldId}
                ref={searchInputRef}
                type="search"
                enterKeyHint="search"
                maxLength={80}
                autoComplete="off"
                placeholder={t('searchPlaceholder')}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => event.stopPropagation()}
                onClick={(event) => event.stopPropagation()}
                className={styles.searchInput}
              />
            </div>
          </div>

          <SelectPrimitive.Viewport className={styles.viewport}>
            <div className="mb-4 flex flex-wrap gap-2 px-1">
              <button
                type="button"
                onClick={() => setSelectedAssetType('all')}
                className={styles.assetTypeButton(selectedAssetType === 'all')}
              >
                {t('allAssetTypes')}
              </button>
              {assetTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedAssetType(type)}
                  className={styles.assetTypeButton(selectedAssetType === type)}
                >
                  {ASSET_TYPE_LABELS[type] || type.toUpperCase()}
                </button>
              ))}
            </div>

            {!debouncedSearch && (
              <div className={styles.groupHeader}>
                <span className={styles.groupTitle}>{t('searchHint')}</span>
              </div>
            )}

            {debouncedSearch.trim().length > 0 && debouncedSearch.trim().length < 3 && (
              <div className={styles.empty}>{t('minCharsHint')}</div>
            )}

            {renderSearchResults(
              isLoading,
              isEnsuring,
              results,
              hasSearched,
              {
                noResults: t('noResults'),
                searchLoading: t('searchLoading'),
              },
              styles
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
