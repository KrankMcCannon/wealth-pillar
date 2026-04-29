'use client';

import { memo, useCallback, useMemo, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { DateTime } from 'luxon';
import {
  getCategoryLabel as getCategoryLabelLogic,
  getCategoryColor as getCategoryColorLogic,
} from '@/server/use-cases/categories/category.logic';
import { CategoryBadge } from '@/components/ui/category-badge';
import { HomeAmount } from '@/components/home/home-amount';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import { toDateTime } from '@/lib/utils/date-utils';
import type { Transaction, Category } from '@/lib/types';
import { stitchTransactions } from '@/styles/home-design-foundation';
import { groupByDay } from '../utils/group-by-day';
import { TransactionPagination } from './transaction-pagination';
import type { PageSizeOption } from '../hooks/usePaginatedTransactions';

function formatTxTime(dateStr: string, locale: string): string | null {
  if (!dateStr.includes('T')) return null;
  const dt = toDateTime(dateStr);
  if (!dt?.isValid) return null;
  return dt.setLocale(locale).toLocaleString(DateTime.TIME_SIMPLE);
}

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
      {[1, 2].map((i) => (
        <div key={i} className={stitchTransactions.daySectionOuter}>
          <div className="h-4 w-28 animate-pulse rounded bg-[#11295f]/80" />
          <div className={cn(stitchTransactions.dayCard, 'space-y-2 p-2')}>
            {[1, 2].map((j) => (
              <div key={j} className="flex animate-pulse gap-3 p-2">
                <div className="h-10 w-10 shrink-0 rounded-full bg-[#11295f]" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 w-[55%] rounded bg-[#11295f]/90" />
                  <div className="h-2.5 w-[40%] rounded bg-[#11295f]/70" />
                </div>
                <div className="h-4 w-16 rounded bg-[#11295f]/80" />
              </div>
            ))}
          </div>
        </div>
      ))}
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

  const getCategoryLabel = useCallback(
    (key: string) => getCategoryLabelLogic(categories, key),
    [categories]
  );
  const getCategoryColor = useCallback(
    (key: string) => getCategoryColorLogic(categories, key),
    [categories]
  );

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
            <p className="text-center text-base font-medium text-[#e6ecff]">
              {emptyTitle ?? t('empty.title')}
            </p>
            <p className="mt-2 text-center text-sm text-[#9fb0d7]">
              {emptyDescription ?? t('empty.description')}
            </p>
            <div className="mt-6 flex flex-col gap-2">
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="rounded-xl border border-[#3359c5]/40 bg-[#11295f]/80 px-4 py-3 text-sm font-medium text-[#e6ecff]"
                >
                  {t('empty.clearFilters')}
                </button>
              )}
              {!onClearFilters && onAddTransaction && (
                <button
                  type="button"
                  onClick={onAddTransaction}
                  className="rounded-xl bg-[#183166] px-4 py-3 text-sm font-semibold text-white"
                >
                  {t('empty.addCta')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {dayGroups.map((group) => (
              <section key={group.isoDate} className={stitchTransactions.daySectionOuter}>
                <div className={stitchTransactions.dayHeaderRow}>
                  <span className={stitchTransactions.dayTitle}>{group.formattedDate}</span>
                  <span
                    className={cn(
                      stitchTransactions.dayNet,
                      group.net > 0
                        ? stitchTransactions.dayNetPositive
                        : group.net < 0
                          ? stitchTransactions.dayNetNegative
                          : stitchTransactions.dayNetNeutral
                    )}
                  >
                    {group.net > 0 ? '+' : group.net < 0 ? '−' : ''}
                    {formatCurrency(Math.abs(group.net))}
                  </span>
                </div>
                <div className={stitchTransactions.dayCard}>
                  {group.transactions.map((tx) => (
                    <TransactionRowButton
                      key={tx.id}
                      transaction={tx}
                      getCategoryLabel={getCategoryLabel}
                      getCategoryColor={getCategoryColor}
                      locale={locale}
                      onEdit={onEditTransaction}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
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
            className="mt-6 border-t border-[#3359c5]/25 pt-4"
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

interface RowProps {
  transaction: Transaction;
  getCategoryLabel: (key: string) => string;
  getCategoryColor: (key: string) => string;
  locale: string;
  onEdit: (tx: Transaction) => void;
}

const TransactionRowButton = memo(function TransactionRowButton({
  transaction: tx,
  getCategoryLabel,
  getCategoryColor,
  locale,
  onEdit,
}: RowProps) {
  const catLabel = getCategoryLabel(tx.category);
  const timePart = formatTxTime(typeof tx.date === 'string' ? tx.date : '', locale);
  const meta = timePart ? `${catLabel} • ${timePart}` : catLabel;

  const amountPrefix = tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : '';
  const amountBody = formatCurrency(Math.abs(tx.amount));

  return (
    <button
      type="button"
      data-testid="transaction-row"
      onClick={() => onEdit(tx)}
      className={stitchTransactions.rowButton}
    >
      <CategoryBadge categoryKey={tx.category} color={getCategoryColor(tx.category)} size="md" />
      <div className="min-w-0 flex-1 text-left">
        <p className={cn('truncate text-sm font-semibold text-[#e6ecff]')}>{tx.description}</p>
        <p className="truncate text-xs text-[#9fb0d7]">{meta}</p>
      </div>
      <div className="shrink-0 text-right">
        {tx.type === 'transfer' ? (
          <p className="text-sm font-semibold tabular-nums text-[#9fb0d7]">
            {amountPrefix}
            {amountBody}
          </p>
        ) : (
          <HomeAmount variant={tx.type === 'income' ? 'income' : 'expense'}>
            {amountPrefix}
            {amountBody}
          </HomeAmount>
        )}
      </div>
    </button>
  );
});

export const TransactionsScreenList = memo(TransactionsScreenListInner);
