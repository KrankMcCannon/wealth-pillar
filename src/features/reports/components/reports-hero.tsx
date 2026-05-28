'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface ReportsHeroProps {
  netFlow: number;
  income: number;
  expenses: number;
  totalSpendable?: number;
  totalReserve?: number;
  netSavings?: NetSavingsResult;
  /** Delta vs previous window; `null` = no data to compare. Ignored when `omitComparison`. */
  comparisonPercent?: number | null;
  comparisonLabel?: string;
  /** When true, no comparison row is shown (e.g. member drill-down). */
  omitComparison?: boolean;
}

export function ReportsHero({
  netFlow,
  income,
  expenses,
  totalSpendable,
  totalReserve,
  netSavings,
  comparisonPercent,
  comparisonLabel,
  omitComparison = false,
}: ReportsHeroProps) {
  const t = useTranslations('Reports.Hero');
  const { format: formatMoney } = useFormatCurrency();
  const positive = netFlow >= 0;
  const pct = comparisonPercent ?? null;
  const trendUp = pct !== null && pct >= 0;

  return (
    <section aria-labelledby="reports-hero-heading" className="grid grid-cols-2 gap-2">
      <h2 id="reports-hero-heading" className="sr-only">
        {t('srHeading')}
      </h2>
      <div className={`${stitchReports.heroNetCard} col-span-2`}>
        <div className={stitchReports.heroNetDecor} aria-hidden />
        <div className="relative z-1">
          <p className={stitchReports.heroEyebrow}>{t('netFlow')}</p>
          <p className={stitchReports.heroNetAmount}>
            {positive ? '+' : ''}
            {formatMoney(netFlow)}
          </p>
          {!omitComparison && pct !== null ? (
            <div
              className={cn(
                stitchReports.trendRow,
                trendUp ? stitchReports.trendPositive : stitchReports.trendNegative
              )}
            >
              {trendUp ? (
                <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <TrendingDown className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span>
                {trendUp ? '+' : ''}
                {pct.toFixed(0)}% {comparisonLabel ?? ''}
              </span>
            </div>
          ) : null}
          {!omitComparison && pct === null ? (
            <p className="mt-1 text-[12px] text-muted-foreground">{t('noComparison')}</p>
          ) : null}
        </div>
      </div>
      <div className={stitchReports.heroSmallCard}>
        <p className={stitchReports.heroEyebrow}>{t('income')}</p>
        <p className={stitchReports.heroSmallAmount}>{formatMoney(income)}</p>
      </div>
      <div className={stitchReports.heroSmallCard}>
        <p className={stitchReports.heroEyebrow}>{t('expense')}</p>
        <p className={stitchReports.heroSmallAmount}>{formatMoney(expenses)}</p>
      </div>
      {totalSpendable !== undefined ? (
        <div className={stitchReports.heroSmallCard}>
          <p className={stitchReports.heroEyebrow}>{t('spendableBalance')}</p>
          <p className={stitchReports.heroSmallAmount}>{formatMoney(totalSpendable)}</p>
        </div>
      ) : null}
      {totalReserve !== undefined ? (
        <div className={stitchReports.heroSmallCard}>
          <p className={stitchReports.heroEyebrow}>{t('reserveBalance')}</p>
          <p className={stitchReports.heroSmallAmount}>{formatMoney(totalReserve)}</p>
        </div>
      ) : null}
      {netSavings !== undefined ? (
        <div className={`${stitchReports.heroSmallCard} col-span-2`}>
          <p className={stitchReports.heroEyebrow}>{t('savedThisPeriod')}</p>
          <p className={stitchReports.heroSmallAmount}>
            {netSavings.net >= 0 ? '+' : ''}
            {formatMoney(netSavings.net)}
          </p>
        </div>
      ) : null}
    </section>
  );
}
