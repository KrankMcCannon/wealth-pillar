import { formatCurrency } from '@/lib/utils';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { sortAccountMetrics } from '@/features/reports/utils';
import { useTranslations } from 'next-intl';

interface PeriodCardProps {
  period: ReportPeriodSummary;
}

// Classi Tailwind per i tipi di conto — senza colori hardcoded
const accountTypeClasses: Record<string, { dot: string }> = {
  payroll: { dot: 'bg-success' },
  cash: { dot: 'bg-primary' },
  savings: { dot: 'bg-warning' },
};

const defaultAccountTypeClass = { dot: 'bg-muted-foreground' };

const knownAccountTypes = ['payroll', 'cash', 'savings'] as const;
type KnownAccountType = (typeof knownAccountTypes)[number];

export function PeriodCard({ period }: PeriodCardProps) {
  const t = useTranslations('Reports.PeriodCard');
  const tCharts = useTranslations('Reports.Charts');

  const accountTypeLabels: Record<KnownAccountType, string> = {
    payroll: tCharts('accountTypes.payroll'),
    cash: tCharts('accountTypes.cash'),
    savings: tCharts('accountTypes.savings'),
  };

  const getAccountLabel = (type: string): string =>
    accountTypeLabels[type as KnownAccountType] ??
    type.charAt(0).toUpperCase() + type.slice(1);

  const sortedEntries = sortAccountMetrics(Object.entries(period.metricsByAccountType));
  const netSavings = period.totalEarned - period.totalSpent;

  return (
    <article className="bg-card border border-primary/15 rounded-xl overflow-hidden hover:border-primary/25 hover:bg-primary/2 transition-colors duration-200">
      {/* Header */}
      <div className="p-3 sm:p-4 flex items-center justify-between border-b border-primary/10 bg-primary/2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base text-primary truncate">
            {period.name}
          </h3>
        </div>
      </div>

      {/* Contenuto */}
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Totali globali: Entrate / Uscite / Netto */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-success/5 border border-success/15">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-success/70">
              {t('incomeLabel')}
            </span>
            <span className="text-sm sm:text-base font-bold text-success tabular-nums">
              {formatCurrency(period.totalEarned)}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-destructive/5 border border-destructive/15">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-destructive/70">
              {t('expensesLabel')}
            </span>
            <span className="text-sm sm:text-base font-bold text-destructive tabular-nums">
              {formatCurrency(period.totalSpent)}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 sm:p-3 rounded-xl bg-primary/5 border border-primary/15">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-primary/70">
              {t('netSavingsLabel')}
            </span>
            <span
              className={`text-sm sm:text-base font-bold tabular-nums ${
                netSavings >= 0 ? 'text-success' : 'text-destructive'
              }`}
            >
              {formatCurrency(netSavings)}
            </span>
          </div>
        </div>

        {/* Breakdown per tipo di conto */}
        {sortedEntries.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('byAccountTypeTitle')}
            </h4>
            <div className="space-y-2">
              {sortedEntries.map(([type, metrics]) => {
                const net = metrics.earned - metrics.spent;
                const colorClass = accountTypeClasses[type] ?? defaultAccountTypeClass;
                return (
                  <div
                    key={type}
                    className="rounded-xl p-2 sm:p-3 border border-primary/8 bg-primary/2 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${colorClass.dot}`} />
                      <span className="text-xs sm:text-sm font-medium text-primary">
                        {getAccountLabel(type)}
                      </span>
                    </div>

                    {/* Saldo iniziale → finale */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-primary/3">
                      <span className="block text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground tracking-wide leading-none">
                        {t('balanceLabel')}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                          {formatCurrency(metrics.startBalance)}
                        </span>
                        <span className="text-[10px] text-muted-foreground" aria-hidden>
                          →
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-primary tabular-nums">
                          {formatCurrency(metrics.endBalance)}
                        </span>
                      </div>
                    </div>

                    {/* In / Out */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 sm:p-2.5 rounded-lg bg-primary/3">
                        <span className="block text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground tracking-wide leading-none">
                          {t('inLabel')}
                        </span>
                        <div className="mt-1.5 text-xs sm:text-sm font-bold text-success tabular-nums">
                          +{formatCurrency(metrics.earned)}
                        </div>
                      </div>
                      <div className="p-2 sm:p-2.5 rounded-lg bg-primary/3">
                        <span className="block text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground tracking-wide leading-none">
                          {t('outLabel')}
                        </span>
                        <div className="mt-1.5 text-xs sm:text-sm font-bold text-destructive tabular-nums">
                          -{formatCurrency(metrics.spent)}
                        </div>
                      </div>
                    </div>

                    {/* Netto */}
                    <div className="p-2 sm:p-2.5 rounded-lg bg-primary/3 border-t border-primary/8">
                      <span className="block text-[9px] sm:text-[10px] uppercase font-semibold text-muted-foreground tracking-wide leading-none">
                        {t('netLabel')}
                      </span>
                      <div
                        className={`mt-1.5 text-xs sm:text-sm font-bold tabular-nums ${
                          net >= 0 ? 'text-success' : 'text-destructive'
                        }`}
                      >
                        {formatCurrency(net)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
