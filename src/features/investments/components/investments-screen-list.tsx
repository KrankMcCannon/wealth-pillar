'use client';

import { memo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUpRight, TrendingUp } from 'lucide-react';
import { RowCard } from '@/components/ui/layout/row-card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { stitchHome, stitchInvestments } from '@/styles/home-design-foundation';
import { useInfiniteScrollSentinel } from '@/hooks/use-infinite-scroll-sentinel';
import { useModalState } from '@/lib/navigation/url-state';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { cn } from '@/lib/utils';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

export interface InvestmentsScreenListProps {
  holdings: InvestmentListItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

function InvestmentsScreenListInner({
  holdings,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: Readonly<InvestmentsScreenListProps>) {
  const tList = useTranslations('Investments.InvestmentList');
  const tLoadMore = useTranslations('Transactions.LoadMore');
  const tMenu = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const locale = useLocale();
  const headingId = 'investments-list-heading';
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isEmpty = holdings.length === 0;
  const showLoadMore = hasMore && holdings.length > 0;

  useInfiniteScrollSentinel(sentinelRef, {
    enabled: showLoadMore,
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore,
  });

  return (
    <section className={stitchInvestments.listSection} aria-labelledby={headingId}>
      <div className={stitchInvestments.listSectionHeader}>
        <h2 id={headingId} className={stitchInvestments.listSectionTitle}>
          {tList('title')}
        </h2>
      </div>

      <div className={stitchInvestments.listStack}>
        {isEmpty ? (
          <div className={stitchInvestments.emptyState} role="status" aria-live="polite">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="size-6" strokeWidth={1.25} aria-hidden />
            </div>
            <p className={stitchInvestments.emptyTitle}>{tList('empty')}</p>
            <p className={stitchInvestments.emptyDescription}>{tList('emptyDescription')}</p>
            <div className={stitchInvestments.emptyActions}>
              <button
                type="button"
                className={stitchInvestments.emptyCtaPrimary}
                onClick={() => openModal('investment')}
              >
                {tMenu('newInvestment')}
              </button>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {holdings.map((holding) => {
              const sym = (holding.symbol?.toUpperCase() ?? '').trim() || '—';
              const date = holding.created_at
                ? new Date(holding.created_at).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : '—';
              const totalPaid = holding.totalPaid ?? holding.amount + (holding.tax_paid ?? 0);

              return (
                <li key={holding.id}>
                  <RowCard
                    icon={
                      <div className={stitchInvestments.holdingIconWrap} aria-hidden>
                        <ArrowUpRight className="size-5 opacity-80" />
                      </div>
                    }
                    iconColor="none"
                    title={sym}
                    titleClassName={stitchHome.rowTitle}
                    subtitle={holding.name}
                    subtitleClassName={stitchHome.rowMeta}
                    metadata={
                      <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                        {tList('shares', { count: holding.shares_acquired })}
                      </span>
                    }
                    primaryValue={formatCurrencyLocale(totalPaid, locale)}
                    secondaryValue={date}
                    valueClassName="text-sm font-bold tabular-nums text-foreground"
                    secondaryValueClassName="text-[10px] font-bold tabular-nums text-muted-foreground"
                    className={cn(stitchHome.listRowInteractive, 'w-full')}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {showLoadMore ? (
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

        {!hasMore && holdings.length > 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground" role="status">
            {tLoadMore('end')}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export const InvestmentsScreenList = memo(InvestmentsScreenListInner);
