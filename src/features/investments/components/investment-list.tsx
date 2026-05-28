'use client';

import { useId, memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { TransactionPagination } from '@/features/transactions';
import type { PageSizeOption } from '@/features/transactions/hooks/use-transactions-content';
import { useModalState } from '@/lib/navigation/url-state';
import { Button } from '@/components/ui/button';
import type { Investment } from './personal-investment-tab';
import { investmentsStyles } from '@/features/investments';

interface InvestmentListProps {
  investments: Investment[];
}

const PAGINATION_MESSAGES = 'Investments.InvestmentList.pagination';

function formatMoney(locale: string, currency: string, value: number) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export const InvestmentList = memo(function InvestmentList({ investments }: InvestmentListProps) {
  const tList = useTranslations('Investments.InvestmentList');
  const tMenu = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const locale = useLocale();
  const headingId = useId();

  const sortedInvestments = useMemo(() => {
    return [...investments].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [investments]);

  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalItems = sortedInvestments.length;
  const isEmpty = totalItems === 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const pageForDisplay = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (pageForDisplay - 1) * pageSize;
    return sortedInvestments.slice(start, start + pageSize);
  }, [sortedInvestments, pageForDisplay, pageSize]);

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
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-10 sm:py-14 text-center"
    >
      <div className="bg-primary/10 p-4 rounded-full mb-4 text-primary" aria-hidden>
        <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.25} />
      </div>
      <p className="text-lg font-semibold text-primary mb-2">{tList('empty')}</p>
      <p className="max-w-md px-2 text-sm leading-snug text-muted-foreground mb-6">
        {tList('emptyDescription')}
      </p>
      <Button type="button" size="sm" onClick={() => openModal('investment')}>
        {tMenu('newInvestment')}
      </Button>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      className={investmentsStyles.card.root + ' md:hidden'}
      aria-labelledby={headingId}
    >
      <div className={investmentsStyles.card.header + ' flex justify-between items-center'}>
        <h2 id={headingId} className={investmentsStyles.card.title}>
          {tList('title')}
        </h2>
        {showPagination && (
          <button className="text-sm font-medium text-primary hover:underline">
            {tList('viewAll')}
          </button>
        )}
      </div>

      <div className={investmentsStyles.card.content + ' overflow-x-auto'}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/25">
              <th className="py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {tList('columns.instrument')}
              </th>
              <th className="py-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">
                {tList('columns.paid')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td colSpan={4} className="py-4">
                  {emptyBlock}
                </td>
              </tr>
            ) : (
              paginatedRows.map((inv) => {
                const sym = (inv.symbol?.toUpperCase() ?? '').trim() || '—';
                const date = inv.created_at
                  ? new Date(inv.created_at).toLocaleDateString(locale, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—';

                return (
                  <tr
                    key={inv.id}
                    className="border-b border-border/15 hover:bg-accent/40 transition-colors group cursor-default last:border-0"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/40 flex items-center justify-center text-primary border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.05)] group-hover:scale-105 transition-all duration-300 shrink-0">
                          <ArrowUpRight className="w-5 h-5 opacity-80" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-bold text-white tracking-tight leading-none">
                              {sym}
                            </h3>
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider border border-primary/20">
                              {tList('shares', { count: inv.shares_acquired })}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-muted-foreground truncate mt-1 opacity-90 leading-tight">
                            {inv.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-sm font-bold text-white tabular-nums leading-none">
                          {formatMoney(locale, inv.currency, inv.totalPaid || 0)}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                          {date}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div>
          <TransactionPagination
            currentPage={pageForDisplay}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={handlePageSizeChange}
            messagesNamespace={PAGINATION_MESSAGES}
            customStyles={investmentsStyles.pagination}
          />
        </div>
      )}
    </section>
  );
});
