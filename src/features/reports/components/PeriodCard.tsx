import { formatCurrency } from '@/lib/utils';
import type { ReportPeriodSummary } from '@/server/services/reports.service';
import { reportsStyles } from '@/features/reports/theme/reports-styles';
import { sortAccountMetrics } from '@/features/reports/utils';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface PeriodCardProps {
  period: ReportPeriodSummary;
}

export function PeriodCard({ period }: PeriodCardProps) {
  const t = useTranslations('Reports');
  const globalNet = period.totalEarned - period.totalSpent;

  return (
    <div className={reportsStyles.periods.card}>
      <div className={reportsStyles.periods.cardHeader}>
        <div className={reportsStyles.periods.cardTitleDetails}>
          <div className={reportsStyles.periods.cardTitle}>{period.name}</div>
        </div>
      </div>

      <div className={reportsStyles.periods.cardContent}>
        {/* Global Metrics */}
        <div className={reportsStyles.periods.globalMetrics}>
          <div className={reportsStyles.periods.globalTotalsRow}>
            <div className={reportsStyles.periods.globalMetricIncome}>
              <span
                className={cn(
                  reportsStyles.periods.globalLabel,
                  reportsStyles.periods.globalLabelIncome
                )}
              >
                {t('PeriodCard.incomeLabel')}
              </span>
              <span className={reportsStyles.periods.globalValueIncome}>
                +{formatCurrency(period.totalEarned)}
              </span>
            </div>
            <div className={reportsStyles.periods.globalMetricExpense}>
              <span
                className={cn(
                  reportsStyles.periods.globalLabel,
                  reportsStyles.periods.globalLabelExpense
                )}
              >
                {t('PeriodCard.expensesLabel')}
              </span>
              <span className={reportsStyles.periods.globalValueExpense}>
                -{formatCurrency(period.totalSpent)}
              </span>
            </div>
            <div className={reportsStyles.periods.globalMetricNet}>
              <span
                className={cn(
                  reportsStyles.periods.globalLabel,
                  reportsStyles.periods.globalLabelNet
                )}
              >
                {t('PeriodCard.netSavingsLabel')}
              </span>
              <span className={reportsStyles.periods.globalValueNet}>
                {globalNet > 0 ? '+' : ''}
                {formatCurrency(globalNet)}
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className={reportsStyles.periods.breakdownContainer}>
          <h4 className={reportsStyles.periods.breakdownTitle}>
            {t('PeriodCard.byAccountTypeTitle')}
          </h4>
          <div className={reportsStyles.periods.breakdownList}>
            {sortAccountMetrics(Object.entries(period.metricsByAccountType)).map(
              ([type, metrics]) => {
                const net = metrics.endBalance - metrics.startBalance;
                const isPositive = net > 0;
                const isNegative = net < 0;

                return (
                  <article key={type} className={reportsStyles.periods.breakdownItem}>
                    <div className={reportsStyles.periods.breakdownHeader}>
                      <div className={reportsStyles.periods.breakdownType}>
                        <div className={`${reportsStyles.periods.breakdownDot} bg-primary`}></div>
                        <span className="capitalize">{type}</span>
                      </div>
                    </div>

                    <div className={reportsStyles.periods.breakdownStats}>
                      <div className={cn(reportsStyles.periods.breakdownStat, 'min-h-13')}>
                        <div className={reportsStyles.periods.breakdownStatRow}>
                          <p className={reportsStyles.periods.breakdownMetricLabel}>
                            {t('PeriodCard.balanceLabel')}
                          </p>
                          <div className={reportsStyles.periods.breakdownBalanceStack}>
                            <span className={reportsStyles.periods.breakdownAmount}>
                              {formatCurrency(metrics.startBalance)}
                            </span>
                            <span className={reportsStyles.periods.breakdownBalanceArrow}>↓</span>
                            <span className={reportsStyles.periods.breakdownAmount}>
                              {formatCurrency(metrics.endBalance)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={reportsStyles.periods.breakdownStat}>
                        <div className={reportsStyles.periods.breakdownStatRow}>
                          <p className={reportsStyles.periods.breakdownMetricLabel}>
                            {t('PeriodCard.incomeLabel')}
                          </p>
                          <span
                            className={cn(
                              reportsStyles.periods.breakdownIn,
                              metrics.earned === 0 && 'opacity-50'
                            )}
                          >
                            +{formatCurrency(metrics.earned)}
                          </span>
                        </div>
                      </div>

                      <div className={reportsStyles.periods.breakdownStat}>
                        <div className={reportsStyles.periods.breakdownStatRow}>
                          <p className={reportsStyles.periods.breakdownMetricLabel}>
                            {t('PeriodCard.expensesLabel')}
                          </p>
                          <span
                            className={cn(
                              reportsStyles.periods.breakdownOut,
                              metrics.spent === 0 && 'opacity-50'
                            )}
                          >
                            -{formatCurrency(metrics.spent)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={reportsStyles.periods.breakdownNetRow}>
                      <div className={`${reportsStyles.periods.breakdownStat} w-full`}>
                        <div className={reportsStyles.periods.breakdownStatRow}>
                          <p className={reportsStyles.periods.breakdownMetricLabel}>
                            {t('PeriodCard.netLabel')}
                          </p>
                          <span
                            className={cn(
                              reportsStyles.periods.breakdownAmount,
                              isPositive && reportsStyles.periods.breakdownIn,
                              isNegative && reportsStyles.periods.breakdownOut,
                              net === 0 && 'opacity-50'
                            )}
                          >
                            {net > 0 ? '+' : ''}
                            {formatCurrency(net)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
