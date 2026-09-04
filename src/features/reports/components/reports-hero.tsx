'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports, stitchStatMini } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';

interface ReportsHeroProps {
  netFlow: number;
  income: number;
  expenses: number;
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
  const savings = netSavings ?? { deposits: 0, withdrawals: 0, net: 0 };

  return (
    <section aria-labelledby="reports-hero-heading" className="flex flex-col gap-2">
      <h2 id="reports-hero-heading" className="sr-only">
        {t('srHeading')}
      </h2>
      <div className={stitchReports.heroNetCard}>
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
        <div className={stitchReports.kpiPair}>
          <div className={cn(stitchStatMini.item, stitchStatMini.itemSuccess)}>
            <p className={stitchStatMini.label}>{t('incomeThisPeriod')}</p>
            <p className={stitchStatMini.valueSuccess}>{formatMoney(income)}</p>
          </div>
          <div className={cn(stitchStatMini.item, stitchStatMini.itemDestructive)}>
            <p className={stitchStatMini.label}>{t('expenseThisPeriod')}</p>
            <p className={stitchStatMini.valueDestructive}>{formatMoney(expenses)}</p>
          </div>
        </div>
      </div>
      <div>
        <p className={cn(stitchReports.heroEyebrow, 'mb-2')}>{t('movedToSavings')}</p>
        <div className={stitchReports.savingsGrid}>
          <div className={stitchReports.heroSmallCard}>
            <p className={stitchReports.heroEyebrow}>{t('deposits')}</p>
            <p className={stitchReports.heroSmallAmount}>{formatMoney(savings.deposits)}</p>
          </div>
          <div className={stitchReports.heroSmallCard}>
            <p className={stitchReports.heroEyebrow}>{t('withdrawals')}</p>
            <p className={stitchReports.heroSmallAmount}>{formatMoney(savings.withdrawals)}</p>
          </div>
          <div className={stitchReports.heroSmallCard}>
            <p className={stitchReports.heroEyebrow}>{t('movedToSavingsNet')}</p>
            <p className={stitchReports.heroSmallAmount}>
              {savings.net >= 0 ? '+' : ''}
              {formatMoney(savings.net)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
