'use client';

import { Home, UtensilsCrossed, Car, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

export interface TopExpenseRow {
  id: string;
  name: string;
  total: number;
}

interface TopExpensesRankingProps {
  items: TopExpenseRow[];
}

function iconForName(name: string) {
  const n = name.toLowerCase();
  if (n.includes('housing') || n.includes('casa') || n.includes('affitto')) return Home;
  if (n.includes('food') || n.includes('cibo') || n.includes('ristor')) return UtensilsCrossed;
  if (n.includes('transport') || n.includes('trasport') || n.includes('auto')) return Car;
  return Tag;
}

export function TopExpensesRanking({ items }: TopExpensesRankingProps) {
  const t = useTranslations('Reports.TopExpenses');
  const { format: formatMoney } = useFormatCurrency();
  const max = items.length ? Math.max(...items.map((i) => i.total), 1) : 1;
  const fills = [
    stitchReports.progressFillPrimary,
    stitchReports.progressFillSecondary,
    stitchReports.progressFillMuted,
  ];

  if (items.length === 0) {
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
        {items.map((row, idx) => {
          const Icon = iconForName(row.name);
          const pct = Math.round((row.total / max) * 100);
          return (
            <div key={row.id} className={stitchReports.rankingRow}>
              <div className={stitchReports.rankingRowHeader}>
                <div className="flex min-w-0 items-center gap-2">
                  <div className={stitchReports.rankingIconWrap}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <span className={cn(stitchReports.rankingLabel, 'truncate')}>{row.name}</span>
                </div>
                <span className={stitchReports.rankingAmount}>{formatMoney(row.total)}</span>
              </div>
              <div className={stitchReports.progressTrack}>
                <div
                  className={cn('h-full min-h-[6px] rounded-full', fills[idx % fills.length])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
