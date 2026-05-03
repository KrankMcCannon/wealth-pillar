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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Input,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { stitchTransactionPageSearch, stitchTransactions } from '@/styles/home-design-foundation';

const TransactionFiltersLazy = dynamic(
  () => import('./transaction-filters').then((mod) => mod.TransactionFilters),
  { ssr: false, loading: () => <div className="p-6 text-center text-sm text-[#9fb0d7]">…</div> }
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
            <button
              type="button"
              onClick={() => onUserFilterChange?.('all')}
              className={cn(
                stitchTransactions.chipBase,
                stitchTransactions.chipSnapItem,
                (selectedUserId ?? 'all') === 'all'
                  ? stitchTransactions.chipActive
                  : stitchTransactions.chipInactive
              )}
            >
              {tUsers('all')}
            </button>
            {groupUsers?.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => onUserFilterChange?.(user.id)}
                className={cn(
                  stitchTransactions.chipBase,
                  stitchTransactions.chipSnapItem,
                  selectedUserId === user.id
                    ? stitchTransactions.chipActive
                    : stitchTransactions.chipInactive
                )}
              >
                {user.name ?? 'User'}
              </button>
            ))}
          </div>
          <p className={stitchTransactions.chipScrollHint}>{tChips('userChipsScrollHint')}</p>
        </div>
      ) : null}

      <div className={stitchTransactions.chipRow} role="toolbar" aria-label={tChips('toolbarAria')}>
        {types.map(({ key, labelKey }) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              stitchTransactions.chipBase,
              filters.type === key ? stitchTransactions.chipActive : stitchTransactions.chipInactive
            )}
          >
            {t(`typeOptions.${labelKey}`)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAdvancedOpen(true)}
          className={cn(stitchTransactions.chipBase, stitchTransactions.chipInactive)}
        >
          <SlidersHorizontal className={stitchTransactions.filtersChipIcon} aria-hidden />
          {tChips('filters')}
        </button>
      </div>

      <Drawer open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <DrawerContent className="max-h-[85vh] border-[#3359c5]/30 bg-[#0b1f4f]/95">
          <DrawerHeader>
            <DrawerTitle className="text-[#e6ecff]">{tChips('drawerTitle')}</DrawerTitle>
            <DrawerDescription className="sr-only">{tChips('drawerTitle')}</DrawerDescription>
          </DrawerHeader>
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
        </DrawerContent>
      </Drawer>
    </div>
  );
}
