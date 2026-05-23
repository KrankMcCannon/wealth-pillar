'use client';

import dynamic from 'next/dynamic';
import { useCallback, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Category, Account, User } from '@/lib/types';
import type {
  TransactionFiltersState,
  TransactionTypeFilter,
} from '@/server/use-cases/transactions/transaction.logic';
import { Input, Skeleton } from '@/components/ui';
import { FilterChip, FilterDrawer } from '@/components/ui/filters';
import { cn } from '@/lib/utils';
import { stitchTransactionPageSearch, stitchTransactions } from '@/styles/home-design-foundation';

const TransactionFiltersLazy = dynamic(
  () => import('./transaction-filters').then((mod) => mod.TransactionFilters),
  {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-full rounded-2xl bg-muted/60" aria-hidden />,
  }
);

export interface TransactionFilterChipsProps {
  readonly filters: TransactionFiltersState;
  readonly onFiltersChange: (filters: TransactionFiltersState) => void;
  readonly categories: Category[];
  readonly accounts?: Account[];
  readonly budgetName?: string;
  readonly onClearBudgetFilter?: () => void;
  readonly currentUser?: User | undefined;
  readonly groupUsers?: User[] | undefined;
  readonly selectedUserId?: string | undefined;
  readonly onUserFilterChange?: ((userId: string) => void) | undefined;
  readonly className?: string;
}

export function TransactionFilterChips({
  filters,
  onFiltersChange,
  categories,
  accounts,
  budgetName,
  onClearBudgetFilter,
  currentUser,
  groupUsers,
  selectedUserId,
  onUserFilterChange,
  className,
}: TransactionFilterChipsProps) {
  const t = useTranslations('Transactions.Filters');
  const tChips = useTranslations('Transactions.Filters.FilterChips');
  const tUsers = useTranslations('UserSelector');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const setType = useCallback(
    (type: TransactionTypeFilter) => {
      onFiltersChange({ ...filters, type });
    },
    [filters, onFiltersChange]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      onFiltersChange({ ...filters, searchQuery: value });
    },
    [filters, onFiltersChange]
  );

  const handleClearSearch = useCallback(() => {
    onFiltersChange({ ...filters, searchQuery: '' });
  }, [filters, onFiltersChange]);

  const types: { key: TransactionTypeFilter; labelKey: 'all' | 'income' | 'expense' }[] = [
    { key: 'all', labelKey: 'all' },
    { key: 'income', labelKey: 'income' },
    { key: 'expense', labelKey: 'expense' },
  ];
  const showUserChips =
    (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') &&
    (groupUsers?.length ?? 0) > 1 &&
    typeof onUserFilterChange === 'function';

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className={stitchTransactionPageSearch.stack}>
        <div className={stitchTransactionPageSearch.wrap}>
          <Search
            aria-hidden
            className={cn(
              stitchTransactionPageSearch.icon,
              searchFocused && stitchTransactionPageSearch.iconActive
            )}
          />
          <Input
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchPlaceholder')}
            value={filters.searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={stitchTransactionPageSearch.input}
          />
          {filters.searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className={stitchTransactionPageSearch.clear}
              aria-label={t('clearSearchAria')}
            >
              <X className={stitchTransactionPageSearch.clearIcon} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {showUserChips ? (
        <div className={cn(stitchTransactions.chipRowUserWrap, '-mx-4 px-4')}>
          <div
            className={stitchTransactions.chipRowUserScroll}
            role="toolbar"
            aria-label={tChips('userToolbarAria')}
          >
            <FilterChip
              label={tUsers('all')}
              active={(selectedUserId ?? 'all') === 'all'}
              onClick={() => onUserFilterChange?.('all')}
              className={stitchTransactions.chipSnapItem}
            />
            {groupUsers?.map((user) => (
              <FilterChip
                key={user.id}
                label={user.name ?? 'User'}
                active={selectedUserId === user.id}
                onClick={() => onUserFilterChange?.(user.id)}
                className={stitchTransactions.chipSnapItem}
              />
            ))}
          </div>
          <p className={stitchTransactions.chipScrollHint}>{tChips('userChipsScrollHint')}</p>
        </div>
      ) : null}

      <div
        className={cn(stitchTransactions.chipRow, 'flex-wrap')}
        role="toolbar"
        aria-label={tChips('toolbarAria')}
      >
        {types.map(({ key, labelKey }) => (
          <FilterChip
            key={key}
            label={t(`typeOptions.${labelKey}`)}
            active={filters.type === key}
            onClick={() => setType(key)}
            className={stitchTransactions.chipSnapItem}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          className={cn(stitchTransactions.chipBase, stitchTransactions.chipInactive)}
        >
          <SlidersHorizontal className={stitchTransactions.filtersChipIcon} aria-hidden />
          {tChips('filters')}
        </button>
      </div>

      <FilterDrawer
        open={advancedOpen}
        onOpenChange={setAdvancedOpen}
        title={tChips('drawerTitle')}
      >
        <div className="overflow-y-auto px-2 pb-4">
          <TransactionFiltersLazy
            filters={filters}
            onFiltersChange={onFiltersChange}
            categories={categories}
            {...(accounts !== undefined ? { accounts } : {})}
            {...(budgetName !== undefined ? { budgetName } : {})}
            {...(onClearBudgetFilter !== undefined ? { onClearBudgetFilter } : {})}
          />
        </div>
      </FilterDrawer>
    </div>
  );
}
