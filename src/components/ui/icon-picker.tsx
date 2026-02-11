'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';
import { HelpCircle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Button } from './button';
import { Input } from './input';
import { Tabs, TabsList, TabsTrigger } from './tabs';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { searchIcons } from '@/lib/utils/icon-search';
import type { IconCategory } from '@/features/categories';
import { CATEGORIES, ICON_METADATA, getIconByName } from '@/features/categories';

/**
 * Modern Icon Picker Component
 *
 * A highly optimized and accessible icon picker with:
 * - Fuzzy search with keyword matching
 * - Virtualized grid for 1,000+ icons
 * - Recent icons tracking
 * - Responsive mobile design (Dialog) and desktop (Popover)
 * - Full keyboard navigation
 * - localStorage persistence
 */

// ============================================================================
// TYPES
// ============================================================================

export interface IconPickerProps {
  /** Current selected icon name */
  value: string;
  /** Callback when icon changes */
  onChange: (iconName: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RECENT = 5;
const DEBOUNCE_DELAY = 300;

// Grid configuration
const MOBILE_COLS = 5;
const DESKTOP_COLS = 6;
const MOBILE_ICON_SIZE = 48; // 48x48px for better touch targets
const DESKTOP_ICON_SIZE = 40;
const GAP = 8;

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  // Container styles
  container: 'flex flex-col h-full min-h-0',

  // Header styles
  header: {
    base: 'border-b border-primary/20 bg-card/50 backdrop-blur-sm shrink-0 space-y-2',
    mobile: 'p-2',
    desktop: 'p-3',
  },

  // Search input wrapper
  searchWrapper: 'relative',
  searchInput: 'h-10 bg-card pr-8',
  searchClearButton:
    'absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-primary/10 transition-colors',
  searchClearIcon: 'h-4 w-4 text-primary/60',

  // Recent icons container
  recentContainer:
    'flex-1 flex gap-1 items-center px-2 text-xs text-primary/80 bg-primary/10 rounded-md overflow-hidden',
  recentIcon: 'h-3.5 w-3.5 shrink-0',
  recentLabel: 'shrink-0',
  recentIconsWrapper: 'flex gap-1 overflow-x-auto',
  recentIconButton: 'p-0.5 rounded hover:bg-primary/10 transition-colors shrink-0',
  recentIconSize: 'h-3.5 w-3.5 text-primary',

  // Category tabs
  tabsContainer: 'border-b border-primary/20 bg-card/30 backdrop-blur-sm overflow-x-auto',
  tabsList: 'inline-flex h-10 w-full justify-start rounded-none bg-transparent p-0',
  tabsTrigger:
    'rounded-none border-b-2 border-transparent data-[state=active]:border-primary/20 data-[state=active]:bg-transparent px-3 text-xs whitespace-nowrap',

  // Results count
  resultsCount: {
    base: 'py-1.5 text-xs text-primary/80 bg-primary/10 shrink-0',
    mobile: 'px-2',
    desktop: 'px-3',
  },

  // Virtualized grid container
  gridContainer: 'overflow-y-auto overflow-x-hidden flex-1 min-h-0',

  // Empty state
  emptyState: 'flex flex-col items-center justify-center h-full py-8 text-center',
  emptyStateText: 'text-sm text-primary/70 mb-2',

  // Icon grid
  iconGrid: {
    base: 'grid py-1',
    mobile: 'px-3 gap-3',
    desktop: 'px-3 gap-2',
  },

  // Icon item wrapper
  iconItemWrapper: 'relative group flex items-center justify-center',

  // Icon button
  iconButton: {
    base: 'flex items-center justify-center rounded-lg transition-all duration-200 relative hover:bg-primary/10 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    selected: 'bg-primary text-primary-foreground shadow-md scale-105',
    unselected: 'text-primary hover:text-primary',
  },

  // Icon size
  iconSize: {
    mobile: 'h-6 w-6',
    desktop: 'h-5 w-5',
  },

  // Trigger button
  triggerButton:
    'w-full h-10 justify-start text-left font-normal rounded-lg border-primary/20 bg-card hover:bg-card',
  triggerIcon: 'mr-2 h-4 w-4 text-primary',
  triggerText: 'text-primary/60',

  // Desktop popover
  popoverContent: 'w-[450px] p-0 bg-card flex flex-col',

  // Mobile dialog
  dialogOverlay:
    'fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
  dialogContent:
    'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-card border border-border rounded-2xl shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300 w-[calc(100vw-40px)] max-w-[500px]',
  dialogHandle: 'mx-auto mt-3 mb-2 h-1.5 w-16 rounded-full bg-primary/20 shrink-0',
  dialogWrapper: 'flex flex-col flex-1 min-h-0',
} as const;

// ============================================================================
// SHARED CONTENT COMPONENT
// ============================================================================

interface IconPickerContentProps {
  value: string;
  recent: string[];
  onSelect: (iconName: string) => void;
  isMobile: boolean;
}

function IconPickerContent({
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

  // Virtualizer
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual returns functions that aren't compiler-memoizable
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
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function IconPicker({ value, onChange, className }: Readonly<IconPickerProps>) {
  const t = useTranslations('Forms.IconPicker');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isOpen, setIsOpen] = React.useState(false);

  // localStorage for recent icons
  const [recent, setRecent] = useLocalStorage<string[]>('icon-picker-recent', []);

  // Get selected icon component
  const selectedIconMetadata = React.useMemo(() => {
    if (!value) return null;
    return getIconByName(value);
  }, [value]);

  const SelectedIcon = selectedIconMetadata?.component || HelpCircle;

  // Handle icon selection
  const handleIconSelect = (iconName: string) => {
    onChange(iconName);

    // Add to recent
    setRecent((prev) => {
      const filtered = prev.filter((name) => name !== iconName);
      return [iconName, ...filtered].slice(0, MAX_RECENT);
    });

    // Close
    setIsOpen(false);
  };

  // Trigger button
  const triggerButton = (
    <Button
      variant="outline"
      className={styles.triggerButton}
      aria-label={value ? t('triggerSelectedAria', { iconName: value }) : t('triggerDefaultAria')}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
    >
      <SelectedIcon className={styles.triggerIcon} aria-hidden="true" />
      <span className={styles.triggerText}>{value || t('triggerDefaultText')}</span>
    </Button>
  );

  return (
    <div className={cn('space-y-2', className)}>
      {isDesktop ? (
        // Desktop: Use Popover
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          <PopoverContent
            className={styles.popoverContent}
            style={{ height: '600px', maxHeight: '600px' }}
            align="start"
            side="bottom"
            sideOffset={5}
            aria-label={t('selectorAria')}
          >
            <IconPickerContent
              value={value}
              recent={recent}
              onSelect={handleIconSelect}
              isMobile={false}
            />
          </PopoverContent>
        </Popover>
      ) : (
        // Mobile: Use Dialog (bottom drawer)
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
          <Dialog.Trigger asChild>{triggerButton}</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.dialogOverlay} />
            <Dialog.Content
              className={styles.dialogContent}
              style={{ height: '500px', maxHeight: '70vh' }}
              aria-label={t('selectorAria')}
            >
              {/* Hidden title for accessibility */}
              <Dialog.Title className="sr-only">{t('selectorTitle')}</Dialog.Title>

              {/* Drawer handle */}
              <div className={styles.dialogHandle} />

              <div className={styles.dialogWrapper}>
                <IconPickerContent
                  value={value}
                  recent={recent}
                  onSelect={handleIconSelect}
                  isMobile={true}
                />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </div>
  );
}
