"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Search, Clock, TrendingUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib";
import { Category } from "@/lib/types";
import { CategoryIcon, getSemanticColor } from "@/lib/icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCategoryUsageStore } from "@/stores/category-usage-store";
import { selectStyles } from "@/styles/system";
import { formStyles, getCategorySelectItemStyle, getCategorySelectWidthStyle } from "./theme/form-styles";

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
 * - Debounced search for performance
 * - Recent categories quick-select
 * - Alphabetically sorted categories
 * - Grid layout for better scanning
 * - Proper scrolling on mobile and desktop
 */
export const CategorySelect = React.memo<CategorySelectProps>(({
  value,
  onValueChange,
  categories,
  placeholder = "Seleziona categoria",
  disabled = false,
  className,
  showRecentCategories = true,
  recentCategoriesLimit = 5,
}) => {
  const [searchValue, setSearchValue] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Debounce search for performance
  const debouncedSearch = useDebouncedValue(searchValue, 200);

  // Category usage tracking - destructure store methods
  const recordCategoryUsage = useCategoryUsageStore((state) => state.recordCategoryUsage);
  const getRecentCategories = useCategoryUsageStore((state) => state.getRecentCategories);

  // Only get recent categories after hydration to prevent SSR mismatch
  const recentCategoryKeys = React.useMemo(() => {
    return isHydrated ? getRecentCategories(recentCategoriesLimit) : [];
  }, [isHydrated, getRecentCategories, recentCategoriesLimit]);

  // Mark as hydrated after mount and rehydrate the store from localStorage
  React.useEffect(() => {
    // Rehydrate the persisted store manually
    useCategoryUsageStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // Sort categories alphabetically (memoized)
  const sortedCategories = React.useMemo(() => {
    return [...categories].sort((a, b) =>
      a.label.localeCompare(b.label, 'it')
    );
  }, [categories]);

  // Filter categories by search (using debounced value)
  const filteredCategories = React.useMemo(() => {
    if (!debouncedSearch) return sortedCategories;

    const lowerSearch = debouncedSearch.toLowerCase();
    return sortedCategories.filter((cat) =>
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
  const handleValueChange = React.useCallback((newValue: string) => {
    onValueChange(newValue);
    recordCategoryUsage(newValue);
    setIsOpen(false);
  }, [onValueChange, recordCategoryUsage]);

  // Reset search when dropdown closes
  const handleOpenChange = React.useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchValue("");
    }
  }, []);

  // Get selected category for display
  const selectedCategory = categories.find((cat) => cat.key === value);

  // Calculate optimal width based on longest category label
  const optimalWidth = React.useMemo(() => {
    if (categories.length === 0) return 280;

    // Find longest label
    const longestLabel = categories.reduce((longest, cat) =>
      cat.label.length > longest.length ? cat.label : longest
      , "");

    // Rough estimate: 8px per character + 60px for icon and padding
    const estimatedWidth = (longestLabel.length * 8) + 60;

    // Clamp between 240px and 400px
    return Math.min(Math.max(estimatedWidth, 240), 400);
  }, [categories]);

  // Render category item
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
        <CategoryIcon categoryKey={category.key} size={18} className={formStyles.categorySelect.itemIcon} />
        <span className={formStyles.categorySelect.itemLabel}>{category.label}</span>
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
        className={cn(selectStyles.trigger, className)}
        aria-label={placeholder}
      >
        <div className={formStyles.categorySelect.triggerRow}>
          {selectedCategory ? (
            <>
              <CategoryIcon
                categoryKey={selectedCategory.key}
                size={18}
                className={formStyles.categorySelect.triggerIcon}
              />
              <span className={formStyles.categorySelect.triggerLabel}>{selectedCategory.label}</span>
            </>
          ) : (
            <span className={formStyles.categorySelect.triggerPlaceholder}>{placeholder}</span>
          )}
        </div>
        <ChevronDown className={selectStyles.icon} />
      </SelectPrimitive.Trigger>

      {/* Content */}
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
          {/* Search Input - Outside viewport for sticky behavior */}
          <div className={formStyles.categorySelect.searchWrap}>
            <div className={formStyles.categorySelect.searchFieldWrap}>
              <Search className={formStyles.categorySelect.searchIcon} />
              <input
                type="text"
                placeholder="Cerca categoria..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={formStyles.categorySelect.searchInput}
              />
            </div>
          </div>

          {/* Scrollable Viewport */}
          <SelectPrimitive.Viewport className={formStyles.categorySelect.viewport}>
            {/* Recent Categories Section */}
            <AnimatePresence>
              {!debouncedSearch && recentCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={formStyles.categorySelect.recentWrap}
                >
                  <div className={formStyles.categorySelect.recentHeader}>
                    <Clock className={formStyles.categorySelect.recentIcon} />
                    <span className={formStyles.categorySelect.recentLabel}>
                      Recenti
                    </span>
                  </div>
                  <div className={formStyles.categorySelect.recentList}>
                    {recentCategories.map((category) => (
                      <SelectPrimitive.Item
                        key={category.key}
                        value={category.key}
                        className={formStyles.categorySelect.recentItem}
                      >
                        {renderCategoryItem(category, category.key === value)}
                      </SelectPrimitive.Item>
                    ))}
                  </div>
                  <div className={formStyles.categorySelect.divider} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* All Categories Section */}
            <div>
              {!debouncedSearch && (
                <div className={formStyles.categorySelect.allHeader}>
                  <TrendingUp className={formStyles.categorySelect.allIcon} />
                  <span className={formStyles.categorySelect.allLabel}>
                    Tutte le categorie
                  </span>
                </div>
              )}

              {filteredCategories.length === 0 ? (
                <div className={formStyles.categorySelect.empty}>
                  Nessuna categoria trovata
                </div>
              ) : (
                <div className={formStyles.categorySelect.list}>
                  {filteredCategories.map((category) => (
                    <SelectPrimitive.Item
                      key={category.key}
                      value={category.key}
                      className={formStyles.categorySelect.item}
                    >
                      {renderCategoryItem(category, category.key === value)}
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
});

CategorySelect.displayName = "CategorySelect";
