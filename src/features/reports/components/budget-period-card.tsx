'use client';

import type { ReportPeriodSummary } from '@/server/use-cases/reports/reports.use-cases';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { stitchBudgets } from '@/styles/home-design-foundation';
import { stitchReports } from '@/styles/home-design-foundation';
import { useFormatCurrency } from '@/features/reports/hooks/use-format-currency';

export function derivePeriodOnTrack(period: ReportPeriodSummary): boolean {
  return period.spendable.endBalance >= period.spendable.startBalance;
}

interface BudgetPeriodCardProps {
  period: ReportPeriodSummary;
}

function LiquidityRow({
  label,
  initial,
  final: finalBalance,
  formatMoney,
  initialLabel,
  finalLabel,
}: {
  label: string;
  initial: number;
  final: number;
  formatMoney: (n: number) => string;
  initialLabel: string;
  finalLabel: string;
}) {
  const delta = finalBalance - initial;
  const deltaPositive = delta >= 0;

  return (
    <div className="flex flex-col gap-2 border-t border-border/20 pt-2 first:border-t-0 first:pt-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={stitchReports.periodMetricLabel}>{initialLabel}</p>
          <p className={stitchReports.periodMetricValue}>{formatMoney(initial)}</p>
        </div>
        <div className="text-right">
          <p className={stitchReports.periodMetricLabel}>{finalLabel}</p>
          <p className={stitchReports.periodMetricValue}>{formatMoney(finalBalance)}</p>
        </div>
      </div>
      <p
        className={cn(
          'text-[12px] font-medium tabular-nums',
          deltaPositive ? 'text-teal-accent' : 'text-expense'
        )}
      >
        {deltaPositive ? '+' : ''}
        {formatMoney(delta)}
      </p>
    </div>
  );
}

export function BudgetPeriodCard({ period }: BudgetPeriodCardProps) {
  const t = useTranslations('Reports.BudgetPeriods');
  const { format: formatMoney } = useFormatCurrency();
  const onTrack = derivePeriodOnTrack(period);

  return (
    <article className={stitchReports.periodCard}>
      <div className={stitchReports.periodHeaderRow}>
        <p className={stitchReports.periodRangeLabel}>{period.name}</p>
        <span className={onTrack ? stitchBudgets.badgeOnTrack : stitchBudgets.badgeOver}>
          {onTrack ? t('badgeOnTrack') : t('badgeOverBudget')}
        </span>
      </div>
      <LiquidityRow
        label={t('spendable')}
        initial={period.spendable.startBalance}
        final={period.spendable.endBalance}
        formatMoney={formatMoney}
        initialLabel={t('initial')}
        finalLabel={t('final')}
      />
      <LiquidityRow
        label={t('reserve')}
        initial={period.reserve.startBalance}
        final={period.reserve.endBalance}
        formatMoney={formatMoney}
        initialLabel={t('initial')}
        finalLabel={t('final')}
      />
    </article>
  );
}
