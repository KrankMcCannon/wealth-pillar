'use client';

import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { roundMoney } from '@/lib/utils/money';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { getBudgetProgressbarProps } from '@/features/budgets/components/budget-progress-bar';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { ReportsTopExpenseRow } from '@/server/use-cases/reports/report.logic';

export type TopExpenseRow = ReportsTopExpenseRow;

/** Named rows on mobile; the rest folds into Other. Server still returns the full top 8. */
const RANKING_VISIBLE = 5;

interface TopExpensesRankingProps {
  items: TopExpenseRow[];
  periodExpenses: number;
  hrefForCategory?: (categoryKey: string) => string;
}

function spendSharePercent(total: number, periodExpenses: number): number {
  if (periodExpenses <= 0) return 0;
  return Math.round((total / periodExpenses) * 100);
}

function RankingRowBody({
  row,
  periodExpenses,
  formatMoney,
  percentLabel,
  showChevron,
}: {
  row: TopExpenseRow;
  periodExpenses: number;
  formatMoney: (n: number) => string;
  percentLabel: string;
  showChevron: boolean;
}) {
  const pct = spendSharePercent(row.total, periodExpenses);
  const barLabel = `${row.name}, ${percentLabel}`;

  return (
    <>
      <div className={stitchReports.rankingRowHeader}>
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              'size-2.5 shrink-0 rounded-full',
              row.key === 'other' ? 'bg-muted-foreground' : 'bg-primary'
            )}
            style={row.key !== 'other' && row.color ? { backgroundColor: row.color } : undefined}
            aria-hidden
          />
          <span className={cn(stitchReports.rankingLabel, 'truncate')}>{row.name}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <span className={cn(stitchReports.rankingAmount, 'text-expense')}>
            {formatMoney(row.total)}
          </span>
          {showChevron ? (
            <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
          ) : null}
        </span>
      </div>
      <div
        className={cn(stitchReports.progressTrack, 'h-2')}
        {...getBudgetProgressbarProps({ percent: pct, label: barLabel })}
      >
        <div
          className={cn('h-full min-h-[8px] rounded-full', stitchReports.progressFillPrimary)}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <p className={stitchReports.rankingMeta}>{percentLabel}</p>
    </>
  );
}

export function TopExpensesRanking({
  items,
  periodExpenses,
  hrefForCategory,
}: TopExpensesRankingProps) {
  const t = useTranslations('Reports.TopExpenses');
  const { format: formatMoney } = useFormatCurrency();
  const visible = items.slice(0, RANKING_VISIBLE);
  const folded = roundMoney(items.slice(RANKING_VISIBLE).reduce((sum, row) => sum + row.total, 0));
  const leftover = roundMoney(periodExpenses - items.reduce((sum, row) => sum + row.total, 0));
  const otherTotal = roundMoney(folded + leftover);
  const showEmpty = items.length === 0 || periodExpenses <= 0;
  const showOther = !showEmpty && otherTotal > 0;

  if (showEmpty) {
    return (
      <section aria-labelledby="reports-top-expenses-heading" className={stitchHome.scanSection}>
        <h3 id="reports-top-expenses-heading" className={stitchHome.scanSectionTitle}>
          {t('title')}
        </h3>
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-top-expenses-heading" className={stitchHome.scanSection}>
      <h3 id="reports-top-expenses-heading" className={stitchHome.scanSectionTitle}>
        {t('title')}
      </h3>
      <div className="flex flex-col">
        {visible.map((row) => {
          const href = hrefForCategory?.(row.key);
          const percent = spendSharePercent(row.total, periodExpenses);
          const percentLabel = t('percentOfExpenses', { percent });
          const body = (
            <RankingRowBody
              row={row}
              periodExpenses={periodExpenses}
              formatMoney={formatMoney}
              percentLabel={percentLabel}
              showChevron={Boolean(href)}
            />
          );
          if (href) {
            return (
              <Link key={row.id} href={href} className={stitchReports.rankingRowLink}>
                {body}
              </Link>
            );
          }
          return (
            <div key={row.id} className={stitchReports.rankingRow}>
              {body}
            </div>
          );
        })}
        {showOther ? (
          <div className={stitchReports.rankingRow} data-testid="reports-other-remainder">
            <RankingRowBody
              row={{
                id: 'other',
                key: 'other',
                name: t('other'),
                total: otherTotal,
                color: '',
              }}
              periodExpenses={periodExpenses}
              formatMoney={formatMoney}
              percentLabel={t('percentOfExpenses', {
                percent: spendSharePercent(otherTotal, periodExpenses),
              })}
              showChevron={false}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
