'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { NetSavingsResult } from '@/server/use-cases/shared/savings.logic';
import { SplitBar } from './split-bar';

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
  const showSavings = savings.deposits !== 0 || savings.withdrawals !== 0;
  const flowTotal = income + expenses;
  const incomeShare = flowTotal > 0 ? (income / flowTotal) * 100 : 0;

  return (
    <section aria-labelledby="reports-hero-heading" className={stitchHome.scanSection}>
      <div className={stitchHome.balanceSection}>
        <h2 id="reports-hero-heading" className={stitchHome.scanSectionTitle}>
          {t('netFlow')}
        </h2>
        <p
          className={cn(
            stitchReports.heroNetAmount,
            positive ? stitchHome.amountIncome : stitchHome.amountExpense
          )}
        >
          {positive ? '+' : ''}
          {formatMoney(netFlow)}
        </p>
        {flowTotal > 0 ? (
          <SplitBar
            leftPercent={incomeShare}
            leftClassName="bg-income"
            rightClassName="bg-expense"
            label={t('splitAria', { income: formatMoney(income), expense: formatMoney(expenses) })}
            valuetext={t('splitAria', {
              income: formatMoney(income),
              expense: formatMoney(expenses),
            })}
          />
        ) : null}
        <p className={stitchReports.kpiPair}>
          <span>
            {t('incomeThisPeriod')}{' '}
            <span className="tabular-nums text-income">{formatMoney(income)}</span>
          </span>
          {' · '}
          <span>
            {t('expenseThisPeriod')}{' '}
            <span className="tabular-nums text-expense">{formatMoney(expenses)}</span>
          </span>
        </p>
        {!omitComparison && pct !== null ? (
          <p
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
          </p>
        ) : null}
        {!omitComparison && pct === null ? (
          <p className="mt-1 text-sm text-muted-foreground">{t('noComparison')}</p>
        ) : null}
      </div>
      {showSavings ? (
        <ul className={stitchHome.plainList}>
          <li>
            <PlainListRow
              title={t('movedToSavings')}
              meta={t('savingsMeta', {
                deposits: formatMoney(savings.deposits),
                withdrawals: formatMoney(savings.withdrawals),
              })}
            >
              <span
                className={cn(
                  'text-base font-semibold tabular-nums',
                  savings.net < 0 ? stitchHome.amountExpense : stitchHome.amountIncome
                )}
              >
                {savings.net >= 0 ? '+' : ''}
                {formatMoney(savings.net)}
              </span>
            </PlainListRow>
          </li>
        </ul>
      ) : null}
    </section>
  );
}
