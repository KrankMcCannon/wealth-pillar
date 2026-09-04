'use client';

import { ChevronRight, Home, UtensilsCrossed, Car, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import { roundMoney } from '@/lib/utils/money';
import { stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';
import type { ReportsTopExpenseRow } from '@/server/use-cases/reports/report.logic';

export type TopExpenseRow = ReportsTopExpenseRow;

interface TopExpensesRankingProps {
  items: TopExpenseRow[];
  periodExpenses: number;
  hrefForCategory?: (categoryKey: string) => string;
}

function iconForName(name: string) {
  const n = name.toLowerCase();
  if (n.includes('housing') || n.includes('casa') || n.includes('affitto')) return Home;
  if (n.includes('food') || n.includes('cibo') || n.includes('ristor')) return UtensilsCrossed;
  if (n.includes('transport') || n.includes('trasport') || n.includes('auto')) return Car;
  return Tag;
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
  const Icon = iconForName(row.name);
  const pct = spendSharePercent(row.total, periodExpenses);

  return (
    <>
      <div className={stitchReports.rankingRowHeader}>
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={stitchReports.rankingIconWrap}
            style={{ backgroundColor: row.color, color: 'var(--color-primary-foreground)' }}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <span className={cn(stitchReports.rankingLabel, 'truncate')}>{row.name}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className={stitchReports.rankingAmount}>{formatMoney(row.total)}</span>
          {showChevron ? (
            <ChevronRight className={stitchReports.rankingChevron} aria-hidden />
          ) : null}
        </div>
      </div>
      <div className={stitchReports.progressTrack}>
        <div
          className={cn('h-full min-h-[6px] rounded-full', stitchReports.progressFillMuted)}
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: row.color }}
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
  const remainder = roundMoney(periodExpenses - items.reduce((sum, row) => sum + row.total, 0));
  const showEmpty = items.length === 0 || periodExpenses <= 0;
  const showOther = !showEmpty && remainder > 0;

  if (showEmpty) {
    return (
      <section aria-labelledby="reports-top-expenses-heading">
        <h3 id="reports-top-expenses-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
          {t('title')}
        </h3>
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-top-expenses-heading">
      <h3 id="reports-top-expenses-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
        {t('title')}
      </h3>
      <div className={cn(stitchReports.rankingCard, 'space-y-4')}>
        {items.map((row) => {
          const href = hrefForCategory?.(row.key);
          const percentLabel = t('percentOfExpenses', {
            percent: spendSharePercent(row.total, periodExpenses),
          });
          if (href) {
            return (
              <Link key={row.id} href={href} className={stitchReports.rankingRowLink}>
                <RankingRowBody
                  row={row}
                  periodExpenses={periodExpenses}
                  formatMoney={formatMoney}
                  percentLabel={percentLabel}
                  showChevron
                />
              </Link>
            );
          }
          return (
            <div key={row.id} className={stitchReports.rankingRow}>
              <RankingRowBody
                row={row}
                periodExpenses={periodExpenses}
                formatMoney={formatMoney}
                percentLabel={percentLabel}
                showChevron={false}
              />
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
                total: remainder,
                color: 'oklch(var(--color-muted-foreground))',
              }}
              periodExpenses={periodExpenses}
              formatMoney={formatMoney}
              percentLabel={t('percentOfExpenses', {
                percent: spendSharePercent(remainder, periodExpenses),
              })}
              showChevron={false}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
