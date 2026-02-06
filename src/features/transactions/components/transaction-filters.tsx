'use client';

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

import { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Category, cn } from '@/lib';
import {
  toDateTime,
  isToday as isDateToday,
  isWithinWeek,
  isWithinMonth,
  isWithinYear,
  formatDateShort,
} from '@/lib/utils';
import {
  Button,
  Input,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerTitle,
  DrawerDescription,
  CategoryBadge,
} from '@/components/ui';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { transactionStyles } from '@/styles/system';

// ============================================================================
// Types
// ============================================================================

export type TransactionTypeFilter = 'all' | 'income' | 'expense';
export type DateRangeFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

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

const TYPE_OPTIONS: TransactionTypeFilter[] = ['all', 'income', 'expense'];
const DATE_OPTIONS: DateRangeFilter[] = ['all', 'today', 'week', 'month', 'year', 'custom'];

// ============================================================================
// Helper Functions
// ============================================================================

function getActiveFiltersCount(filters: TransactionFiltersState): number {
  let count = 0;
  if (filters.searchQuery) count++;
  if (filters.type !== 'all') count++;
  if (filters.dateRange !== 'all') count++;
  if (filters.categoryKey !== 'all') count++;
  if (filters.categoryKeys && filters.categoryKeys.length > 0) count++;
  if (filters.budgetId) count++;
  return count;
}

function getTypeLabel(type: TransactionTypeFilter, t: ReturnType<typeof useTranslations>): string {
  switch (type) {
    case 'income':
      return t('typeOptions.income');
    case 'expense':
      return t('typeOptions.expense');
    case 'all':
    default:
      return t('typeOptions.all');
  }
}

function getDateLabel(dateRange: DateRangeFilter, t: ReturnType<typeof useTranslations>): string {
  switch (dateRange) {
    case 'today':
      return t('dateOptions.today');
    case 'week':
      return t('dateOptions.week');
    case 'month':
      return t('dateOptions.month');
    case 'year':
      return t('dateOptions.year');
    case 'custom':
      return t('dateOptions.custom');
    case 'all':
    default:
      return t('dateOptions.all');
  }
}

function getDateChipLabel(
  filters: TransactionFiltersState,
  t: ReturnType<typeof useTranslations>
): string {
  if (filters.dateRange === 'all') return t('chips.period');
  if (filters.dateRange === 'custom') {
    // Format custom date range for display
    if (filters.startDate && filters.endDate) {
      return `${formatDateShort(filters.startDate)} - ${formatDateShort(filters.endDate)}`;
    }
    if (filters.startDate) {
      return t('customRange.from', { date: formatDateShort(filters.startDate) });
    }
    if (filters.endDate) {
      return t('customRange.until', { date: formatDateShort(filters.endDate) });
    }
    return t('dateOptions.custom');
  }
  return getDateLabel(filters.dateRange, t);
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
  readonly clearAriaLabel?: string;
}

function FilterChip({
  label,
  isActive,
  hasValue,
  onClick,
  onClear,
  clearAriaLabel,
}: FilterChipProps) {
  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClear?.();
  };

  // Chip con valore attivo: mostra label + icona X per cancellare
  if (hasValue && !isActive) {
    return (
      <div className={transactionStyles.filters.chip.wrapper}>
        {/* Main button - opens drawer */}
        <button
          type="button"
          onClick={onClick}
          className={transactionStyles.filters.chip.buttonActive}
        >
          <span>{label}</span>
        </button>
        {/* Clear button - positioned absolutely */}
        <button
          type="button"
          onClick={handleClearClick}
          className={transactionStyles.filters.chip.clearButton}
          aria-label={clearAriaLabel ?? label}
        >
          <X className={transactionStyles.filters.chip.clearIcon} />
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
        transactionStyles.filters.chip.buttonBase,
        isActive
          ? transactionStyles.filters.chip.buttonOpen
          : transactionStyles.filters.chip.buttonIdle
      )}
    >
      <span>{label}</span>
      <ChevronDown
        className={cn(
          transactionStyles.filters.chip.chevron,
          isActive && transactionStyles.filters.chip.chevronOpen
        )}
      />
    </button>
  );
}

// ============================================================================
// FilterDrawerContent Component
// ============================================================================

interface FilterDrawerContentProps {
  readonly filterType: 'type' | 'date' | 'category';
  readonly filters: TransactionFiltersState;
  readonly categories: Category[];
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly onDateRangeChange?: (startDate: string, endDate: string) => void;
}

