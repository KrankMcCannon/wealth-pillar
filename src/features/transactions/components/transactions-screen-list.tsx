'use client';

import { memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { TransactionDayGroupSkeleton } from '@/components/ui/primitives/skeletons';
import { groupByDay } from '../utils/group-by-day';
import { TransactionDayList } from './transaction-day-list';
import { Button, Spinner } from '@/components/ui';

export interface TransactionsScreenListProps {
  transactions: Transaction[];
  accountNames: Record<string, string>;
  categories: Category[];
  hasMore: boolean;
  isLoadingMore: boolean;
  isNavigatingFilters?: boolean;
  onLoadMore: () => void;
  onEditTransaction: (transaction: Transaction) => void;
  onAddTransaction?: () => void;
  onClearFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

function ListSkeleton() {
  return (
    <div className={stitchTransactions.listSkeleton} aria-busy="true">
      <TransactionDayGroupSkeleton />
      <TransactionDayGroupSkeleton />
    </div>
  );
}

function TransactionsScreenListInner({
  transactions,
  accountNames,
  categories,
  hasMore,
  isLoadingMore,
  isNavigatingFilters = false,
  onLoadMore,
  onEditTransaction,
  onAddTransaction,
  onClearFilters,
  emptyTitle,
  emptyDescription,
  className,
}: TransactionsScreenListProps) {
  const t = useTranslations('Transactions.Table');
  const tLoadMore = useTranslations('Transactions.LoadMore');
  const locale = useLocale();

  const dayGroups = useMemo(() => groupByDay(transactions, locale), [transactions, locale]);

  const isEmpty = transactions.length === 0 && !isNavigatingFilters;
  const showLoadMore = hasMore && transactions.length > 0;

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry?.isIntersecting && hasMore && !isLoadingMore) {
        onLoadMore();
      }
    },
    [hasMore, isLoadingMore, onLoadMore]
  );

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !showLoadMore) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin: '120px',
      threshold: 0,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [handleIntersect, showLoadMore]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex flex-col gap-4 transition-opacity duration-200',
          isNavigatingFilters && 'opacity-50'
        )}
      >
        {isNavigatingFilters ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <div className={stitchTransactions.emptyState} role="status" aria-live="polite">
            <p className={stitchTransactions.emptyTitle}>{emptyTitle ?? t('empty.title')}</p>
            <p className={stitchTransactions.emptyDescription}>
              {emptyDescription ?? t('empty.description')}
            </p>
            <div className={stitchTransactions.emptyActions}>
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className={stitchTransactions.emptyCtaSecondary}
                >
                  {t('empty.clearFilters')}
                </button>
              )}
              {!onClearFilters && onAddTransaction && (
                <button
                  type="button"
                  onClick={onAddTransaction}
                  className={stitchTransactions.emptyCtaPrimary}
                >
                  {t('empty.addCta')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <TransactionDayList
            groupedTransactions={dayGroups.map((group) => ({
              date: group.isoDate,
              formattedDate: group.formattedDate,
              transactions: group.transactions,
              total: group.net,
              count: group.transactions.length,
            }))}
            accountNames={accountNames}
            categories={categories}
            className="flex flex-col gap-5"
            onEditTransaction={onEditTransaction}
          />
        )}

        {showLoadMore && !isNavigatingFilters ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div ref={sentinelRef} className="h-px w-full" aria-hidden />
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full max-w-sm"
              disabled={isLoadingMore}
              onClick={onLoadMore}
            >
              {isLoadingMore ? (
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

        {!hasMore && transactions.length > 0 && !isNavigatingFilters ? (
          <p className="py-4 text-center text-sm text-muted-foreground" role="status">
            {tLoadMore('end')}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const TransactionsScreenList = memo(TransactionsScreenListInner);
