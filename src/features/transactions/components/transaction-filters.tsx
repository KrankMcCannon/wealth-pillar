'use client';

/**
 * TransactionFilters — pannello filtri nel drawer (periodo, conto, data, categoria). Il tipo è solo sulle chip in pagina.
 * La ricerca testuale vive sulla pagina in `TransactionFilterChips`.
 */

import { useState, useMemo, useCallback, memo } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category, Account } from '@/lib/types';
import { formatDateShort, cn } from '@/lib/utils';
import {
  type TransactionFiltersState,
  type DateRangeFilter,
} from '@/server/use-cases/transactions/transaction.logic';
import {
  Button,
  Input,
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  CategoryBadge,
} from '@/components/ui';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { stitchTransactionFilterTriggers } from '@/styles/home-design-foundation';
import { transactionStyles } from '@/styles/system';

// ============================================================================
// Types
// ============================================================================

interface TransactionFiltersProps {
  readonly categories: Category[];
  readonly accounts?: Account[];
  readonly filters: TransactionFiltersState;
  readonly onFiltersChange: (filters: TransactionFiltersState) => void;
  readonly className?: string | undefined;
  readonly budgetName?: string | undefined; // Show budget mode badge when set
  readonly onClearBudgetFilter?: (() => void) | undefined; // Callback to clear budget filter and navigate back
}

// ============================================================================
// Constants
// ============================================================================

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
  if (filters.accountId && filters.accountId !== 'all') count++;
  if (filters.categoryKeys && filters.categoryKeys.length > 0) count++;
  if (filters.budgetId) count++;
  return count;
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

function isQuickDateRange(dateRange: DateRangeFilter): dateRange is 'all' | 'today' | 'month' {
  return dateRange === 'all' || dateRange === 'today' || dateRange === 'month';
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
  return getDateLabel(filters.dateRange as DateRangeFilter, t);
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

  if (hasValue && !isActive) {
    return (
      <div className={stitchTransactionFilterTriggers.wrapper}>
        <button
          type="button"
          onClick={onClick}
          aria-haspopup="dialog"
          aria-expanded={false}
          className={stitchTransactionFilterTriggers.buttonHasValue}
        >
          <span>{label}</span>
        </button>
        <button
          type="button"
          onClick={handleClearClick}
          className={stitchTransactionFilterTriggers.clearButton}
          aria-label={clearAriaLabel ?? label}
        >
          <X className={stitchTransactionFilterTriggers.clearIcon} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isActive}
      className={cn(
        stitchTransactionFilterTriggers.buttonBase,
        isActive
          ? stitchTransactionFilterTriggers.buttonOpen
          : stitchTransactionFilterTriggers.buttonIdle
      )}
    >
      <span>{label}</span>
      <ChevronDown
        className={cn(
          stitchTransactionFilterTriggers.chevron,
          isActive && stitchTransactionFilterTriggers.chevronOpen
        )}
      />
    </button>
  );
}

// ============================================================================
// DrawerPanel sub-components — each owns its own local state so keystrokes
// and date-input changes don't trigger a re-render of the parent drawer.
// ============================================================================

// ─── DateOptions ──────────────────────────────────────────────────────────────

