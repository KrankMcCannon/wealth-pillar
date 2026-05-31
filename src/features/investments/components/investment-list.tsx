'use client';

import { useId, memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { TransactionPagination } from '@/features/transactions';
import type { PageSizeOption } from '@/features/transactions/components/transaction-pagination';
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
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary" aria-hidden>
        <TrendingUp className="size-10" strokeWidth={1.25} />
      </div>
      <p className="mb-2 text-lg font-semibold text-primary">{tList('empty')}</p>
      <p className="mb-6 max-w-md px-2 text-sm leading-snug text-muted-foreground">
        {tList('emptyDescription')}
      </p>
      <Button type="button" size="sm" onClick={() => openModal('investment')}>
        {tMenu('newInvestment')}
      </Button>
    </div>
  );

  return (
    <section ref={sectionRef} className={investmentsStyles.card.root} aria-labelledby={headingId}>
      <div className={`${investmentsStyles.card.header} flex items-center justify-between`}>
        <h2 id={headingId} className={investmentsStyles.card.title}>
          {tList('title')}
        </h2>
      </div>

      <div className={investmentsStyles.card.content}>
        {isEmpty ? (
          emptyBlock
        ) : (
          <ul className="flex flex-col">
            {paginatedRows.map((inv) => {
              const sym = (inv.symbol?.toUpperCase() ?? '').trim() || '—';
              const date = inv.created_at
                ? new Date(inv.created_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';

              return (
                <li
                  key={inv.id}
                  className={`${investmentsStyles.list.row} ${investmentsStyles.list.rowHover}`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className={investmentsStyles.list.iconWrap} aria-hidden>
                      <ArrowUpRight className="size-5 opacity-80" />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-2">
                        <span className={investmentsStyles.list.symbol}>{sym}</span>
                        <span className={investmentsStyles.list.badge}>
                          {tList('shares', { count: inv.shares_acquired })}
                        </span>
                      </div>
                      <p className={investmentsStyles.list.meta}>{inv.name}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={investmentsStyles.list.amount}>
                      {formatMoney(locale, inv.currency, inv.totalPaid || 0)}
                    </span>
                    <span className={investmentsStyles.list.date}>{date}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {showPagination && (
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
      )}
    </section>
  );
});
