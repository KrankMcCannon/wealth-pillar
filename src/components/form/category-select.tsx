'use client';

import * as React from 'react';
import { Popover as PopoverPrimitive } from 'radix-ui';
import { Search, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { Category } from '@/lib/types';
import { CategoryIcon, getSemanticColor } from '@/lib/icons';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCategoryUsageStore } from '@/stores/category-usage-store';
import { getCategorySelectItemStyle, getCategorySelectWidthStyle } from './theme/form-styles';
import { formModalStyles as s } from './form-modal-styles';

export interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showRecentCategories?: boolean;
  recentCategoriesLimit?: number;
  /** Small uppercase caption above the value (e.g. “Category”) */
  captionLabel?: string;
}

export function findCategoryByValue(
  categories: Category[],
  value: string | undefined
): Category | undefined {
  if (!value) return undefined;
  return categories.find((cat) => cat.key === value || cat.id === value);
}

/**
 * CategorySelect - Specialized category picker with search, icons, and recent tracking
 *
 * Features:
 * - Category icons and colors
 * - Debounced search for performance
 * - Recent categories quick-select
 * - Alphabetically sorted categories
 * - Grid layout for better scanning
 * - Proper scrolling on mobile and desktop
 */
export const CategorySelect = React.memo<CategorySelectProps>(
  ({
    value,
    onValueChange,
    categories,
    placeholder,
    disabled = false,
    className,
    showRecentCategories = true,
    recentCategoriesLimit = 3,
    captionLabel,
  }) => {
    const t = useTranslations('Forms.CategorySelect');
    const locale = useLocale();
    const [searchValue, setSearchValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [isHydrated, setIsHydrated] = React.useState(false);
    const resolvedPlaceholder = placeholder ?? t('placeholder');
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    // Debounce search for performance
    const debouncedSearch = useDebouncedValue(searchValue, 200);

    // Category usage tracking - subscribe to usageMap for reactivity
    const usageMap = useCategoryUsageStore((state) => state.usageMap);
    const recordCategoryUsage = useCategoryUsageStore((state) => state.recordCategoryUsage);

    // Compute recent categories from usageMap (reactive to store changes)
    const recentCategoryKeys = React.useMemo(() => {
      if (!isHydrated) return [];
      return Object.values(usageMap)
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, recentCategoriesLimit)
        .map((usage) => usage.categoryKey);
    }, [isHydrated, usageMap, recentCategoriesLimit]);

    // Mark as hydrated after mount and rehydrate the store from localStorage
    React.useEffect(() => {
      // Rehydrate the persisted store manually
      useCategoryUsageStore.persist.rehydrate();
      setIsHydrated(true);
    }, []);

    // Sort categories alphabetically (memoized)
    const sortedCategories = React.useMemo(() => {
      return [...categories].sort((a, b) => a.label.localeCompare(b.label, locale));
    }, [categories, locale]);

    // Filter categories by search (using debounced value)
    const filteredCategories = React.useMemo(() => {
      if (!debouncedSearch) return sortedCategories;

      const lowerSearch = debouncedSearch.toLowerCase();
      return sortedCategories.filter(
        (cat) =>
          cat.label.toLowerCase().includes(lowerSearch) ||
          cat.key.toLowerCase().includes(lowerSearch)
      );
    }, [debouncedSearch, sortedCategories]);

    // Get recent categories (filtered by availability)
    const recentCategories = React.useMemo(() => {
      if (!showRecentCategories || recentCategoryKeys.length === 0) return [];

      return recentCategoryKeys
        .map((key) => categories.find((cat) => cat.key === key))
        .filter((cat): cat is Category => cat !== undefined);
    }, [recentCategoryKeys, categories, showRecentCategories]);

    // Handle value change with usage tracking
    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!newValue) return;
        const key = findCategoryByValue(categories, newValue)?.key ?? newValue;
        onValueChange(key);
        recordCategoryUsage(key);
        setIsOpen(false);
      },
      [categories, onValueChange, recordCategoryUsage]
    );

    // Reset search when dropdown closes
    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSearchValue('');
      }
    }, []);

    const selectedCategory = findCategoryByValue(categories, value);

    // Calculate optimal width based on longest category label
    const optimalWidth = React.useMemo(() => {
      if (categories.length === 0) return 280;

      // Find longest label
      const longestLabel = categories.reduce(
        (longest, cat) => (cat.label.length > longest.length ? cat.label : longest),
        ''
      );

      // Rough estimate: 8px per character + 60px for icon and padding
      const estimatedWidth = longestLabel.length * 8 + 60;

      // Clamp between 240px and 400px
      return Math.min(Math.max(estimatedWidth, 240), 400);
    }, [categories]);

    // Render category item
    const renderCategoryItem = (category: Category, isSelected: boolean) => {
      const color = getSemanticColor(category.key);

      return (
        <div
          className={cn(s.categoryDropdown.itemRow, isSelected && s.categoryDropdown.itemSelected)}
          style={getCategorySelectItemStyle(color)}
        >
          <CategoryIcon
            categoryKey={category.key}
            size={18}
            className={s.categoryDropdown.itemIcon}
          />
          <span className={s.categoryDropdown.itemLabel}>{category.label}</span>
        </div>
      );
    };

    return (
      <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        {/* Trigger */}
        <PopoverPrimitive.Trigger asChild>
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            disabled={disabled}
            className={cn(s.selectorTrigger, className)}
            aria-label={resolvedPlaceholder}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              if (
                document.activeElement instanceof HTMLElement &&
                document.activeElement !== document.body
              ) {
                document.activeElement.blur();
              }
            }}
          >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
              {captionLabel ? <p className={s.selectorLabel}>{captionLabel}</p> : null}
              <p className={selectedCategory ? s.selectorValue : s.selectorValueMuted}>
                {selectedCategory ? selectedCategory.label : resolvedPlaceholder}
              </p>
            </div>
            <ChevronRight className={s.selectorChevron} aria-hidden />
          </button>
        </PopoverPrimitive.Trigger>

        {/* Content */}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            data-vaul-no-drag=""
            className={cn(
              'bg-popover text-popover-foreground',
              s.categoryDropdown.content,
              s.categoryDropdown.contentAnim
            )}
            style={getCategorySelectWidthStyle(optimalWidth)}
            side="top"
            align="start"
            sideOffset={4}
            avoidCollisions
            collisionPadding={8}
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchInputRef.current?.focus();
            }}
          >
            {/* Search Input - Outside viewport for sticky behavior */}
            <div className={s.categoryDropdown.searchWrap}>
              <div className={s.categoryDropdown.searchFieldWrap}>
                <Search className={s.categoryDropdown.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    e.stopPropagation();
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const first = filteredCategories[0];
                      if (first) {
                        handleValueChange(first.key);
                      }
                    } else if (e.key === 'Escape') {
                      setIsOpen(false);
                    }
                  }}
                  className={s.categorySearchInput}
                />
              </div>
            </div>

            {/* Scrollable Viewport */}
            <div className={s.categoryDropdown.viewport} role="listbox" tabIndex={-1}>
              {/* Recent Categories Section */}
              <AnimatePresence>
                {!debouncedSearch && recentCategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={s.categoryDropdown.recentWrap}
                  >
                    <div className={s.categoryDropdown.recentHeader}>
                      <Clock className={s.categoryDropdown.recentIcon} />
                      <span className={s.categoryDropdown.recentLabel}>{t('recent')}</span>
                    </div>
                    <div className={s.categoryDropdown.recentList}>
                      {recentCategories.map((category) => (
                        <button
                          key={`recent-${category.key}`}
                          type="button"
                          role="option"
                          aria-selected={category.key === value}
                          onClick={() => handleValueChange(category.key)}
                          className={cn('w-full text-left', s.categoryDropdown.recentItem)}
                        >
                          {renderCategoryItem(category, false)}
                        </button>
                      ))}
                    </div>
                    <div className={s.categoryDropdown.divider} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* All Categories Section */}
              <div>
                {!debouncedSearch && (
                  <div className={s.categoryDropdown.allHeader}>
                    <TrendingUp className={s.categoryDropdown.allIcon} />
                    <span className={s.categoryDropdown.allLabel}>{t('allCategories')}</span>
                  </div>
                )}

                {filteredCategories.length === 0 ? (
                  <div className={s.categoryDropdown.empty}>{t('empty')}</div>
                ) : (
                  <div className={s.categoryDropdown.list}>
                    {filteredCategories.map((category) => (
                      <button
                        key={`all-${category.key}`}
                        type="button"
                        role="option"
                        aria-selected={category.key === value}
                        onClick={() => handleValueChange(category.key)}
                        className={cn('w-full text-left', s.categoryDropdown.item)}
                      >
                        {renderCategoryItem(category, category.key === value)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }
);

CategorySelect.displayName = 'CategorySelect';
