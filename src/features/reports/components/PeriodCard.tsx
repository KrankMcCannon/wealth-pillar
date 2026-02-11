import { formatCurrency } from '@/lib/utils';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { sortAccountMetrics } from '@/features/reports/utils';
import { useTranslations } from 'next-intl';

interface PeriodCardProps {
  period: ReportPeriodSummary;
}

export function PeriodCard({ period }: PeriodCardProps) {
  const t = useTranslations('Reports.PeriodCard');

  const sortedEntries = sortAccountMetrics(Object.entries(period.metricsByAccountType));

  const netSavings = period.totalEarned - period.totalSpent;

  return (
    <div className={reportsStyles.periods.card}>
      {/* Header */}
      <div className={reportsStyles.periods.cardHeader}>
        <div className={reportsStyles.periods.cardTitleDetails}>
          <h4 className={reportsStyles.periods.cardTitle}>{period.name}</h4>
        </div>
      </div>

      {/* Content */}
      <div className={reportsStyles.periods.cardContent}>
        {/* Global Metrics Row (Income / Expenses / Net) */}
        <div className={reportsStyles.periods.globalMetrics}>
          <div className={reportsStyles.periods.globalTotalsRow}>
            <div className={reportsStyles.periods.globalMetricIncome}>
              <span
                className={`${reportsStyles.periods.globalLabel} ${reportsStyles.periods.globalLabelIncome}`}
              >
                {t('incomeLabel')}
              </span>
              <span className={reportsStyles.periods.globalValueIncome}>
                {formatCurrency(period.totalEarned)}
              </span>
            </div>
            <div className={reportsStyles.periods.globalMetricExpense}>
              <span
                className={`${reportsStyles.periods.globalLabel} ${reportsStyles.periods.globalLabelExpense}`}
              >
                {t('expensesLabel')}
              </span>
              <span className={reportsStyles.periods.globalValueExpense}>
                {formatCurrency(period.totalSpent)}
              </span>
            </div>
            <div className={reportsStyles.periods.globalMetricNet}>
              <span
                className={`${reportsStyles.periods.globalLabel} ${reportsStyles.periods.globalLabelNet}`}
              >
                {t('netSavingsLabel')}
              </span>
              <span
                className={`${reportsStyles.periods.globalValueNet} ${netSavings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
              >
                {formatCurrency(netSavings)}
              </span>
            </div>
          </div>
        </div>

        {/* Account Type Breakdown */}
        {sortedEntries.length > 0 && (
          <div className={reportsStyles.periods.breakdownContainer}>
            <h5 className={reportsStyles.periods.breakdownTitle}>{t('byAccountTypeTitle')}</h5>
            <div className={reportsStyles.periods.breakdownList}>
              {sortedEntries.map(([type, metrics]) => {
                const net = metrics.earned - metrics.spent;
                return (
                  <div key={type} className={reportsStyles.periods.breakdownItem}>
                    <div className={reportsStyles.periods.breakdownHeader}>
                      <div className={reportsStyles.periods.breakdownType}>
                        <div
                          className={reportsStyles.periods.breakdownDot}
                          style={{
                            backgroundColor:
                              type === 'payroll'
                                ? '#10b981'
                                : type === 'cash'
                                  ? '#6366f1'
                                  : type === 'savings'
                                    ? '#f59e0b'
                                    : '#94a3b8',
                          }}
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </div>
                    </div>

                    {/* Stacked rows instead of cramped 3-col grid */}
                    <div className="space-y-2">
                      {/* Balance Row */}
                      <div className={reportsStyles.periods.breakdownStat}>
                        <span className={reportsStyles.periods.breakdownMetricLabel}>
                          {t('balanceLabel')}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={reportsStyles.periods.breakdownAmount}>
                            {formatCurrency(metrics.startBalance)}
                          </span>
                          <span className={reportsStyles.periods.breakdownBalanceArrow}>→</span>
                          <span className={reportsStyles.periods.breakdownAmount}>
                            {formatCurrency(metrics.endBalance)}
                          </span>
                        </div>
                      </div>

                      {/* In / Out row */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className={reportsStyles.periods.breakdownStat}>
                          <span className={reportsStyles.periods.breakdownMetricLabel}>In</span>
                          <span className={reportsStyles.periods.breakdownIn}>
                            +{formatCurrency(metrics.earned)}
                          </span>
                        </div>
                        <div className={reportsStyles.periods.breakdownStat}>
                          <span className={reportsStyles.periods.breakdownMetricLabel}>Out</span>
                          <span className={reportsStyles.periods.breakdownOut}>
                            -{formatCurrency(metrics.spent)}
                          </span>
                        </div>
                      </div>

                      {/* Net row */}
                      <div
                        className={`${reportsStyles.periods.breakdownStat} ${reportsStyles.periods.breakdownNetRow}`}
                      >
                        <span className={reportsStyles.periods.breakdownMetricLabel}>
                          {t('netLabel')}
                        </span>
                        <span
                          className={`${reportsStyles.periods.breakdownAmount} ${net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                        >
                          {formatCurrency(net)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
