"use client";

/**
 * TransactionFilters - Modern filter system for transactions
 * 
 * Features:
 * - Inline search bar with live filtering
 * - Horizontal scrollable filter chips
 * - Bottom sheet for advanced filters
 * - Active filter badges with quick clear
 * - Smooth animations and haptic feedback
 */

import { useState, useMemo, useCallback } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import { Category, CategoryIcon, cn, iconSizes } from "@/src/lib";
import { toDateTime, isToday as isDateToday, isWithinWeek, isWithinMonth, isWithinYear, formatDateShort } from "@/lib/utils/date-utils";
import {
  Button,
  Input,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
} from "@/src/components/ui";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

// ============================================================================
// Types
// ============================================================================

export type TransactionTypeFilter = "all" | "income" | "expense";
export type DateRangeFilter = "all" | "today" | "week" | "month" | "year" | "custom";

export interface TransactionFiltersState {
  searchQuery: string;
  type: TransactionTypeFilter;
  dateRange: DateRangeFilter;
  categoryKey: string; // "all" or single category ID
  categoryKeys?: string[]; // Multiple category IDs (for budget filtering)
  budgetId?: string; // Budget ID when coming from budgets page
  startDate?: string; // Custom date range start (ISO string)
  endDate?: string; // Custom date range end (ISO string)
}

interface TransactionFiltersProps {
  readonly categories: Category[];
  readonly filters: TransactionFiltersState;
  readonly onFiltersChange: (filters: TransactionFiltersState) => void;
  readonly className?: string;
  readonly budgetName?: string; // Show budget mode badge when set
  readonly onClearBudgetFilter?: () => void; // Callback to clear budget filter and navigate back
}

// ============================================================================
// Constants
// ============================================================================

const TYPE_OPTIONS: { key: TransactionTypeFilter; label: string }[] = [
  { key: "all", label: "Tutti" },
  { key: "income", label: "Entrate" },
  { key: "expense", label: "Uscite" },
];

const DATE_OPTIONS: { key: DateRangeFilter; label: string }[] = [
  { key: "all", label: "Sempre" },
  { key: "today", label: "Oggi" },
  { key: "week", label: "Settimana" },
  { key: "month", label: "Mese" },
  { key: "year", label: "Anno" },
  { key: "custom", label: "Personalizzato" },
];

// ============================================================================
// Helper Functions
// ============================================================================

function getActiveFiltersCount(filters: TransactionFiltersState): number {
  let count = 0;
  if (filters.searchQuery) count++;
  if (filters.type !== "all") count++;
  if (filters.dateRange !== "all") count++;
  if (filters.categoryKey !== "all") count++;
  if (filters.categoryKeys && filters.categoryKeys.length > 0) count++;
  if (filters.budgetId) count++;
  return count;
}

function getTypeLabel(type: TransactionTypeFilter): string {
  return TYPE_OPTIONS.find((o) => o.key === type)?.label ?? "Tutti";
}

function getDateLabel(dateRange: DateRangeFilter): string {
  return DATE_OPTIONS.find((o) => o.key === dateRange)?.label ?? "Sempre";
}

function getDateChipLabel(filters: TransactionFiltersState): string {
  if (filters.dateRange === "all") return "Periodo";
  if (filters.dateRange === "custom") {
    // Format custom date range for display
    if (filters.startDate && filters.endDate) {
      return `${formatDateShort(filters.startDate)} - ${formatDateShort(filters.endDate)}`;
    }
    if (filters.startDate) {
      return `Dal ${formatDateShort(filters.startDate)}`;
    }
    if (filters.endDate) {
      return `Fino al ${formatDateShort(filters.endDate)}`;
    }
    return "Personalizzato";
  }
  return getDateLabel(filters.dateRange);
}

// ============================================================================
// FilterChip Component
// ============================================================================

interface FilterChipProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly hasValue: boolean;
  readonly onClick: () => void;
  readonly onClear?: () => void;
}

function FilterChip({ label, isActive, hasValue, onClick, onClear }: FilterChipProps) {
  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClear?.();
  };

  // Chip con valore attivo: mostra label + icona X per cancellare
  if (hasValue && !isActive) {
    return (
      <div className="relative inline-flex">
        {/* Main button - opens drawer */}
        <button
          type="button"
          onClick={onClick}
          className={cn(
            "inline-flex items-center gap-2 pl-3 pr-8 py-2 rounded-full text-sm font-medium",
            "transition-all duration-200 whitespace-nowrap select-none",
            "bg-primary text-white shadow-md",
            "hover:bg-primary/90 active:scale-[0.98]"
          )}
        >
          <span>{label}</span>
        </button>
        {/* Clear button - positioned absolutely */}
        <button
          type="button"
          onClick={handleClearClick}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2",
            "flex items-center justify-center w-6 h-6 rounded-full",
            "bg-white/20 hover:bg-white/30 transition-colors"
          )}
          aria-label={`Rimuovi filtro ${label}`}
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </div>
    );
  }

  // Chip normale (senza valore o drawer aperto)
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
        "transition-all duration-200 whitespace-nowrap select-none",
        "active:scale-[0.98]",
        isActive
          ? "bg-primary text-white shadow-md"
          : "bg-card text-primary border border-primary/20 hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <span>{label}</span>
      <ChevronDown 
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-200", 
          isActive && "rotate-180"
        )} 
      />
    </button>
  );
}

