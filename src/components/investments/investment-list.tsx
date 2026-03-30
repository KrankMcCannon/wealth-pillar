'use client';

import { useId, memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateInvestmentMetrics } from '@/lib/utils/investment-math';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { TransactionPagination } from '@/features/transactions';
import type { PageSizeOption } from '@/features/transactions/hooks/usePaginatedTransactions';
import { transactionStyles } from '@/styles/system';
import type { Investment } from './personal-investment-tab';

interface InvestmentListProps {
  investments: Investment[];
}

const PAGINATION_MESSAGES = 'Investments.InvestmentList.pagination';

function formatMoney(locale: string, currency: string, value: number) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export const InvestmentList = memo(function InvestmentList({ investments }: InvestmentListProps) {
  const t = useTranslations('Investments.InvestmentList');
  const locale = useLocale();
  const headingId = useId();
  const s = transactionStyles.transactionTable;
  const ms = s.mobile;

  const [pageSize, setPageSize] = useState<PageSizeOption>(30);
  const [currentPage, setCurrentPage] = useState(1);

  const allRows = useMemo(() => calculateInvestmentMetrics(investments), [investments]);
  const totalItems = allRows.length;
  const isEmpty = totalItems === 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageForDisplay = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (pageForDisplay - 1) * pageSize;
    return allRows.slice(start, start + pageSize);
  }, [allRows, pageForDisplay, pageSize]);

  const handlePageSizeChange = useCallback((size: PageSizeOption) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const sectionRef = useRef<HTMLElement>(null);
  const prevPageRef = useRef(pageForDisplay);
  useEffect(() => {
    if (prevPageRef.current !== pageForDisplay && !isEmpty) {
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    prevPageRef.current = pageForDisplay;
  }, [pageForDisplay, isEmpty]);

  const showPagination = totalItems > 0;

  const emptyBlock = (
    <div role="status" aria-live="polite" className={s.emptyWrapper}>
      <div className={s.emptyIcon} aria-hidden>
        <TrendingUp className="mx-auto h-12 w-12" strokeWidth={1.25} />
      </div>
      <p className={s.emptyTitle}>{t('empty')}</p>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className={transactionStyles.layout.listBlock}
      aria-labelledby={headingId}
    >
      <h2 id={headingId} className="mb-3 text-base font-semibold text-primary sm:mb-4 sm:text-lg">
        {t('title')}
      </h2>

      {/* Mobile: card group come transazioni */}
      <div className={ms.wrapper}>
        {isEmpty ? (
          <div className={ms.emptyWrapper}>{emptyBlock}</div>
        ) : (
          <>
            <div className={ms.cardGroup}>
              {paginatedRows.map((inv) => {
                const isPositive = inv.totalGain >= 0;
                const gainClass = isPositive ? s.amountIncome : s.amountExpense;
                const sym = (inv.symbol?.toUpperCase() ?? '').trim() || '—';
                const symShort = sym.length > 4 ? `${sym.slice(0, 3)}…` : sym;

                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 border-b border-primary/6 px-4 py-3.5 last:border-0"
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[10px] font-bold uppercase leading-tight text-primary"
                      aria-hidden
                    >
                      {symShort}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary/90" title={inv.name}>
                        {inv.name}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium text-primary/45">
                        <span className={s.categoryPill}>{sym}</span>
                        <span className="mx-1.5 text-primary/30" aria-hidden>
                          ·
                        </span>
                        <span>{t('shares', { count: Number(inv.shares_acquired) })}</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums text-primary">
                        {formatMoney(locale, inv.currency, inv.currentValue)}
                      </p>
                      <p className={cn('text-xs font-semibold tabular-nums', gainClass)}>
                        {inv.totalGain >= 0 ? '+' : ''}
                        {formatMoney(locale, inv.currency, inv.totalGain)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-primary/40">
                        {t('paidLabel')}{' '}
                        <span className="font-medium tabular-nums text-primary/55">
                          {formatMoney(locale, inv.currency, inv.totalPaid)}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {showPagination ? (
              <TransactionPagination
                currentPage={pageForDisplay}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={handlePageSizeChange}
                className={ms.pagination}
                messagesNamespace={PAGINATION_MESSAGES}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Desktop: tabella */}
      <div className={cn('hidden sm:block', s.wrapper)}>
        <Table>
          <TableHeader className={s.header}>
            <TableRow className={s.headerRow}>
              <TableHead scope="col" className={s.headerCell}>
                {t('columns.instrument')}
              </TableHead>
              <TableHead scope="col" className={cn(s.headerCell, 'hidden md:table-cell w-28')}>
                {t('columns.shares')}
              </TableHead>
              <TableHead scope="col" className={cn(s.headerCell, 'w-30')}>
                {t('columns.paid')}
              </TableHead>
              <TableHead scope="col" className={cn(s.headerCell, s.headerCellRight, 'w-30')}>
                {t('columns.value')}
              </TableHead>
              <TableHead scope="col" className={cn(s.headerCell, s.headerCellRight, 'w-32')}>
                {t('columns.gain')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isEmpty ? (
              <TableRow>
                <TableCell colSpan={5} className="py-0">
                  {emptyBlock}
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((inv) => {
                const isPositive = inv.totalGain >= 0;
                const gainClass = isPositive ? s.amountIncome : s.amountExpense;
                const sym = (inv.symbol?.toUpperCase() ?? '').trim();

                return (
                  <TableRow key={inv.id} className={cn(s.row, 'cursor-default')}>
                    <TableCell className={s.cell}>
                      <p
                        className={cn(
                          s.descriptionText,
                          'max-w-none sm:max-w-[200px] md:max-w-[280px]'
                        )}
                      >
                        {inv.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className={s.categoryPill}>{sym}</span>
                        <span className="text-[11px] text-primary/45 md:hidden">
                          {t('shares', { count: Number(inv.shares_acquired) })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={cn(
                        s.cell,
                        'hidden md:table-cell text-sm tabular-nums text-primary/80'
                      )}
                    >
                      {t('shares', { count: Number(inv.shares_acquired) })}
                    </TableCell>
                    <TableCell className={cn(s.cell, 'text-sm tabular-nums text-primary/85')}>
                      {formatMoney(locale, inv.currency, inv.totalPaid)}
                    </TableCell>
                    <TableCell className={cn(s.cell, s.cellRight)}>
                      <span className={cn(s.amount, 'text-primary')}>
                        {formatMoney(locale, inv.currency, inv.currentValue)}
                      </span>
                    </TableCell>
                    <TableCell className={cn(s.cell, s.cellRight)}>
                      <span className={cn(s.amount, gainClass)}>
                        {inv.totalGain >= 0 ? '+' : ''}
                        {formatMoney(locale, inv.currency, inv.totalGain)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {showPagination ? (
          <TransactionPagination
            currentPage={pageForDisplay}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            messagesNamespace={PAGINATION_MESSAGES}
          />
        ) : null}
      </div>
    </section>
  );
});
