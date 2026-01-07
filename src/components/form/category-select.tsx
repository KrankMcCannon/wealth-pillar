"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Search, Clock, TrendingUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/src/lib";
import { Category } from "@/lib/types";
import { CategoryIcon, getSemanticColor } from "@/lib/icons";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCategoryUsageStore } from "@/stores/category-usage-store";
import { selectStyles } from "@/styles/system";

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
 *
 * @example
 * ```tsx
 * <CategorySelect
 *   value={selectedCategory}
 *   onValueChange={setSelectedCategory}
 *   categories={categories}
 *   placeholder="Seleziona categoria"
 *   showRecentCategories={true}
 * />
 * ```
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
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          isSelected && "bg-primary/10"
        )}
        style={{ color }}
      >
        <CategoryIcon categoryKey={category.key} size={18} className="shrink-0" />
        <span className="truncate text-sm font-medium">{category.label}</span>
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
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {selectedCategory ? (
            <>
              <CategoryIcon
                categoryKey={selectedCategory.key}
                size={18}
                className="shrink-0"
              />
              <span className="truncate text-sm">{selectedCategory.label}</span>
            </>
          ) : (
            <span className="text-primary/40">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={selectStyles.icon} />
      </SelectPrimitive.Trigger>

      {/* Content */}
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-[10000] overflow-hidden rounded-xl border border-primary/20 bg-card text-primary shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          style={{ width: `${optimalWidth}px` }}
          position="popper"
          side="top"
          align="start"
          sideOffset={4}
          avoidCollisions={true}
          collisionPadding={8}
        >
          {/* Search Input - Outside viewport for sticky behavior */}
          <div className="border-b border-primary/10 p-3 bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Cerca categoria..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  "w-full pl-9 pr-3 py-2 text-sm rounded-lg",
                  "border border-primary/20 bg-card text-primary",
                  "placeholder:text-primary/40",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
              />
            </div>
          </div>

          {/* Scrollable Viewport */}
          <SelectPrimitive.Viewport className="max-h-[300px] overflow-y-auto p-3">
            {/* Recent Categories Section */}
            <AnimatePresence>
              {!debouncedSearch && recentCategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-xs font-semibold text-primary/60 uppercase tracking-wide">
                      Recenti
                    </span>
                  </div>
                  <div className="space-y-1">
                    {recentCategories.map((category) => (
                      <SelectPrimitive.Item
                        key={category.key}
                        value={category.key}
                        className="cursor-pointer outline-none focus:outline-none"
                      >
                        {renderCategoryItem(category, category.key === value)}
                      </SelectPrimitive.Item>
                    ))}
                  </div>
                  <div className="h-px bg-primary/10 my-3" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* All Categories Section */}
            <div>
              {!debouncedSearch && (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <TrendingUp className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-xs font-semibold text-primary/60 uppercase tracking-wide">
                    Tutte le categorie
                  </span>
                </div>
              )}

              {filteredCategories.length === 0 ? (
                <div className="py-8 text-center text-sm text-primary/50">
                  Nessuna categoria trovata
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredCategories.map((category) => (
                    <SelectPrimitive.Item
                      key={category.key}
                      value={category.key}
                      className="cursor-pointer outline-none focus:outline-none rounded-lg hover:bg-primary/5"
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