interface DateOptionsProps {
  readonly selectedDateRange: DateRangeFilter;
  readonly initialStartDate: string;
  readonly initialEndDate: string;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const DateOptions = memo(function DateOptions({
  selectedDateRange,
  initialStartDate,
  initialEndDate,
  onSelect,
  onClose,
  onDateRangeChange,
}: DateOptionsProps) {
  const t = useTranslations('Transactions.Filters');
  const [customStartDate, setCustomStartDate] = useState(initialStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialEndDate);

  const handleApplyCustomRange = useCallback(() => {
    if (customStartDate || customEndDate) {
      onDateRangeChange?.(customStartDate, customEndDate);
      onClose();
    }
  }, [customStartDate, customEndDate, onDateRangeChange, onClose]);

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
              selectedDateRange === option
                ? transactionStyles.filters.dateButtonActive
                : transactionStyles.filters.dateButtonIdle
            )}
          >
            {selectedDateRange === option && (
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
            <span className={transactionStyles.filters.dateLabel}>{t('customRange.toLabel')}</span>
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
});

// ─── CategoryOptions ──────────────────────────────────────────────────────────
// This panel benefits most from isolation: typing in the search field no longer
// triggers any re-render outside this component.

interface CategoryOptionsProps {
  readonly selectedCategoryKey: string;
  readonly categories: Category[];
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
}

const CategoryOptions = memo(function CategoryOptions({
  selectedCategoryKey,
  categories,
  onSelect,
  onClose,
}: CategoryOptionsProps) {
  const t = useTranslations('Transactions.Filters');
  const [categorySearch, setCategorySearch] = useState('');

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    return categories.filter((cat) =>
      cat.label.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  return (
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
            selectedCategoryKey === 'all'
              ? transactionStyles.filters.categoryButtonActive
              : transactionStyles.filters.categoryButtonIdle
          )}
        >
          {selectedCategoryKey === 'all' && (
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
              selectedCategoryKey === category.key
                ? transactionStyles.filters.categoryButtonActive
                : transactionStyles.filters.categoryButtonIdle
            )}
          >
            <CategoryBadge categoryKey={category.key} size="sm" />
            <span className={transactionStyles.filters.categoryLabelLeft}>{category.label}</span>
            {selectedCategoryKey === category.key && (
              <Check className={transactionStyles.filters.categoryCheck} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── AccountOptions ────────────────────────────────────────────────────────────

interface AccountOptionsProps {
  readonly selectedAccountId: string;
  readonly accounts: Account[];
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
}

const AccountOptions = memo(function AccountOptions({
  selectedAccountId,
  accounts,
  onSelect,
  onClose,
}: AccountOptionsProps) {
  const t = useTranslations('Transactions.Filters');
  const [accountSearch, setAccountSearch] = useState('');

  const filteredAccounts = useMemo(() => {
    if (!accountSearch.trim()) return accounts;
    return accounts.filter((acc) => acc.name.toLowerCase().includes(accountSearch.toLowerCase()));
  }, [accounts, accountSearch]);

  return (
    <div className={transactionStyles.filters.categorySection}>
      {/* Search */}
      <div className={transactionStyles.filters.categorySearchWrap}>
        <Search className={transactionStyles.filters.categorySearchIcon} />
        <Input
          placeholder={t('account.searchPlaceholder')}
          value={accountSearch}
          onChange={(e) => setAccountSearch(e.target.value)}
          className={transactionStyles.filters.categorySearchInput}
        />
      </div>

      {/* Account grid */}
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
            selectedAccountId === 'all'
              ? transactionStyles.filters.categoryButtonActive
              : transactionStyles.filters.categoryButtonIdle
          )}
        >
          {selectedAccountId === 'all' && (
            <Check className={transactionStyles.filters.categoryCheck} />
          )}
          <span className={transactionStyles.filters.categoryLabel}>{t('account.all')}</span>
        </button>

        {filteredAccounts.map((account) => (
          <button
            key={account.id}
            type="button"
            onClick={() => {
              onSelect(account.id);
              onClose();
            }}
            className={cn(
              transactionStyles.filters.categoryButton,
              selectedAccountId === account.id
                ? transactionStyles.filters.categoryButtonActive
                : transactionStyles.filters.categoryButtonIdle
            )}
          >
            <span className={transactionStyles.filters.categoryLabelLeft}>{account.name}</span>
            {selectedAccountId === account.id && (
              <Check className={transactionStyles.filters.categoryCheck} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
});

// ============================================================================
// FilterDrawerContent — shell that selects the active panel
// ============================================================================

interface FilterDrawerContentProps {
  readonly filterType: 'date' | 'category' | 'account';
  readonly filters: TransactionFiltersState;
  readonly categories: Category[];
  readonly accounts?: Account[] | undefined;
  readonly onSelect: (value: string) => void;
  readonly onClose: () => void;
  readonly onDateRangeChange?: (startDate: string, endDate: string) => void;
}

function FilterDrawerContent({
  filterType,
  filters,
  categories,
  accounts,
  onSelect,
  onClose,
  onDateRangeChange,
}: FilterDrawerContentProps) {
  const t = useTranslations('Transactions.Filters');

  const titles: Record<'date' | 'category' | 'account', string> = {
    date: t('drawer.titles.date'),
    category: t('drawer.titles.category'),
    account: t('drawer.titles.account'),
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

      {/* Active panel — only one mounts at a time */}
      {filterType === 'date' && (
        <DateOptions
          selectedDateRange={filters.dateRange}
          initialStartDate={filters.startDate ?? ''}
          initialEndDate={filters.endDate ?? ''}
          onSelect={onSelect}
          onClose={onClose}
          {...(onDateRangeChange && { onDateRangeChange })}
        />
      )}
      {filterType === 'category' && (
        <CategoryOptions
          selectedCategoryKey={filters.categoryKey}
          categories={categories}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
      {filterType === 'account' && (
        <AccountOptions
          selectedAccountId={filters.accountId ?? 'all'}
          accounts={accounts || []}
          onSelect={onSelect}
          onClose={onClose}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TransactionFilters({
  categories,
  accounts,
  filters,
  onFiltersChange,
  className,
  budgetName,
  onClearBudgetFilter,
}: TransactionFiltersProps) {
  const t = useTranslations('Transactions.Filters');
  const [activeDrawer, setActiveDrawer] = useState<'date' | 'category' | 'account' | null>(null);

  const activeFiltersCount = useMemo(() => getActiveFiltersCount(filters), [filters]);
  const isBudgetMode = Boolean(filters.budgetId || budgetName);

  // Get category label
  const categoryLabel = useMemo(() => {
    if (filters.categoryKey === 'all') return t('chips.category');
    const cat = categories.find((c) => c.key === filters.categoryKey);
    return cat?.label ?? t('chips.category');
  }, [filters.categoryKey, categories, t]);

  // Get account label
  const accountLabel = useMemo(() => {
    if (!filters.accountId || filters.accountId === 'all') return t('chips.account');
    const acc = accounts?.find((a) => a.id === filters.accountId);
    return acc?.name ?? t('chips.account');
  }, [filters.accountId, accounts, t]);

  const handleDateChange = useCallback(
    (value: string) => {
      // If custom, keep custom dates; otherwise clear them
      if (value === 'custom') {
        onFiltersChange({ ...filters, dateRange: value as DateRangeFilter });
      } else {
        onFiltersChange({
          ...filters,
          dateRange: value as DateRangeFilter,
          startDate: null,
          endDate: null,
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
        startDate: startDate || null,
        endDate: endDate || null,
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

  const handleAccountChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, accountId: value });
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
      accountId: 'all',
    });
    // Also clear budget filter if present
    if (onClearBudgetFilter) {
      onClearBudgetFilter();
    }
  }, [onFiltersChange, onClearBudgetFilter]);

  const accountFilterDrawer = (
    <Drawer
      open={activeDrawer === 'account'}
      onOpenChange={(open) => setActiveDrawer(open ? 'account' : null)}
    >
      <FilterChip
        label={accountLabel}
        isActive={activeDrawer === 'account'}
        hasValue={filters.accountId !== 'all' && filters.accountId !== undefined}
        onClick={() => setActiveDrawer('account')}
        onClear={() => handleAccountChange('all')}
        clearAriaLabel={t('clearFilterAria', { label: accountLabel })}
      />
      <DrawerContent className={transactionStyles.filters.drawer.contentTall}>
        <FilterDrawerContent
          filterType="account"
          filters={filters}
          categories={categories}
          accounts={accounts}
          onSelect={handleAccountChange}
          onClose={() => setActiveDrawer(null)}
        />
      </DrawerContent>
    </Drawer>
  );

  const tertiaryFilterDrawers = (
    <>
      <Drawer
        open={activeDrawer === 'date'}
        onOpenChange={(open) => setActiveDrawer(open ? 'date' : null)}
      >
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

      <Drawer
        open={activeDrawer === 'category'}
        onOpenChange={(open) => setActiveDrawer(open ? 'category' : null)}
      >
        <FilterChip
          label={categoryLabel}
          isActive={activeDrawer === 'category'}
          hasValue={filters.categoryKey !== 'all'}
          onClick={() => setActiveDrawer('category')}
          onClear={() => handleCategoryChange('all')}
          clearAriaLabel={t('clearFilterAria', { label: categoryLabel })}
        />
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
    </>
  );

  return (
    <div className={cn(transactionStyles.filters.container, 'gap-2', className)}>
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

      <div
        className={cn(transactionStyles.filters.toolsCluster, 'border-t-0 pt-0 gap-2')}
      >
        <div
          className={transactionStyles.filters.quickPeriodRow}
          role="group"
          aria-label={t('quickRange.groupAria')}
        >
          {(['all', 'today', 'month'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleDateChange(value)}
              className={cn(
                stitchTransactionFilterTriggers.quickPill,
                filters.dateRange === value
                  ? stitchTransactionFilterTriggers.quickPillActive
                  : stitchTransactionFilterTriggers.quickPillIdle
              )}
              aria-pressed={filters.dateRange === value}
            >
              {value === 'all' && t('quickRange.all')}
              {value === 'today' && t('quickRange.today')}
              {value === 'month' && t('quickRange.month')}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setActiveDrawer('date')}
            className={cn(
              stitchTransactionFilterTriggers.quickPill,
              !isQuickDateRange(filters.dateRange)
                ? stitchTransactionFilterTriggers.quickPillActive
                : stitchTransactionFilterTriggers.quickPillIdle
            )}
            aria-pressed={!isQuickDateRange(filters.dateRange)}
            aria-label={t('quickRange.moreAria')}
          >
            {t('quickRange.more')}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {accountFilterDrawer}
          {tertiaryFilterDrawers}
        </div>

        {activeFiltersCount > 0 ? (
          <div className={transactionStyles.filters.advancedControlsRow}>
            <div className={transactionStyles.filters.advancedClearWrap}>
              <button
                type="button"
                onClick={handleClearAll}
                className={stitchTransactionFilterTriggers.filterDrawerClearAll}
              >
                <X className={transactionStyles.filters.clearAllIcon} />
                <span>{t('clearAll')}</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
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
  accountId: 'all',
};

/**
 * Helper function to check if any filters are active
 */
export function hasActiveFilters(filters: TransactionFiltersState): boolean {
  return getActiveFiltersCount(filters) > 0;
}