// ============================================================================
// FilterDrawerContent Component
// ============================================================================

interface FilterDrawerContentProps {
  readonly filterType: "type" | "date" | "category";
  readonly filters: TransactionFiltersState;
  readonly categories: Category[];
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly onDateRangeChange?: (startDate: string, endDate: string) => void;
}

function FilterDrawerContent({ filterType, filters, categories, onSelect, onClose, onDateRangeChange }: FilterDrawerContentProps) {
  const [categorySearch, setCategorySearch] = useState("");
  const [customStartDate, setCustomStartDate] = useState(filters.startDate || "");
  const [customEndDate, setCustomEndDate] = useState(filters.endDate || "");

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat) =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const renderTypeOptions = () => (
    <div className="grid grid-cols-3 gap-2">
      {TYPE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => {
            onSelect(option.key);
            onClose();
          }}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
            "border active:scale-95",
            filters.type === option.key
              ? "bg-primary text-white border-primary shadow-md"
              : "bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40"
          )}
        >
          {filters.type === option.key && <Check className="h-4 w-4" />}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  );

  const renderDateOptions = () => {
    const handleApplyCustomRange = () => {
      if (customStartDate || customEndDate) {
        onDateRangeChange?.(customStartDate, customEndDate);
        onClose();
      }
    };

    return (
      <div className="space-y-4">
        {/* Preset options */}
        <div className="grid grid-cols-2 gap-2">
          {DATE_OPTIONS.filter(o => o.key !== "custom").map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                onSelect(option.key);
                onClose();
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200",
                "border active:scale-95",
                filters.dateRange === option.key
                  ? "bg-primary text-white border-primary shadow-md"
                  : "bg-card text-primary border-primary/20 hover:bg-primary/10 hover:border-primary/40"
              )}
            >
              {filters.dateRange === option.key && <Check className="h-4 w-4" />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="space-y-3 pt-2 border-t border-primary/10">
          <p className="text-sm font-medium text-primary">Range personalizzato</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-xs text-primary/70">Da</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-card border-primary/20 rounded-xl text-sm"
                aria-label="Data inizio"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-xs text-primary/70">A</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-card border-primary/20 rounded-xl text-sm"
                aria-label="Data fine"
              />
            </div>
          </div>
          <Button
            onClick={handleApplyCustomRange}
            disabled={!customStartDate && !customEndDate}
            className="w-full rounded-xl"
          >
            Applica range
          </Button>
        </div>
      </div>
    );
  };

  const renderCategoryOptions = () => (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/50" />
        <Input
          placeholder="Cerca categoria..."
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className="pl-10 bg-card border-primary/20 rounded-xl"
        />
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
        {/* "All" option */}
        <button
          type="button"
          onClick={() => {
            onSelect("all");
            onClose();
          }}
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            "border active:scale-95",
            filters.categoryKey === "all"
              ? "bg-primary text-white border-primary shadow-md"
              : "bg-card text-primary border-primary/20 hover:bg-primary/10"
          )}
        >
          {filters.categoryKey === "all" && <Check className="h-4 w-4 shrink-0" />}
          <span className="truncate">Tutte</span>
        </button>

        {filteredCategories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => {
              onSelect(category.key);
              onClose();
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              "border active:scale-95",
              filters.categoryKey === category.key
                ? "bg-primary text-white border-primary shadow-md"
                : "bg-card text-primary border-primary/20 hover:bg-primary/10"
            )}
          >
            <CategoryIcon categoryKey={category.key} size={iconSizes.sm} />
            <span className="truncate flex-1 text-left">{category.label}</span>
            {filters.categoryKey === category.key && <Check className="h-4 w-4 shrink-0" />}
          </button>
        ))}
      </div>
    </div>
  );

  const titles: Record<string, string> = {
    type: "Tipo transazione",
    date: "Periodo",
    category: "Categoria",
  };

  return (
    <div className="p-4 space-y-4">
      {/* Accessible title and description for screen readers */}
      <VisuallyHidden.Root>
        <DrawerTitle>{titles[filterType]}</DrawerTitle>
        <DrawerDescription>Seleziona un opzione per filtrare le transazioni</DrawerDescription>
      </VisuallyHidden.Root>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-primary">{titles[filterType]}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-primary hover:bg-primary/10 rounded-xl"
        >
          Chiudi
        </Button>
      </div>

      {/* Content */}
      {filterType === "type" && renderTypeOptions()}
      {filterType === "date" && renderDateOptions()}
      {filterType === "category" && renderCategoryOptions()}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TransactionFilters({
  categories,
  filters,
  onFiltersChange,
  className,
  budgetName,
  onClearBudgetFilter,
}: TransactionFiltersProps) {
  const [activeDrawer, setActiveDrawer] = useState<"type" | "date" | "category" | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const isBudgetMode = Boolean(filters.budgetId || budgetName);

  // Get category label
  const categoryLabel = useMemo(() => {
    if (filters.categoryKey === "all") return "Categoria";
    const cat = categories.find((c) => c.key === filters.categoryKey);
    return cat?.label ?? "Categoria";
  }, [filters.categoryKey, categories]);

  // Handlers
  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, searchQuery: value });
    },
    [filters, onFiltersChange]
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, type: value as TransactionTypeFilter });
    },
    [filters, onFiltersChange]
  );

  const handleDateChange = useCallback(
    (value: string) => {
      // If custom, keep custom dates; otherwise clear them
      if (value === "custom") {
        onFiltersChange({ ...filters, dateRange: value as DateRangeFilter });
      } else {
        onFiltersChange({ ...filters, dateRange: value as DateRangeFilter, startDate: undefined, endDate: undefined });
      }
    },
    [filters, onFiltersChange]
  );

  const handleCustomDateRange = useCallback(
    (startDate: string, endDate: string) => {
      onFiltersChange({ 
        ...filters, 
        dateRange: "custom", 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      });
    },
    [filters, onFiltersChange]
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, categoryKey: value });
    },
    [filters, onFiltersChange]
  );

  const handleClearAll = useCallback(() => {
    // Reset all filters to default state
    onFiltersChange({
      searchQuery: "",
      type: "all",
      dateRange: "all",
      categoryKey: "all",
    });
    // Also clear budget filter if present
    if (onClearBudgetFilter) {
      onClearBudgetFilter();
    }
  }, [onFiltersChange, onClearBudgetFilter]);

  const handleClearSearch = useCallback(() => {
    onFiltersChange({ ...filters, searchQuery: "" });
  }, [filters, onFiltersChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Budget Mode Banner */}
      {isBudgetMode && (
        <div className={cn(
          "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl",
          "bg-primary/10 border border-primary/20"
        )}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">
              {budgetName ? `Budget: ${budgetName}` : "Filtro Budget attivo"}
            </span>
            {filters.categoryKeys && filters.categoryKeys.length > 0 && (
              <span className="text-xs text-primary/70">
                ({filters.categoryKeys.length} {filters.categoryKeys.length === 1 ? 'categoria' : 'categorie'})
              </span>
            )}
          </div>
          {onClearBudgetFilter && (
            <button
              type="button"
              onClick={onClearBudgetFilter}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                "bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
              )}
            >
              <X className="h-3 w-3" />
              Esci
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-200",
            isSearchFocused ? "text-primary" : "text-primary/50"
          )}
        />
        <Input
          type="text"
          placeholder="Cerca transazioni..."
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "pl-12 pr-10 py-3 h-12 rounded-2xl bg-card border-primary/20 text-primary placeholder:text-primary/40",
            "transition-all duration-200",
            "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-lg"
          )}
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
          >
            <X className="h-4 w-4 text-primary" />
          </button>
        )}
      </div>

      {/* Filter Chips - Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
        {/* Type Filter */}
        <Drawer open={activeDrawer === "type"} onOpenChange={(open) => setActiveDrawer(open ? "type" : null)}>
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={filters.type === "all" ? "Tipo" : getTypeLabel(filters.type)}
                isActive={activeDrawer === "type"}
                hasValue={filters.type !== "all"}
                onClick={() => setActiveDrawer("type")}
                onClear={() => handleTypeChange("all")}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-3xl bg-card border-t border-primary/20">
            <FilterDrawerContent
              filterType="type"
              filters={filters}
              categories={categories}
              onSelect={handleTypeChange}
              onClose={() => setActiveDrawer(null)}
            />
          </DrawerContent>
        </Drawer>

        {/* Date Filter */}
        <Drawer open={activeDrawer === "date"} onOpenChange={(open) => setActiveDrawer(open ? "date" : null)}>
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={getDateChipLabel(filters)}
                isActive={activeDrawer === "date"}
                hasValue={filters.dateRange !== "all"}
                onClick={() => setActiveDrawer("date")}
                onClear={() => handleDateChange("all")}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-3xl bg-card border-t border-primary/20">
            <FilterDrawerContent
              filterType="date"
              filters={filters}
              categories={categories}
              onSelect={handleDateChange}
              onClose={() => setActiveDrawer(null)}
              onDateRangeChange={handleCustomDateRange}
            />
          </DrawerContent>
        </Drawer>

        {/* Category Filter */}
        <Drawer open={activeDrawer === "category"} onOpenChange={(open) => setActiveDrawer(open ? "category" : null)}>
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={categoryLabel}
                isActive={activeDrawer === "category"}
                hasValue={filters.categoryKey !== "all"}
                onClick={() => setActiveDrawer("category")}
                onClear={() => handleCategoryChange("all")}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className="rounded-t-3xl bg-card border-t border-primary/20 max-h-[70vh]">
            <FilterDrawerContent
              filterType="category"
              filters={filters}
              categories={categories}
              onSelect={handleCategoryChange}
              onClose={() => setActiveDrawer(null)}
            />
          </DrawerContent>
        </Drawer>

        {/* Clear All Button - Show only when filters are active */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium",
              "bg-destructive/10 text-destructive",
              "hover:bg-destructive/20 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
            )}
          >
            <X className="h-3.5 w-3.5" />
            <span>Cancella</span>
          </button>
        )}
      </div>

      {/* Active Filters Summary - Hidden on mobile for cleaner look */}
      {/* The chips already show the active state, no need for extra badges */}
    </div>
  );
}

