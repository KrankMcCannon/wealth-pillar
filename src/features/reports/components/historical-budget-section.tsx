'use client';

import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';
import { HistoricalBudgetCard } from './historical-budget-card';

interface HistoricalBudgetSectionProps {
  periods: ReportPeriodSummary[];
}

export function HistoricalBudgetSection({ periods }: HistoricalBudgetSectionProps) {
  const t = useTranslations('Reports.HistoricalBudget');

  if (periods.length === 0) {
    return (
      <section aria-labelledby="reports-history-heading">
        <h3 id="reports-history-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
          {t('title')}
        </h3>
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-history-heading">
      <h3 id="reports-history-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
        {t('title')}
      </h3>
      <div className="flex flex-col gap-2">
        {periods.map((p) => (
          <HistoricalBudgetCard key={p.id} period={p} />
        ))}
      </div>
    </section>
  );
}
