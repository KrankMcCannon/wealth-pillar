import { formatCurrency } from '@/lib/utils';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { sortAccountMetrics } from '@/features/reports/utils';
import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

interface PeriodCardProps {
  period: ReportPeriodSummary;
}

export function PeriodCard({ period }: PeriodCardProps) {
  const globalNet = period.totalEarned - period.totalSpent;

  return (
    <div className={reportsStyles.periods.card}>
      <div className={reportsStyles.periods.cardHeader}>
        <div className={reportsStyles.periods.cardTitleDetails}>
          <div className={reportsStyles.periods.cardTitle}>{period.name}</div>
        </div>

        <div className={reportsStyles.periods.cardHeaderMetrics}></div>
      </div>

      <div className={reportsStyles.periods.cardContent}>
        {/* Global Metrics */}
        <div className={reportsStyles.periods.globalMetrics}>
          <div className={reportsStyles.periods.globalMetricIncome}>
            <span className={reportsStyles.periods.globalLabel}>Income</span>
            <span className={reportsStyles.periods.globalValueIncome}>
              +{formatCurrency(period.totalEarned)}
            </span>
          </div>
          <div className={reportsStyles.periods.globalMetricExpense}>
            <span className={reportsStyles.periods.globalLabel}>Expenses</span>
            <span className={reportsStyles.periods.globalValueExpense}>
              -{formatCurrency(period.totalSpent)}
            </span>
          </div>
          <div className={reportsStyles.periods.globalMetricNet}>
            <span className={reportsStyles.periods.globalLabel}>Net Savings</span>
            <span className={reportsStyles.periods.globalValueNet}>
              {formatCurrency(globalNet)}
            </span>
          </div>
        </div>

        {/* Breakdown */}
        <div className={reportsStyles.periods.breakdownContainer}>
          <h4 className={reportsStyles.periods.breakdownTitle}>By Account Type</h4>
          <div className={reportsStyles.periods.breakdownList}>
            {sortAccountMetrics(Object.entries(period.metricsByAccountType)).map(
              ([type, metrics]) => {
                const net = metrics.endBalance - metrics.startBalance;
                const isPositive = net > 0;
                const isNegative = net < 0;

                return (
                  <div key={type} className={reportsStyles.periods.breakdownItem}>
                    <div className={reportsStyles.periods.breakdownType}>
                      <div className={`${reportsStyles.periods.breakdownDot} bg-primary`}></div>
                      <span className="capitalize">{type}</span>
                    </div>

                    <div className={reportsStyles.periods.breakdownBalance}>
                      <span>{formatCurrency(metrics.startBalance)}</span>
                      <span className="text-[8px] text-primary/50">↓</span>
                      <span>{formatCurrency(metrics.endBalance)}</span>
                    </div>

                    {/* Flows for Mobile */}
                    <div className={reportsStyles.periods.breakdownFlows}>
                      <div className="flex items-center gap-1">
                        <ArrowUpCircle
                          className={`w-3 h-3 ${metrics.earned > 0 ? 'text-emerald-500/70' : 'text-emerald-500/30'}`}
                        />
                        <span
                          className={`${reportsStyles.periods.breakdownIn} ${metrics.earned === 0 ? 'opacity-50' : ''}`}
                        >
                          {formatCurrency(metrics.earned)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <ArrowDownCircle
                          className={`w-3 h-3 ${metrics.spent > 0 ? 'text-red-500/70' : 'text-red-500/30'}`}
                        />
                        <span
                          className={`${reportsStyles.periods.breakdownOut} ${metrics.spent === 0 ? 'opacity-50' : ''}`}
                        >
                          {formatCurrency(metrics.spent)}
                        </span>
                      </div>
                    </div>

                    {/* Net Badge */}
                    <div
                      className={`
                      ${reportsStyles.periods.breakdownNetBadge}
                      ${isPositive ? reportsStyles.periods.breakdownNetPositive : ''}
                      ${isNegative ? reportsStyles.periods.breakdownNetNegative : ''}
                      ${net === 0 ? reportsStyles.periods.breakdownNetNeutral : ''}
                    `}
                    >
                      {net > 0 ? '+' : ''}
                      {formatCurrency(net)}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
