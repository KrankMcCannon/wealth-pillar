'use client';

import * as React from 'react';
import { Clock, TrendingUp, ChevronDown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib';
import { Category } from '@/lib/types';
import { CategoryIcon, getSemanticColor } from '@/lib/icons';
import { useCategoryUsageStore } from '@/stores/category-usage-store';
import { selectStyles } from '@/styles/system';
import { ResponsivePicker } from '@/components/ui/responsive-picker';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { formStyles, getCategorySelectItemStyle } from './theme/form-styles';

export interface CategorySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  categories: Category[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showRecentCategories?: boolean;
  recentCategoriesLimit?: number;
}

/**
 * CategorySelect - Specialized category picker with search, icons, and recent tracking
 *
 * Features:
 * - Category icons and colors
 * - Standardized ResponsivePicker pattern (Popover/Drawer)
 * - Searchable lists via Command component
 * - Recent categories quick-select
 * - Alphabetically sorted categories
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
  }) => {
    const t = useTranslations('Forms.CategorySelect');
    const locale = useLocale();
    const [searchValue, setSearchValue] = React.useState('');
    const [isOpen, setIsOpen] = React.useState(false);
    const [isHydrated, setIsHydrated] = React.useState(false);
    const resolvedPlaceholder = placeholder ?? t('placeholder');

    // Category usage tracking
    const usageMap = useCategoryUsageStore((state) => state.usageMap);
    const recordCategoryUsage = useCategoryUsageStore((state) => state.recordCategoryUsage);

    // Compute recent categories
    const recentCategoryKeys = React.useMemo(() => {
      if (!isHydrated) return [];
      return Object.values(usageMap)
        .sort((a, b) => b.lastUsed - a.lastUsed)
        .slice(0, recentCategoriesLimit)
        .map((usage) => usage.categoryKey);
    }, [isHydrated, usageMap, recentCategoriesLimit]);

    React.useEffect(() => {
      useCategoryUsageStore.persist.rehydrate();
      setIsHydrated(true);
    }, []);

    const sortedCategories = React.useMemo(() => {
      return [...categories].sort((a, b) => a.label.localeCompare(b.label, locale));
    }, [categories, locale]);

    const recentCategories = React.useMemo(() => {
      if (!showRecentCategories || recentCategoryKeys.length === 0) return [];
      return recentCategoryKeys
        .map((key) => categories.find((cat) => cat.key === key))
        .filter((cat): cat is Category => cat !== undefined);
    }, [recentCategoryKeys, categories, showRecentCategories]);

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        onValueChange(newValue);
        recordCategoryUsage(newValue);
        setIsOpen(false);
      },
      [onValueChange, recordCategoryUsage]
    );

    const handleOpenChange = React.useCallback((open: boolean) => {
      setIsOpen(open);
      if (!open) {
        setSearchValue('');
      }
    }, []);

    const selectedCategory = categories.find((cat) => cat.key === value);

    const optimalWidth = React.useMemo(() => {
      if (categories.length === 0) return 280;
      const longestLabel = categories.reduce(
        (longest, cat) => (cat.label.length > longest.length ? cat.label : longest),
        ''
      );
      const estimatedWidth = longestLabel.length * 8 + 60;
      return Math.min(Math.max(estimatedWidth, 240), 400);
    }, [categories]);

    const renderCategoryItem = (category: Category, isSelected: boolean) => {
      const color = getSemanticColor(category.key);

      return (
        <div
          className={cn(
            formStyles.categorySelect.itemRow,
            isSelected && formStyles.categorySelect.itemSelected
          )}
          style={getCategorySelectItemStyle(color)}
        >
          <CategoryIcon
            categoryKey={category.key}
            size={18}
            className={formStyles.categorySelect.itemIcon}
          />
          <span className={formStyles.categorySelect.itemLabel}>{category.label}</span>
        </div>
      );
    };

    return (
      <ResponsivePicker
        open={isOpen}
        onOpenChange={handleOpenChange}
        contentStyle={{ width: optimalWidth }}
        contentClassName="p-0"
        trigger={
          <button
            type="button"
            disabled={disabled}
            className={cn(selectStyles.trigger, className)}
            aria-label={resolvedPlaceholder}
          >
            <div className={formStyles.categorySelect.triggerRow}>
              {selectedCategory ? (
                <>
                  <CategoryIcon
                    categoryKey={selectedCategory.key}
                    size={18}
                    className={formStyles.categorySelect.triggerIcon}
                  />
                  <span className={formStyles.categorySelect.triggerLabel}>
                    {selectedCategory.label}
                  </span>
                </>
              ) : (
                <span className={formStyles.categorySelect.triggerPlaceholder}>
                  {resolvedPlaceholder}
                </span>
              )}
            </div>
            <ChevronDown className={selectStyles.icon} />
          </button>
        }
      >
        <Command className="h-full">
          <CommandInput
            placeholder={t('searchPlaceholder')}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList className={formStyles.categorySelect.viewport}>
            <CommandEmpty>{t('empty')}</CommandEmpty>

            {/* Recent Categories Section */}
            {!searchValue && recentCategories.length > 0 && (
              <>
                <CommandGroup
                  heading={
                    <div className={formStyles.categorySelect.recentHeader}>
                      <Clock className={formStyles.categorySelect.recentIcon} />
                      <span className={formStyles.categorySelect.recentLabel}>{t('recent')}</span>
                    </div>
                  }
                >
                  <div className={formStyles.categorySelect.recentList}>
                    {recentCategories.map((category) => (
                      <CommandItem
                        key={`recent-${category.key}`}
                        value={`recent-${category.label}`}
                        onSelect={() => handleValueChange(category.key)}
                        className="cursor-pointer"
                      >
                        {renderCategoryItem(category, false)}
                      </CommandItem>
                    ))}
                  </div>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* All Categories Section */}
            <CommandGroup
              heading={
                !searchValue ? (
                  <div className={formStyles.categorySelect.allHeader}>
                    <TrendingUp className={formStyles.categorySelect.allIcon} />
                    <span className={formStyles.categorySelect.allLabel}>{t('allCategories')}</span>
                  </div>
                ) : undefined
              }
            >
              {sortedCategories.map((category) => (
                <CommandItem
                  key={`all-${category.key}`}
                  value={category.label}
                  onSelect={() => handleValueChange(category.key)}
                  className="cursor-pointer"
                >
                  {renderCategoryItem(category, category.key === value)}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </ResponsivePicker>
    );
  }
);

CategorySelect.displayName = 'CategorySelect';
