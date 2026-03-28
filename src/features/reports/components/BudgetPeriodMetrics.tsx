'use client';

import { cn } from '@/lib/utils';
import { PiggyBank, Wallet, ArrowLeftRight } from 'lucide-react';
import { Amount } from '@/components/ui/primitives';
import { reportsStyles } from '@/styles/system';
import { useTranslations } from 'next-intl';

interface BudgetPeriodMetricsProps {
  defaultAccountStartBalance?: number | null | undefined;
  defaultAccountEndBalance?: number | null | undefined;
  periodTotalIncome?: number | undefined;
  periodTotalSpent?: number | undefined;
  periodTotalTransfers?: number | undefined;
}

export function BudgetPeriodMetrics({
  defaultAccountStartBalance,
  defaultAccountEndBalance,
  periodTotalIncome,
  periodTotalSpent,
  periodTotalTransfers,
}: Readonly<BudgetPeriodMetricsProps>) {
  const t = useTranslations('Reports.BudgetPeriodMetrics');
  const styles = reportsStyles.budgetPeriodCard;

  return (
    <div className={styles.metricsContainer}>
      {/* Saldo Iniziale */}
      <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>{t('startBalance')}</p>
            <Amount
              type="balance"
              size="xl"
              emphasis="strong"
              className={cn(styles.metricValue, styles.metricValuePrimary)}
            >
              {defaultAccountStartBalance ?? 0}
            </Amount>
          </div>
        </div>
      </div>

      {/* Entrate Totali */}
      <div className={cn(styles.metricCard, styles.metricCardBudget)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <Wallet className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>{t('totalIncome')}</p>
            <Amount
              type="income"
              size="xl"
              emphasis="strong"
              className={cn(styles.metricValue, styles.metricValueIncome)}
            >
              {periodTotalIncome ?? 0}
            </Amount>
          </div>
        </div>
      </div>

      {/* Uscite Totali */}
      <div className={cn(styles.metricCard, styles.metricCardAccount)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
            <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>{t('totalSpent')}</p>
            <Amount
              type="expense"
              size="xl"
              emphasis="strong"
              className={cn(styles.metricValue, styles.metricValueExpense)}
            >
              {periodTotalSpent ?? 0}
            </Amount>
          </div>
        </div>
      </div>

      {/* Saldo Finale */}
      <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>{t('endBalance')}</p>
            <Amount
              type="balance"
              size="xl"
              emphasis="strong"
              className={cn(styles.metricValue, styles.metricValuePositive)}
            >
              {defaultAccountEndBalance ?? 0}
            </Amount>
          </div>
        </div>
      </div>

      {/* Totale Trasferimenti */}
      <div className={cn(styles.metricCard, styles.metricCardAccount)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
            <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
              {t('totalTransfers')}
            </p>
            <Amount
              type="balance"
              size="xl"
              emphasis="strong"
              className={cn(styles.metricValue, styles.metricValueWarning)}
            >
              {periodTotalTransfers ?? 0}
            </Amount>
          </div>
        </div>
      </div>
    </div>
  );
}
