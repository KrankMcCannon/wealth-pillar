'use client';

import { memo, useMemo, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { TransactionDayGroupSkeleton } from '@/components/ui/primitives/skeletons';
import { groupByDay } from '../utils/group-by-day';
import { TransactionPagination } from './transaction-pagination';
import { TransactionDayList } from './transaction-day-list';
import type { PageSizeOption } from '../hooks/use-paginated-transactions';

export interface TransactionsScreenListProps {
  transactions: Transaction[];
  totalFilteredCount: number;
  accountNames: Record<string, string>;
  categories: Category[];
  currentPage: number;
  totalPages: number;
  pageSize: number;
  isChangingPage: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: PageSizeOption) => void;
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
  totalFilteredCount,
  accountNames: _accountNames,
  categories,
  currentPage,
  totalPages,
  pageSize,
  isChangingPage,
  onPageChange,
  onPageSizeChange,
  onEditTransaction,
  onAddTransaction,
  onClearFilters,
  emptyTitle,
  emptyDescription,
  className,
}: TransactionsScreenListProps) {
  const t = useTranslations('Transactions.Table');
  const locale = useLocale();

  const dayGroups = useMemo(() => groupByDay(transactions, locale), [transactions, locale]);
  const isEmpty = transactions.length === 0 && !isChangingPage;
  const showPagination = totalPages > 1 || totalFilteredCount > 0;

  const sectionRef = useRef<HTMLDivElement>(null);
  const prevIsChangingPage = useRef(false);
  useEffect(() => {
    if (prevIsChangingPage.current && !isChangingPage) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevIsChangingPage.current = isChangingPage;
  }, [isChangingPage]);

  return (
    <div ref={sectionRef} className={cn('relative', className)}>
      <div className={cn('transition-opacity duration-200', isChangingPage && 'opacity-50')}>
        {isChangingPage ? (
          <ListSkeleton />
        ) : isEmpty ? (
          <div className={cn(stitchTransactions.dayCard, 'p-6')} role="status" aria-live="polite">
            <p className="text-center text-base font-medium text-foreground">
              {emptyTitle ?? t('empty.title')}
            </p>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              {emptyDescription ?? t('empty.description')}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="rounded-xl border border-border/40 bg-muted/80 px-4 py-3 text-sm font-medium text-foreground"
                >
                  {t('empty.clearFilters')}
                </button>
              )}
              {!onClearFilters && onAddTransaction && (
                <button
                  type="button"
                  onClick={onAddTransaction}
                  className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white"
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
            accountNames={_accountNames}
            categories={categories}
            className="space-y-5"
            onEditTransaction={onEditTransaction}
          />
        )}

        {showPagination && (
          <TransactionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalFilteredCount}
            pageSize={pageSize}
            isLoading={isChangingPage}
            onPageChange={onPageChange}
            {...(onPageSizeChange !== undefined ? { onPageSizeChange } : {})}
            className="mt-6 pt-2"
          />
        )}
      </div>

      {onAddTransaction && (
        <button
          type="button"
          data-testid="transactions-fab-add"
          onClick={onAddTransaction}
          className={stitchTransactions.fab}
          aria-label={t('empty.addCta')}
        >
          <Plus className="h-7 w-7" aria-hidden />
        </button>
      )}
    </div>
  );
}

export const TransactionsScreenList = memo(TransactionsScreenListInner);