// ============================================================================
// Default Export and Helper Exports
// ============================================================================

export default TransactionFilters;

export const defaultFiltersState: TransactionFiltersState = {
  searchQuery: "",
  type: "all",
  dateRange: "all",
  categoryKey: "all",
};

/**
 * Helper function to check if any filters are active
 */
export function hasActiveFilters(filters: TransactionFiltersState): boolean {
  return getActiveFiltersCount(filters) > 0;
}

/**
 * Helper function to filter transactions based on filters state
 * Works with Transaction type from the application
 * 
 * NOTE: Transactions store category by KEY (e.g., "food", "transport")
 * The filter also uses category KEY for matching
 */
export function filterTransactions<T extends { description: string; type: string; category: string; date: string | Date }>(
  transactions: T[],
  filters: TransactionFiltersState,
  categories?: Category[]
): T[] {
  // Create category lookup by key for search functionality
  const categoryByKey = categories
    ? new Map(categories.map((c) => [c.key, c]))
    : null;

  return transactions.filter((t) => {
    // Search filter - search in description and optionally category name
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesDescription = t.description.toLowerCase().includes(query);
      
      // Also search in category label if categories are provided
      let matchesCategory = false;
      if (categoryByKey && t.category) {
        const category = categoryByKey.get(t.category);
        if (category) {
          matchesCategory = category.label.toLowerCase().includes(query);
        }
      }
      
      if (!matchesDescription && !matchesCategory) {
        return false;
      }
    }

    // Type filter
    if (filters.type !== "all" && t.type !== filters.type) {
      return false;
    }

    // Category filtering logic:
    // 1. If categoryKey is set (not "all"), use it as the primary filter
    // 2. If categoryKey is "all" but categoryKeys exists (budget mode), use categoryKeys
    if (filters.categoryKey !== "all") {
      // Single category filter takes priority - user explicitly selected a category
      if (t.category !== filters.categoryKey) {
        return false;
      }
    } else if (filters.categoryKeys && filters.categoryKeys.length > 0) {
      // Budget mode: filter by multiple categories only when no specific category is selected
      if (!filters.categoryKeys.includes(t.category)) {
        return false;
      }
    }

    // Date range filter - using Luxon utilities
    if (filters.dateRange !== "all") {
      const transactionDate = toDateTime(t.date);
      if (!transactionDate) return false;

      switch (filters.dateRange) {
        case "today":
          if (!isDateToday(transactionDate)) return false;
          break;
        case "week":
          if (!isWithinWeek(transactionDate)) return false;
          break;
        case "month":
          if (!isWithinMonth(transactionDate)) return false;
          break;
        case "year":
          if (!isWithinYear(transactionDate)) return false;
          break;
        case "custom":
          // Custom date range filter
          if (filters.startDate) {
            const startDate = toDateTime(filters.startDate);
            if (startDate && transactionDate < startDate.startOf('day')) return false;
          }
          if (filters.endDate) {
            const endDate = toDateTime(filters.endDate);
            if (endDate && transactionDate > endDate.endOf('day')) return false;
          }
          break;
      }
    }

    return true;
  });
}
