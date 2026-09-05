'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, Upload, X } from 'lucide-react';
import { HomeDashboardMain, PageFab } from '@/components/layout';
import { Button, Input, Spinner } from '@/components/ui';
import { FilterDrawer } from '@/components/ui/filters';
import { TransactionFilters } from '@/features/transactions';
import { TransactionRow } from './transaction-row';
import { groupByDay } from '@/features/transactions/utils/group-by-day';
import { currentSpendable, spendableByDay } from '@/features/transactions/utils/spendable';
import { getCategoryLabel } from '@/server/use-cases/categories/category.logic';
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel';
import { formatCurrency, cn } from '@/lib/utils';
import { stitchHome, stitchTransactions } from '@/styles/home-design-foundation';
import type { TransactionTypeFilter } from '@/server/use-cases/transactions/transaction.logic';
import { CompactSegments, FilterDock } from './filter-dock';
import { StickyTotal } from './sticky-total';
import type { TransactionsLedgerProps } from './transactions-workspace-props';

export function TransactionsLedger(props: TransactionsLedgerProps) {
  const tLedger = useTranslations('TransactionsContent.Ledger');
  const tFilters = useTranslations('Transactions.Filters');
  const locale = useLocale();
  const tChips = useTranslations('Transactions.Filters.FilterChips');
  const tLoadMore = useTranslations('Transactions.LoadMore');
  const tTable = useTranslations('Transactions.Table');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const dayGroups = useMemo(
    () => groupByDay(props.transactions, locale),
    [props.transactions, locale]
  );
  const spendableNow = useMemo(
    () =>
      currentSpendable(props.accounts, {
        ...(props.selectedUserId ? { userId: props.selectedUserId } : {}),
        ...(props.filters.accountId && props.filters.accountId !== 'all'
          ? { accountId: props.filters.accountId }
          : {}),
      }),
    [props.accounts, props.selectedUserId, props.filters.accountId]
  );
  const spendableAtDay = useMemo(
    () => spendableByDay(dayGroups, spendableNow, props.accounts),
    [dayGroups, spendableNow, props.accounts]
  );

  const totalRef = useRef<HTMLDivElement>(null);
  const dayEls = useRef(new Map<string, HTMLElement>());
  const newestDay = dayGroups[0]?.isoDate;
  const [topDay, setTopDay] = useState<string | undefined>(newestDay);

  useEffect(() => {
    setTopDay(newestDay);
  }, [newestDay]);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = totalRef.current?.getBoundingClientRect().bottom ?? 160;
      let nextDay = dayGroups[dayGroups.length - 1]?.isoDate ?? newestDay;
      for (const group of dayGroups) {
        const el = dayEls.current.get(group.isoDate);
        if (!el) continue;
        if (el.getBoundingClientRect().bottom > line + 2) {
          nextDay = group.isoDate;
          break;
        }
      }
      setTopDay((current) => (current === nextDay ? current : nextDay));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [dayGroups, newestDay]);

  const atNewestDay = !topDay || topDay === newestDay;
  const total = atNewestDay ? spendableNow : (spendableAtDay.get(topDay) ?? spendableNow);
  const asOfGroup = dayGroups.find((group) => group.isoDate === topDay);
  const caption = atNewestDay
    ? tLedger('canSpend')
    : asOfGroup
      ? tLedger('asOf', { date: asOfGroup.formattedDate })
      : tLedger('canSpend');

  const sentinelRef = useRef<HTMLDivElement>(null);
  useInfiniteScrollSentinel(sentinelRef, {
    enabled: props.hasMore && props.transactions.length > 0,
    hasMore: props.hasMore,
    isLoading: props.isLoadingMore,
    onLoadMore: props.onLoadMore,
  });

  return (
    <>
      <StickyTotal totalRef={totalRef}>
        <section aria-labelledby="spendable-total-label">
          <p
            id="spendable-total-label"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {caption}
          </p>
          <p
            className={cn(
              'mt-0.5 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.03em]',
              total >= 0 ? stitchHome.amountIncome : stitchHome.amountExpense
            )}
            aria-live="polite"
          >
            {total < 0 ? '−' : ''}
            {formatCurrency(Math.abs(total))}
          </p>
        </section>
      </StickyTotal>

      <HomeDashboardMain id="main-transactions" className="gap-2.5 pt-1.5">
        <FilterDock>
          <CompactSegments
            ariaLabel={tLedger('typesAria')}
            selected={props.filters.type}
            onSelect={(type: TransactionTypeFilter) => props.setFilters({ ...props.filters, type })}
            options={[
              { key: 'all' as const, label: tFilters('typeOptions.all') },
              { key: 'income' as const, label: tFilters('typeOptions.income') },
              { key: 'expense' as const, label: tFilters('typeOptions.expense') },
            ]}
          />
        </FilterDock>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="text"
              enterKeyHint="search"
              autoComplete="off"
              value={props.filters.searchQuery}
              onChange={(event) =>
                props.setFilters({ ...props.filters, searchQuery: event.target.value })
              }
              placeholder={tFilters('searchPlaceholder')}
              aria-label={tFilters('searchPlaceholder')}
              className="min-h-11 rounded-xl border-border/30 bg-muted/70 pl-10 pr-10"
            />
            {props.filters.searchQuery ? (
              <button
                type="button"
                onClick={() => props.setFilters({ ...props.filters, searchQuery: '' })}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label={tFilters('clearSearchAria')}
              >
                <X className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={props.onImport}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/35 bg-muted/80 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label={tChips('import')}
            data-testid="transactions-import-button"
          >
            <Upload className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/35 bg-muted/80 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label={tChips('filters')}
          >
            <SlidersHorizontal className="size-4" aria-hidden />
          </button>
        </div>

        {props.transactions.length === 0 && !props.isNavigatingFilters ? (
          <div className={cn(stitchTransactions.emptyState, 'mt-3')} role="status">
            <p className={stitchTransactions.emptyTitle}>{props.emptyTitle}</p>
            <p className={stitchTransactions.emptyDescription}>{props.emptyDescription}</p>
          </div>
        ) : (
          <div
            className={cn('mt-3 flex flex-col gap-4', props.isNavigatingFilters && 'opacity-50')}
          >
            {dayGroups.map((group) => (
              <section
                key={group.isoDate}
                ref={(node) => {
                  if (node) dayEls.current.set(group.isoDate, node);
                  else dayEls.current.delete(group.isoDate);
                }}
                className="flex flex-col"
              >
                <div className={stitchTransactions.dayHeaderRow}>
                  <h3 className={stitchTransactions.dayHeaderTitle}>{group.formattedDate}</h3>
                  <p className={stitchTransactions.dayHeaderTotalRow} data-testid="day-group-total">
                    <span className={stitchTransactions.dayHeaderTotalValue}>
                      {group.net >= 0 ? '+' : '−'}
                      {formatCurrency(Math.abs(group.net))}
                    </span>
                  </p>
                </div>
                <ul className={stitchHome.plainList}>
                  {group.transactions.map((transaction) => (
                    <li key={transaction.id}>
                      <TransactionRow
                        transaction={transaction}
                        getCategoryLabel={(key) => getCategoryLabel(props.categories, key)}
                        onEditTransaction={props.onEditTransaction}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {props.hasMore && props.transactions.length > 0 ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div ref={sentinelRef} className="h-px w-full" aria-hidden />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full max-w-sm"
              disabled={props.isLoadingMore}
              onClick={props.onLoadMore}
            >
              {props.isLoadingMore ? (
                <>
                  <Spinner data-icon="inline-start" />
                  {tLoadMore('loading')}
                </>
              ) : (
                tLoadMore('cta')
              )}
            </Button>
          </div>
        ) : null}

        {!props.hasMore && props.transactions.length > 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground" role="status">
            {tLoadMore('end')}
          </p>
        ) : null}

        <FilterDrawer
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          title={tChips('drawerTitle')}
        >
          <div className="overflow-y-auto px-2 pb-4">
            <TransactionFilters
              filters={props.filters}
              onFiltersChange={(next) => props.setFilters(next)}
              categories={props.categories}
              accounts={props.accounts}
              {...(props.budgetName !== undefined ? { budgetName: props.budgetName } : {})}
              {...(props.onClearBudgetFilter !== undefined
                ? { onClearBudgetFilter: props.onClearBudgetFilter }
                : {})}
            />
          </div>
        </FilterDrawer>
      </HomeDashboardMain>

      <PageFab
        onClick={props.onAddTransaction}
        ariaLabel={tTable('empty.addCta')}
        testId="transactions-fab-add"
      />
    </>
  );
}
