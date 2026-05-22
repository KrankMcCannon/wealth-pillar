'use client';

/**
 * TransactionFilters — filter drawer panel (period, account, category).
 * Search and type chips live in `TransactionFilterChips`.
 */

import { useState, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category, Account } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  type TransactionFiltersState,
  type DateRangeFilter,
} from '@/server/use-cases/transactions/transaction.logic';
import { Drawer, DrawerContent } from '@/components/ui';
import { stitchTransactionFilterTriggers } from '@/styles/home-design-foundation';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import {
  defaultFiltersState,
  getActiveFiltersCount,
  getDateChipLabel,
  hasActiveFilters,
  isQuickDateRange,
} from './filters/filter-helpers';
import { FilterChipTrigger } from './filters/filter-chip-trigger';
import { FilterDrawerContent } from './filters/filter-drawer-panels';

export { defaultFiltersState, hasActiveFilters };

interface TransactionFiltersProps {
  readonly categories: Category[];
  readonly accounts?: Account[];
  readonly filters: TransactionFiltersState;
  readonly onFiltersChange: (filters: TransactionFiltersState) => void;
  readonly className?: string | undefined;
  readonly budgetName?: string | undefined;
  readonly onClearBudgetFilter?: (() => void) | undefined;
}

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

  const categoryLabel = useMemo(() => {
    if (filters.categoryKey === 'all') return t('chips.category');
    const cat = categories.find((c) => c.key === filters.categoryKey);
    return cat?.label ?? t('chips.category');
  }, [filters.categoryKey, categories, t]);

  const accountLabel = useMemo(() => {
    if (!filters.accountId || filters.accountId === 'all') return t('chips.account');
    const acc = accounts?.find((a) => a.id === filters.accountId);
    return acc?.name ?? t('chips.account');
  }, [filters.accountId, accounts, t]);

  const handleDateChange = useCallback(
    (value: string) => {
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
    onFiltersChange({
      searchQuery: '',
      type: 'all',
      dateRange: 'all',
      categoryKey: 'all',
      accountId: 'all',
    });
    onClearBudgetFilter?.();
  }, [onFiltersChange, onClearBudgetFilter]);

  const accountFilterDrawer = (
    <Drawer
      open={activeDrawer === 'account'}
      onOpenChange={(open) => setActiveDrawer(open ? 'account' : null)}
    >
      <FilterChipTrigger
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
        <FilterChipTrigger
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
        <FilterChipTrigger
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

      <div className={cn(transactionStyles.filters.toolsCluster, 'border-t-0 pt-0 gap-2')}>
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

export default TransactionFilters;
