'use client';

import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchReports } from '@/styles/home-design-foundation';
import { BudgetPeriodCard } from './budget-period-card';

interface BudgetPeriodSectionProps {
  periods: ReportPeriodSummary[];
}

export function BudgetPeriodSection({ periods }: BudgetPeriodSectionProps) {
  const t = useTranslations('Reports.BudgetPeriods');

  if (periods.length === 0) {
    return (
      <section aria-labelledby="reports-budget-periods-heading">
        <h3 id="reports-budget-periods-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
          {t('title')}
        </h3>
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      </section>
    );
  }

  return (
    <section aria-labelledby="reports-budget-periods-heading">
      <h3 id="reports-budget-periods-heading" className={cn(stitchReports.sectionTitle, 'mb-3')}>
        {t('title')}
      </h3>
      <div className="flex flex-col gap-2">
        {periods.map((p) => (
          <BudgetPeriodCard key={p.id} period={p} />
        ))}
      </div>
    </section>
  );
}
