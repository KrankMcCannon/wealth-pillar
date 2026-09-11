'use client';

/**
 * TransactionFilters — filter drawer panel (period, account, category).
 * Search and type filters live on the ledger; this drawer keeps period, account, and category.
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
import { DrawerNested, DrawerContent } from '@/components/ui';
import { stitchTransactionFilterTriggers } from '@/styles/home-design-foundation';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import {
  defaultFiltersState,
  getDateChipLabel,
  getDateLabel,
  hasActiveFilters,
  isPresetDateRange,
  isQuickPeriodSelected,
  PERIOD_PRESETS,
} from './filters/filter-helpers';
import { FilterChipTrigger } from './filters/filter-chip-trigger';
import { DateOptions, FilterDrawerContent } from './filters/filter-drawer-panels';

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
  const [activeDrawer, setActiveDrawer] = useState<'category' | 'account' | null>(null);
  const [customRangeOpen, setCustomRangeOpen] = useState(
    () => !isPresetDateRange(filters.dateRange)
  );

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
        setCustomRangeOpen(true);
        onFiltersChange({ ...filters, dateRange: value as DateRangeFilter });
        return;
      }
      setCustomRangeOpen(false);
      onFiltersChange({
        ...filters,
        dateRange: value as DateRangeFilter,
        startDate: null,
        endDate: null,
      });
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

  const moreDateLabel =
    filters.dateRange === 'custom' ? getDateChipLabel(filters, t) : t('quickRange.more');

  const accountFilterDrawer = (
    <DrawerNested
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
    </DrawerNested>
  );

  const categoryFilterDrawer = (
    <DrawerNested
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
    </DrawerNested>
  );

  return (
    <div className={cn(transactionStyles.filters.container, className)}>
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

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">{t('chips.period')}</p>
        <div
          className={transactionStyles.filters.quickPeriodRow}
          role="radiogroup"
          aria-label={t('quickRange.groupAria')}
        >
          {PERIOD_PRESETS.map((value) => {
            const selected = isQuickPeriodSelected(value, filters.dateRange, customRangeOpen);
            return (
              <button
                key={value}
                type="button"
                role="radio"
                onClick={() => handleDateChange(value)}
                className={cn(
                  stitchTransactionFilterTriggers.quickPill,
                  selected
                    ? stitchTransactionFilterTriggers.quickPillActive
                    : stitchTransactionFilterTriggers.quickPillIdle
                )}
                aria-checked={selected}
              >
                {getDateLabel(value, t)}
              </button>
            );
          })}
          <button
            type="button"
            role="radio"
            onClick={() => setCustomRangeOpen(true)}
            className={cn(
              stitchTransactionFilterTriggers.quickPill,
              customRangeOpen || filters.dateRange === 'custom'
                ? stitchTransactionFilterTriggers.quickPillActive
                : stitchTransactionFilterTriggers.quickPillIdle
            )}
            aria-checked={customRangeOpen || filters.dateRange === 'custom'}
            aria-label={t('quickRange.moreAria')}
          >
            {moreDateLabel}
          </button>
        </div>

        {customRangeOpen ? (
          <DateOptions
            selectedDateRange={filters.dateRange}
            initialStartDate={filters.startDate ?? ''}
            initialEndDate={filters.endDate ?? ''}
            onSelect={handleDateChange}
            onClose={() => undefined}
            onDateRangeChange={handleCustomDateRange}
            presets={[]}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {accountFilterDrawer}
        {categoryFilterDrawer}
      </div>
    </div>
  );
}

export default TransactionFilters;
