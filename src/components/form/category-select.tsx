'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Search, Clock, TrendingUp, ChevronRight, LayoutGrid } from 'lucide-react';
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
        onValueChange(newValue);
        recordCategoryUsage(newValue);
        setIsOpen(false);
      },
      [onValueChange, recordCategoryUsage]
    );

    // Reset search when dropdown closes
    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSearchValue('');
      }
    }, []);

    // Get selected category for display
    const selectedCategory = categories.find((cat) => cat.key === value);

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
      <SelectPrimitive.Root
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        {/* Trigger */}
        <SelectPrimitive.Trigger
          className={cn(s.selectorTrigger, className)}
          aria-label={resolvedPlaceholder}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={s.selectorIconWrap}>
              {selectedCategory ? (
                <CategoryIcon categoryKey={selectedCategory.key} size={22} className="shrink-0" />
              ) : (
                <LayoutGrid className={s.selectorIcon} aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1">
              {captionLabel ? <p className={s.selectorLabel}>{captionLabel}</p> : null}
              <p className={selectedCategory ? s.selectorValue : s.selectorValueMuted}>
                {selectedCategory ? selectedCategory.label : resolvedPlaceholder}
              </p>
            </div>
          </div>
          <ChevronRight className={s.selectorChevron} aria-hidden />
        </SelectPrimitive.Trigger>

        {/* Content */}
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'modal-chrome',
              s.categoryDropdown.content,
              s.categoryDropdown.contentAnim
            )}
            style={getCategorySelectWidthStyle(optimalWidth)}
            position="popper"
            side="top"
            align="start"
            sideOffset={4}
            avoidCollisions
            collisionPadding={8}
          >
            {/* Search Input - Outside viewport for sticky behavior */}
            <div className={s.categoryDropdown.searchWrap}>
              <div className={s.categoryDropdown.searchFieldWrap}>
                <Search className={s.categoryDropdown.searchIcon} />
                <input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  className={s.categorySearchInput}
                />
              </div>
            </div>

            {/* Scrollable Viewport */}
            <SelectPrimitive.Viewport className={s.categoryDropdown.viewport}>
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
                          onClick={() => handleValueChange(category.key)}
                          className={s.categoryDropdown.recentItem}
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
                      <SelectPrimitive.Item
                        key={`all-${category.key}`}
                        value={category.key}
                        className={s.categoryDropdown.item}
                      >
                        <SelectPrimitive.ItemText>
                          {renderCategoryItem(category, category.key === value)}
                        </SelectPrimitive.ItemText>
                      </SelectPrimitive.Item>
                    ))}
                  </div>
                )}
              </div>
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);

CategorySelect.displayName = 'CategorySelect';
