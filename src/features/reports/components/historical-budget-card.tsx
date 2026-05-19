'use client';

import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

export function derivePeriodOnTrack(period: ReportPeriodSummary): boolean {
  return period.endBalance >= period.startBalance;
}

interface HistoricalBudgetCardProps {
  period: ReportPeriodSummary;
}

export function HistoricalBudgetCard({ period }: HistoricalBudgetCardProps) {
  const t = useTranslations('Reports.HistoricalBudget');
  const { format: formatMoney } = useFormatCurrency();
  const onTrack = derivePeriodOnTrack(period);

  return (
    <article className={stitchReports.historyCard}>
      <div className={stitchReports.historyHeaderRow}>
        <p className={stitchReports.historyMonthLabel}>{period.name}</p>
        <span className={onTrack ? stitchBudgets.badgeOnTrack : stitchBudgets.badgeOver}>
          {onTrack ? t('badgeOnTrack') : t('badgeOverBudget')}
        </span>
      </div>
      <div className={stitchReports.historyMetricsRow}>
        <div>
          <p className={stitchReports.historyMetricLabel}>{t('startingBalance')}</p>
          <p className={stitchReports.historyMetricValue}>{formatMoney(period.startBalance)}</p>
        </div>
        <div className="text-right">
          <p className={stitchReports.historyMetricLabel}>{t('closingBalance')}</p>
          <p className={stitchReports.historyMetricValue}>{formatMoney(period.endBalance)}</p>
        </div>
      </div>
    </article>
  );
}
