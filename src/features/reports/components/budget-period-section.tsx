'use client';

import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchHome, stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

interface BudgetPeriodSectionProps {
  periods: ReportPeriodSummary[];
}

export function BudgetPeriodSection({ periods }: BudgetPeriodSectionProps) {
  const t = useTranslations('Reports.BudgetPeriods');
  const { format: formatMoney } = useFormatCurrency();

  return (
    <section aria-labelledby="reports-budget-periods-heading" className={stitchHome.scanSection}>
      <h3 id="reports-budget-periods-heading" className={stitchHome.scanSectionTitle}>
        {t('title')}
      </h3>
      {periods.length === 0 ? (
        <div className={stitchReports.emptyWell}>{t('empty')}</div>
      ) : (
        <ul className={stitchHome.plainList}>
          {periods.map((period) => {
            const delta = period.spendable.endBalance - period.spendable.startBalance;
            const positive = delta >= 0;
            return (
              <li key={period.id} className={stitchHome.plainRow}>
                <span className="min-w-0">
                  <h4 className={stitchHome.plainRowTitle}>{period.name}</h4>
                  <span className={stitchHome.plainRowMeta}>
                    {formatMoney(period.spendable.startBalance)}
                    {' → '}
                    {formatMoney(period.spendable.endBalance)}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 text-base font-semibold tabular-nums',
                    positive ? 'text-income' : 'text-expense'
                  )}
                >
                  {positive ? '+' : ''}
                  {formatMoney(delta)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
