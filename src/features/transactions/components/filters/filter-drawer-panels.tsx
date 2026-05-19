'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category, Account } from '@/lib/types';
import { cn } from '@/lib/utils';
import type {
  TransactionFiltersState,
  DateRangeFilter,
} from '@/server/use-cases/transactions/transaction.logic';
import { Button, Input, DrawerTitle, DrawerDescription, CategoryBadge } from '@/components/ui';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { transactionStyles } from '@/styles/system';
import { DATE_OPTIONS, getDateLabel } from './filter-helpers';

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

export function FilterDrawerContent({
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
