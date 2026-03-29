'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { sortAccountMetrics } from '@/features/reports/utils';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

interface PeriodCardProps {
  period: ReportPeriodSummary;
}

const accountTypeClasses: Record<string, { dot: string }> = {
  payroll: { dot: 'bg-success' },
  cash: { dot: 'bg-primary' },
  savings: { dot: 'bg-warning' },
};

const defaultAccountTypeClass = { dot: 'bg-muted-foreground' };

type KnownAccountType = 'payroll' | 'cash' | 'savings';

export function PeriodCard({ period }: PeriodCardProps) {
  const t = useTranslations('Reports.PeriodCard');
  const tCharts = useTranslations('Reports.Charts');
  const [isExpanded, setIsExpanded] = useState(false);

  const accountTypeLabels: Record<KnownAccountType, string> = {
    payroll: tCharts('accountTypes.payroll'),
    cash: tCharts('accountTypes.cash'),
    savings: tCharts('accountTypes.savings'),
  };

  const getAccountLabel = (type: string): string =>
    accountTypeLabels[type as KnownAccountType] ?? type.charAt(0).toUpperCase() + type.slice(1);

  const sortedEntries = sortAccountMetrics(Object.entries(period.metricsByAccountType));
  const netSavings = period.totalEarned - period.totalSpent;
  const hasBreakdown = sortedEntries.length > 0;
  const breakdownPanelId = `period-breakdown-${period.id}`;

  return (
    <article className="bg-card border border-primary/15 rounded-xl overflow-hidden hover:border-primary/25 transition-colors duration-200">
      {/* Header */}
      <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-primary/8 bg-primary/2">
        <h3 className="font-semibold text-sm sm:text-base text-primary truncate">{period.name}</h3>
      </div>

      {/* Totali globali */}
      <div className="grid grid-cols-3 divide-x divide-primary/8 border-b border-primary/8">
        <div className="flex flex-col items-center px-3 py-3 sm:py-4">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-success/70 mb-1.5">
            {t('incomeLabel')}
          </span>
          <span className="text-sm sm:text-base font-bold text-success tabular-nums leading-none">
            {formatCurrency(period.totalEarned)}
          </span>
        </div>
        <div className="flex flex-col items-center px-3 py-3 sm:py-4">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-destructive/70 mb-1.5">
            {t('expensesLabel')}
          </span>
          <span className="text-sm sm:text-base font-bold text-destructive tabular-nums leading-none">
            {formatCurrency(period.totalSpent)}
          </span>
        </div>
        <div className="flex flex-col items-center px-3 py-3 sm:py-4">
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
            {t('netSavingsLabel')}
          </span>
          <span
            className={`text-sm sm:text-base font-bold tabular-nums leading-none ${
              netSavings >= 0 ? 'text-success' : 'text-destructive'
            }`}
          >
            {formatCurrency(netSavings)}
          </span>
        </div>
      </div>

      {/* Toggle dettaglio per conto */}
      {hasBreakdown && (
        <>
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 sm:px-5 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/3 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-expanded={isExpanded}
            aria-controls={breakdownPanelId}
          >
            <span>{isExpanded ? t('hideDetails') : t('showDetails')}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            />
          </button>

          {isExpanded && (
            <div
              id={breakdownPanelId}
              className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-primary/8 pt-3 sm:pt-4"
            >
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                {t('byAccountTypeTitle')}
              </h4>
              <div className="divide-y divide-primary/8">
                {sortedEntries.map(([type, metrics]) => {
                  const net = metrics.earned - metrics.spent;
                  const colorClass = accountTypeClasses[type] ?? defaultAccountTypeClass;
                  return (
                    <div key={type} className="py-3 first:pt-0 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${colorClass.dot}`} />
                        <span className="text-xs sm:text-sm font-medium text-primary">
                          {getAccountLabel(type)}
                        </span>
                      </div>
                      <p className="text-xs text-primary">
                        <span className="text-muted-foreground font-medium uppercase tracking-wide text-[9px] sm:text-[10px]">
                          {t('balanceLabel')}
                        </span>{' '}
                        <span className="font-bold tabular-nums">
                          {formatCurrency(metrics.startBalance)}
                        </span>
                        <span className="text-muted-foreground mx-1" aria-hidden>
                          →
                        </span>
                        <span className="font-bold tabular-nums">
                          {formatCurrency(metrics.endBalance)}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm">
                        <span className="tabular-nums">
                          <span className="text-muted-foreground">{t('inLabel')}:</span>{' '}
                          <span className="font-bold text-success">
                            +{formatCurrency(metrics.earned)}
                          </span>
                        </span>
                        <span className="tabular-nums">
                          <span className="text-muted-foreground">{t('outLabel')}:</span>{' '}
                          <span className="font-bold text-destructive">
                            -{formatCurrency(metrics.spent)}
                          </span>
                        </span>
                      </div>
                      <p
                        className={`text-xs sm:text-sm font-bold tabular-nums ${
                          net >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {t('netLabel')}: {formatCurrency(net)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </article>
  );
}
