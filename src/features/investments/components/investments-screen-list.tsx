'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingUp } from 'lucide-react';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import { stitchHome, stitchInvestments } from '@/styles/home-design-foundation';
import { useModalState } from '@/lib/navigation/url-state';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

export interface InvestmentsScreenListProps {
  holdings: InvestmentListItem[];
}

function InvestmentsScreenListInner({ holdings }: Readonly<InvestmentsScreenListProps>) {
  const tList = useTranslations('Investments.InvestmentList');
  const tMenu = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const locale = useLocale();
  const headingId = 'investments-list-heading';

  const isEmpty = holdings.length === 0;

  return (
    <section className="flex flex-col gap-1.5" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-sm font-semibold tracking-tight text-foreground">
        {tList('title')}
      </h2>

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
        <ul className={stitchHome.plainList}>
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
            const meta = [holding.name, date, tList('shares', { count: holding.shares_acquired })]
              .filter(Boolean)
              .join(' · ');

            return (
              <li key={holding.id}>
                <PlainListRow title={sym} meta={meta}>
                  <Amount type="balance" size="sm" emphasis="strong">
                    {totalPaid}
                  </Amount>
                </PlainListRow>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export const InvestmentsScreenList = memo(InvestmentsScreenListInner);
