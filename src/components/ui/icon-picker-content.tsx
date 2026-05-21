'use client';

import * as React from 'react';
import { useVirtualizer } from '@/lib/react-virtual';
import { useTranslations } from 'next-intl';
import { Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { ModalSearchInput } from '@/components/form/modal-fields/modal-search-input';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { searchIcons } from '@/lib/utils/icon-search';
import type { IconCategory } from '@/features/categories';
import { CATEGORIES, ICON_METADATA, getIconByName } from '@/features/categories';
import { iconPickerStyles as styles } from './icon-picker-styles';

const DEBOUNCE_DELAY = 300;
const MOBILE_COLS = 5;
const DESKTOP_COLS = 6;
const MOBILE_ICON_SIZE = 48;
const DESKTOP_ICON_SIZE = 40;
const GAP = 8;

interface IconPickerContentProps {
  value: string;
  recent: string[];
  onSelect: (iconName: string) => void;
  isMobile: boolean;
}

export function IconPickerContent({
  value,
  recent,
  onSelect,
  isMobile,
}: Readonly<IconPickerContentProps>) {
  const t = useTranslations('Forms.IconPicker');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<IconCategory>('all');

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter icons based on search and category
  const filteredIcons = React.useMemo(() => {
    if (debouncedQuery.trim()) {
      const results = searchIcons(debouncedQuery, selectedCategory);
      return results.map((r) => r.icon);
    }

    if (selectedCategory === 'all') {
      return ICON_METADATA;
    }

    return ICON_METADATA.filter((icon) => icon.category === selectedCategory);
  }, [debouncedQuery, selectedCategory]);

  // Grid configuration
  const cols = isMobile ? MOBILE_COLS : DESKTOP_COLS;
  const iconSize = isMobile ? MOBILE_ICON_SIZE : DESKTOP_ICON_SIZE;
  const rows = Math.ceil(filteredIcons.length / cols);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => iconSize + GAP,
    overscan: 5,
  });

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, iconName: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(iconName);
    }
  };

  // Get icon at grid position
  const getIconAtPosition = (rowIndex: number, colIndex: number) => {
    const iconIndex = rowIndex * cols + colIndex;
    return filteredIcons[iconIndex];
  };

  const resultCountMessage = debouncedQuery
    ? t('results.found', { count: filteredIcons.length })
    : t('results.available', { count: filteredIcons.length });

  return (
    <div className={styles.container}>
      {/* Header: Search + Favorites Toggle */}
      <div
        className={cn(styles.header.base, isMobile ? styles.header.mobile : styles.header.desktop)}
      >
        {/* Search Input */}
        <div className={styles.searchWrapper}>
          <ModalSearchInput
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            aria-label={t('searchAria')}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className={styles.searchClearButton}
              aria-label={t('clearSearchAria')}
              type="button"
            >
              <X className={styles.searchClearIcon} />
            </button>
          )}
        </div>

        {/* Recent Icons */}
        {recent.length > 0 && (
          <div className={styles.recentContainer}>
            <Clock className={styles.recentIcon} />
            <span className={styles.recentLabel}>{t('recentLabel')}</span>
            <div className={styles.recentIconsWrapper}>
              {recent.slice(0, 3).map((iconName) => {
                const iconMeta = getIconByName(iconName);
                if (!iconMeta) return null;
                const IconComp = iconMeta.component;
                return (
                  <button
                    key={iconName}
                    onClick={() => onSelect(iconName)}
                    className={styles.recentIconButton}
                    title={iconName}
                    aria-label={t('recentIconAria', { iconName })}
                    type="button"
                  >
                    <IconComp className={styles.recentIconSize} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <Tabs
        value={selectedCategory}
        onValueChange={(v) => setSelectedCategory(v as IconCategory)}
        className="shrink-0"
      >
        <div className={styles.tabsContainer}>
          <TabsList className={styles.tabsList} aria-label={t('categoriesAria')}>
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.key}
                value={cat.key}
                className={styles.tabsTrigger}
                aria-label={t('filterByCategoryAria', { category: cat.label })}
                title={cat.description}
              >
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Results Count */}
      <div
        className={cn(
          styles.resultsCount.base,
          isMobile ? styles.resultsCount.mobile : styles.resultsCount.desktop
        )}
        aria-live="polite"
      >
        {resultCountMessage}
      </div>

      {/* Virtualized Icon Grid */}
      <div ref={parentRef} className={styles.gridContainer} aria-label={t('iconListAria')}>
        {filteredIcons.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyStateText}>{t('empty')}</p>
            {debouncedQuery && (
              <Button variant="ghost" size="sm" onClick={clearSearch}>
                {t('clearSearch')}
              </Button>
            )}
          </div>
        ) : (
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className={cn(
                    styles.iconGrid.base,
                    isMobile ? styles.iconGrid.mobile : styles.iconGrid.desktop
                  )}
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  }}
                >
                  {Array.from({ length: cols }).map((_, colIndex) => {
                    const icon = getIconAtPosition(virtualRow.index, colIndex);
                    // Use a unique key based on row and column to avoid array index warning
                    const cellKey = `cell-${virtualRow.index}-${colIndex}`;

                    if (!icon) return <div key={cellKey} />;

                    const IconComponent = icon.component;
                    const isSelected = value === icon.name;

                    return (
                      <div key={icon.name} className={styles.iconItemWrapper}>
                        <button
                          onClick={() => onSelect(icon.name)}
                          onKeyDown={(e) => handleKeyDown(e, icon.name)}
                          className={cn(
                            styles.iconButton.base,
                            isSelected && styles.iconButton.selected,
                            !isSelected && styles.iconButton.unselected
                          )}
                          style={{
                            width: `${iconSize}px`,
                            height: `${iconSize}px`,
                          }}
                          title={icon.name}
                          aria-label={t('selectIconAria', { iconName: icon.name })}
                          aria-pressed={isSelected}
                          type="button"
                          tabIndex={0}
                        >
                          <IconComponent
                            className={isMobile ? styles.iconSize.mobile : styles.iconSize.desktop}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