function FilterDrawerContent({
  filterType,
  filters,
  categories,
  onSelect,
  onClose,
  onDateRangeChange,
}: FilterDrawerContentProps) {
  const t = useTranslations('Transactions.Filters');
  const [categorySearch, setCategorySearch] = useState('');
  const [customStartDate, setCustomStartDate] = useState(filters.startDate || '');
  const [customEndDate, setCustomEndDate] = useState(filters.endDate || '');

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat) =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const renderTypeOptions = () => (
    <div className={transactionStyles.filters.typeGrid}>
      {TYPE_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => {
            onSelect(option);
            onClose();
          }}
          className={cn(
            transactionStyles.filters.typeButton,
            filters.type === option
              ? transactionStyles.filters.typeButtonActive
              : transactionStyles.filters.typeButtonIdle
          )}
        >
          {filters.type === option && <Check className={transactionStyles.filters.typeCheck} />}
          <span>{getTypeLabel(option, t)}</span>
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
      <div className={transactionStyles.filters.dateSection}>
        {/* Preset options */}
        <div className={transactionStyles.filters.dateGrid}>
          {DATE_OPTIONS.filter((option) => option !== 'custom').map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onSelect(option);
                onClose();
              }}
              className={cn(
                transactionStyles.filters.dateButton,
                filters.dateRange === option
                  ? transactionStyles.filters.dateButtonActive
                  : transactionStyles.filters.dateButtonIdle
              )}
            >
              {filters.dateRange === option && (
                <Check className={transactionStyles.filters.typeCheck} />
              )}
              <span>{getDateLabel(option, t)}</span>
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className={transactionStyles.filters.dateCustom}>
          <p className={transactionStyles.filters.dateTitle}>{t('customRange.title')}</p>
          <div className={transactionStyles.filters.dateInputs}>
            <div className={transactionStyles.filters.dateField}>
              <span className={transactionStyles.filters.dateLabel}>
                {t('customRange.fromLabel')}
              </span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className={transactionStyles.filters.dateInput}
                aria-label={t('customRange.startDateAria')}
              />
            </div>
            <div className={transactionStyles.filters.dateField}>
              <span className={transactionStyles.filters.dateLabel}>
                {t('customRange.toLabel')}
              </span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className={transactionStyles.filters.dateInput}
                aria-label={t('customRange.endDateAria')}
              />
            </div>
          </div>
          <Button
            onClick={handleApplyCustomRange}
            disabled={!customStartDate && !customEndDate}
            className={transactionStyles.filters.dateApply}
          >
            {t('customRange.apply')}
          </Button>
        </div>
      </div>
    );
  };

  const renderCategoryOptions = () => (
    <div className={transactionStyles.filters.categorySection}>
      {/* Search */}
      <div className={transactionStyles.filters.categorySearchWrap}>
        <Search className={transactionStyles.filters.categorySearchIcon} />
        <Input
          placeholder={t('category.searchPlaceholder')}
          value={categorySearch}
          onChange={(e) => setCategorySearch(e.target.value)}
          className={transactionStyles.filters.categorySearchInput}
        />
      </div>

      {/* Category grid */}
      <div className={transactionStyles.filters.categoryGrid}>
        {/* "All" option */}
        <button
          type="button"
          onClick={() => {
            onSelect('all');
            onClose();
          }}
          className={cn(
            transactionStyles.filters.categoryButton,
            filters.categoryKey === 'all'
              ? transactionStyles.filters.categoryButtonActive
              : transactionStyles.filters.categoryButtonIdle
          )}
        >
          {filters.categoryKey === 'all' && (
            <Check className={transactionStyles.filters.categoryCheck} />
          )}
          <span className={transactionStyles.filters.categoryLabel}>{t('category.all')}</span>
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
              transactionStyles.filters.categoryButton,
              filters.categoryKey === category.key
                ? transactionStyles.filters.categoryButtonActive
                : transactionStyles.filters.categoryButtonIdle
            )}
          >
            <CategoryBadge categoryKey={category.key} size="sm" />
            <span className={transactionStyles.filters.categoryLabelLeft}>{category.label}</span>
            {filters.categoryKey === category.key && (
              <Check className={transactionStyles.filters.categoryCheck} />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const titles: Record<'type' | 'date' | 'category', string> = {
    type: t('drawer.titles.type'),
    date: t('drawer.titles.date'),
    category: t('drawer.titles.category'),
  };

  return (
    <div className={transactionStyles.filters.drawer.inner}>
      {/* Accessible title and description for screen readers */}
      <VisuallyHidden.Root>
        <DrawerTitle>{titles[filterType]}</DrawerTitle>
        <DrawerDescription>{t('drawer.description')}</DrawerDescription>
      </VisuallyHidden.Root>

      {/* Header */}
      <div className={transactionStyles.filters.drawer.header}>
        <h3 className={transactionStyles.filters.drawer.title}>{titles[filterType]}</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className={transactionStyles.filters.drawer.closeButton}
        >
          {t('drawer.close')}
        </Button>
      </div>

      {/* Content */}
      {filterType === 'type' && renderTypeOptions()}
      {filterType === 'date' && renderDateOptions()}
      {filterType === 'category' && renderCategoryOptions()}
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
  const t = useTranslations('Transactions.Filters');
  const [activeDrawer, setActiveDrawer] = useState<'type' | 'date' | 'category' | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const activeFiltersCount = getActiveFiltersCount(filters);
  const isBudgetMode = Boolean(filters.budgetId || budgetName);

  // Get category label
  const categoryLabel = useMemo(() => {
    if (filters.categoryKey === 'all') return t('chips.category');
    const cat = categories.find((c) => c.key === filters.categoryKey);
    return cat?.label ?? t('chips.category');
  }, [filters.categoryKey, categories, t]);

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
      if (value === 'custom') {
        onFiltersChange({ ...filters, dateRange: value as DateRangeFilter });
      } else {
        onFiltersChange({
          ...filters,
          dateRange: value as DateRangeFilter,
          startDate: undefined,
          endDate: undefined,
        });
      }
    },
    [filters, onFiltersChange]
  );

  const handleCustomDateRange = useCallback(
    (startDate: string, endDate: string) => {
      onFiltersChange({
        ...filters,
        dateRange: 'custom',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
      searchQuery: '',
      type: 'all',
      dateRange: 'all',
      categoryKey: 'all',
    });
    // Also clear budget filter if present
    if (onClearBudgetFilter) {
      onClearBudgetFilter();
    }
  }, [onFiltersChange, onClearBudgetFilter]);

  const handleClearSearch = useCallback(() => {
    onFiltersChange({ ...filters, searchQuery: '' });
  }, [filters, onFiltersChange]);

  return (
    <div className={cn(transactionStyles.filters.container, className)}>
      {/* Budget Mode Banner */}
      {isBudgetMode && (
        <div className={transactionStyles.filters.budgetBanner}>
          <div className={transactionStyles.filters.budgetBannerLeft}>
            <div className={transactionStyles.filters.budgetBannerDot} />
            <span className={transactionStyles.filters.budgetBannerText}>
              {budgetName
                ? t('budget.bannerWithName', { name: budgetName })
                : t('budget.bannerActive')}
            </span>
            {filters.categoryKeys && filters.categoryKeys.length > 0 && (
              <span className={transactionStyles.filters.budgetBannerCount}>
                {t('budget.categoriesCount', { count: filters.categoryKeys.length })}
              </span>
            )}
          </div>
          {onClearBudgetFilter && (
            <button
              type="button"
              onClick={onClearBudgetFilter}
              className={transactionStyles.filters.budgetBannerExit}
            >
              <X className={transactionStyles.filters.budgetBannerExitIcon} />
              {t('budget.exit')}
            </button>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className={transactionStyles.filters.searchWrap}>
        <Search
          className={cn(
            transactionStyles.filters.searchIcon,
            isSearchFocused
              ? transactionStyles.filters.searchIconActive
              : transactionStyles.filters.searchIconInactive
          )}
        />
        <Input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={transactionStyles.filters.searchInput}
        />
        {filters.searchQuery && (
          <button
            type="button"
            onClick={handleClearSearch}
            className={transactionStyles.filters.searchClear}
          >
            <X className={transactionStyles.filters.searchClearIcon} />
          </button>
        )}
      </div>

      {/* Filter Chips - Horizontal Scroll */}
      <div className={transactionStyles.filters.chipsRow}>
        {/* Type Filter */}
        <Drawer
          open={activeDrawer === 'type'}
          onOpenChange={(open) => setActiveDrawer(open ? 'type' : null)}
        >
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={filters.type === 'all' ? t('chips.type') : getTypeLabel(filters.type, t)}
                isActive={activeDrawer === 'type'}
                hasValue={filters.type !== 'all'}
                onClick={() => setActiveDrawer('type')}
                onClear={() => handleTypeChange('all')}
                clearAriaLabel={t('clearFilterAria', {
                  label: filters.type === 'all' ? t('chips.type') : getTypeLabel(filters.type, t),
                })}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className={transactionStyles.filters.drawer.content}>
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
        <Drawer
          open={activeDrawer === 'date'}
          onOpenChange={(open) => setActiveDrawer(open ? 'date' : null)}
        >
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={getDateChipLabel(filters, t)}
                isActive={activeDrawer === 'date'}
                hasValue={filters.dateRange !== 'all'}
                onClick={() => setActiveDrawer('date')}
                onClear={() => handleDateChange('all')}
                clearAriaLabel={t('clearFilterAria', {
                  label: getDateChipLabel(filters, t),
                })}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className={transactionStyles.filters.drawer.content}>
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
        <Drawer
          open={activeDrawer === 'category'}
          onOpenChange={(open) => setActiveDrawer(open ? 'category' : null)}
        >
          <DrawerTrigger asChild>
            <div>
              <FilterChip
                label={categoryLabel}
                isActive={activeDrawer === 'category'}
                hasValue={filters.categoryKey !== 'all'}
                onClick={() => setActiveDrawer('category')}
                onClear={() => handleCategoryChange('all')}
                clearAriaLabel={t('clearFilterAria', { label: categoryLabel })}
              />
            </div>
          </DrawerTrigger>
          <DrawerContent className={transactionStyles.filters.drawer.contentTall}>
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
            className={transactionStyles.filters.clearAll}
          >
            <X className={transactionStyles.filters.clearAllIcon} />
            <span>{t('clearAll')}</span>
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
  searchQuery: '',
  type: 'all',
  dateRange: 'all',
  categoryKey: 'all',
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
const matchesSearch = (
  t: { description: string; category: string },
  query: string,
  categoryByKey: Map<string, Category> | null
): boolean => {
  if (!query) return true;
  const q = query.toLowerCase();

  // Search in description
  if (t.description.toLowerCase().includes(q)) return true;

  // Search in category label
  if (categoryByKey && t.category) {
    const category = categoryByKey.get(t.category);
    if (category?.label.toLowerCase().includes(q)) return true;
  }

  return false;
};

const matchesCategory = (t: { category: string }, filters: TransactionFiltersState): boolean => {
  // 1. Specific category selected
  if (filters.categoryKey !== 'all') {
    return t.category === filters.categoryKey;
  }

  // 2. Budget mode (multiple permitted categories)
  if (filters.categoryKeys && filters.categoryKeys.length > 0) {
    return filters.categoryKeys.includes(t.category);
  }

  return true;
};

const matchesDate = (t: { date: string | Date }, filters: TransactionFiltersState): boolean => {
  if (filters.dateRange === 'all') return true;

  const transactionDate = toDateTime(t.date);
  if (!transactionDate) return false;

  switch (filters.dateRange) {
    case 'today':
      return isDateToday(transactionDate);
    case 'week':
      return isWithinWeek(transactionDate);
    case 'month':
      return isWithinMonth(transactionDate);
    case 'year':
      return isWithinYear(transactionDate);
    case 'custom': {
      if (filters.startDate) {
        const startDate = toDateTime(filters.startDate);
        if (startDate && transactionDate < startDate.startOf('day')) return false;
      }
      if (filters.endDate) {
        const endDate = toDateTime(filters.endDate);
        if (endDate && transactionDate > endDate.endOf('day')) return false;
      }
      return true;
    }
    default:
      return true;
  }
};

export function filterTransactions<
  T extends { description: string; type: string; category: string; date: string | Date },
>(transactions: T[], filters: TransactionFiltersState, categories?: Category[]): T[] {
  // Create category lookup by key for search functionality
  const categoryByKey = categories ? new Map(categories.map((c) => [c.key, c])) : null;

  return transactions.filter((t) => {
    // 1. Search Filter
    if (!matchesSearch(t, filters.searchQuery, categoryByKey)) return false;

    // 2. Type Filter
    if (filters.type !== 'all' && t.type !== filters.type) return false;

    // 3. Category Filter
    if (!matchesCategory(t, filters)) return false;

    // 4. Date Filter
    if (!matchesDate(t, filters)) return false;

    return true;
  });
}
