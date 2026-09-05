'use client';

import { memo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { Amount } from '@/components/ui/primitives/amount';
import { stitchHome, stitchInvestments } from '@/styles/home-design-foundation';
import { cn, formatCurrency } from '@/lib/utils';
import { useModalState } from '@/lib/navigation/url-state';
import type { InvestmentListItem } from '@/server/use-cases/investments/investment.types';

export interface InvestmentsScreenListProps {
  holdings: InvestmentListItem[];
}

function formatHoldingDate(value: Date | string | null, locale: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function HoldingRow({
  holding,
  onEdit,
}: {
  holding: InvestmentListItem;
  onEdit: (id: string) => void;
}) {
  const tList = useTranslations('Investments.InvestmentList');
  const locale = useLocale();

  const symbol = (holding.symbol?.toUpperCase() ?? '').trim();
  const title = holding.name?.trim() || symbol || '—';
  const date = formatHoldingDate(holding.created_at, locale);
  const sharesLabel = tList('shares', {
    count: holding.shares_acquired,
    shares: holding.shares_acquired.toLocaleString(locale, { maximumFractionDigits: 6 }),
  });
  const paid = holding.totalPaid ?? holding.amount + (holding.tax_paid ?? 0);
  const hasQuote = (holding.currentPrice ?? 0) > 0 || (holding.currentValue ?? 0) > 0;
  const displayValue = hasQuote ? (holding.currentValue ?? paid) : paid;
  const gain = holding.totalGain ?? 0;
  const gainPercent = paid > 0 ? (gain / paid) * 100 : 0;
  const showChange = hasQuote && holding.totalGain != null;
  const isUp = gain >= 0;
  const valueLabel = formatCurrency(displayValue);
  const changeAmount = formatCurrency(Math.abs(gain));
  const changePercent = `${Math.abs(gainPercent).toLocaleString(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  })}%`;
  const changeVisual = `${isUp ? '+' : '−'}${changeAmount} · ${isUp ? '+' : '−'}${changePercent}`;
  const changeSpoken = showChange
    ? tList(isUp ? 'changeUp' : 'changeDown', {
        amount: changeAmount,
        percent: changePercent,
      })
    : '';
  const ariaLabel = showChange
    ? tList('editAriaWithChange', {
        symbol: symbol || title,
        name: title,
        date,
        shares: sharesLabel,
        value: valueLabel,
        change: changeSpoken,
      })
    : tList('editAria', {
        symbol: symbol || title,
        name: title,
        date,
        shares: sharesLabel,
        value: valueLabel,
      });

  const TrendIcon = isUp ? TrendingUp : TrendingDown;

  return (
    <button
      type="button"
      onClick={() => onEdit(holding.id)}
      className={stitchInvestments.holdingRow}
      data-testid={`investment-row-${holding.id}`}
      aria-label={ariaLabel}
    >
      <span className="min-w-0 flex-1">
        <span className={stitchInvestments.holdingTicker}>{title}</span>
        <span className={stitchInvestments.holdingMeta}>
          {date}
          {' · '}
          {sharesLabel}
        </span>
      </span>
      <span className={stitchInvestments.holdingValueCol}>
        <Amount type="balance" size="md" emphasis="strong">
          {displayValue}
        </Amount>
        {showChange ? (
          <span
            className={cn(
              stitchInvestments.holdingChange,
              isUp ? stitchHome.amountIncome : stitchHome.amountExpense
            )}
          >
            <TrendIcon className="size-3.5 shrink-0" aria-hidden />
            {changeVisual}
          </span>
        ) : null}
      </span>
    </button>
  );
}

function InvestmentsScreenListInner({ holdings }: Readonly<InvestmentsScreenListProps>) {
  const tList = useTranslations('Investments.InvestmentList');
  const tMenu = useTranslations('Header.ActionMenu');
  const { openModal } = useModalState();
  const headingId = 'investments-list-heading';
  const isEmpty = holdings.length === 0;

  return (
    <section className={stitchHome.scanSection} aria-labelledby={headingId}>
      <h2 id={headingId} className={stitchHome.scanSectionTitle}>
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
          {holdings.map((holding) => (
            <li key={holding.id}>
              <HoldingRow holding={holding} onEdit={(id) => openModal('investment', id)} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export const InvestmentsScreenList = memo(InvestmentsScreenListInner);
