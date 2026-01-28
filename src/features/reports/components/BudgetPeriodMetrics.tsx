"use client";

import { cn } from "@/lib/utils";
import { PiggyBank, Wallet, ArrowLeftRight } from "lucide-react";
import { Amount } from "@/components/ui/primitives";
import { reportsStyles } from "@/styles/system";

interface BudgetPeriodMetricsProps {
  defaultAccountStartBalance?: number | null;
  defaultAccountEndBalance?: number | null;
  periodTotalIncome?: number;
  periodTotalSpent?: number;
  periodTotalTransfers?: number;
}

export function BudgetPeriodMetrics({
  defaultAccountStartBalance,
  defaultAccountEndBalance,
  periodTotalIncome,
  periodTotalSpent,
  periodTotalTransfers,
}: Readonly<BudgetPeriodMetricsProps>) {
  const styles = reportsStyles.budgetPeriodCard;

  return (
    <div className={styles.metricsContainer}>
      {/* Start Balance */}
      <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
              Saldo Iniziale
            </p>
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

      {/* Total Income (Entrate Totali) */}
      <div className={cn(styles.metricCard, styles.metricCardBudget)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <Wallet className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
              Entrate Totali
            </p>
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

      {/* Total Spent (Uscite Totali) */}
      <div className={cn(styles.metricCard, styles.metricCardAccount)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
            <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
              Uscite Totali
            </p>
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

      {/* End Balance */}
      <div className={cn(styles.metricCard, styles.metricCardTransfer)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeDefault)}>
            <PiggyBank className={cn(styles.metricIcon, styles.metricIconDefault)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelDefault)}>
              Saldo Finale
            </p>
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

      {/* Total Transfers */}
      <div className={cn(styles.metricCard, styles.metricCardAccount)}>
        <div className={styles.metricHeader}>
          <div className={cn(styles.metricIconBadge, styles.metricIconBadgeTransfer)}>
            <ArrowLeftRight className={cn(styles.metricIcon, styles.metricIconTransfer)} />
          </div>
          <div className={styles.metricContent}>
            <p className={cn(styles.metricLabel, styles.metricLabelTransfer)}>
              Totale Trasferimenti
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
