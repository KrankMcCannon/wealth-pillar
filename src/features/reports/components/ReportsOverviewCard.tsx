/**
 * ReportsOverviewCard Component
 * Displays overall financial metrics at the top of the reports page
 * Shows: Total Earned, Total Spent, Total Transferred, Total Balance
 */

"use client";

import { Card } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { TrendingUp, TrendingDown, ArrowLeftRight, Wallet } from "lucide-react";
import { reportsStyles } from "../theme/reports-styles";
import { cn } from "@/lib/utils";

export interface ReportsOverviewCardProps {
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalBalance: number;
}

export function ReportsOverviewCard({
  totalEarned,
  totalSpent,
  totalTransferred,
  totalBalance,
}: Readonly<ReportsOverviewCardProps>) {
  const isPositiveBalance = totalBalance >= 0;
  const styles = reportsStyles.reportsOverviewCard;

  return (
    <div className={styles.container}>
      {/* Total Earned */}
      <Card className={styles.earnedCard}>
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <p className={reportsStyles.overview.label}>Totale Guadagnato</p>
          </div>
          <div className={styles.earnedIcon}>
            <TrendingUp className={styles.iconSize} />
          </div>
        </div>

        <Amount type="income" size="xl" emphasis="strong" className={styles.earnedValue}>
          {totalEarned}
        </Amount>

        <p className={styles.earnedDescription}>
          Incassi + Trasferimenti ricevuti
        </p>
      </Card>

      {/* Total Spent */}
      <Card className={styles.spentCard}>
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <p className={reportsStyles.overview.label}>Totale Speso</p>
          </div>
          <div className={styles.spentIcon}>
            <TrendingDown className={styles.iconSize} />
          </div>
        </div>

        <Amount type="expense" size="xl" emphasis="strong" className={styles.spentValue}>
          {totalSpent}
        </Amount>

        <p className={styles.spentDescription}>
          Spese + Trasferimenti effettuati
        </p>
      </Card>

      {/* Total Transferred */}
      <Card className={styles.transferredCard}>
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <p className={reportsStyles.overview.label}>Totale Trasferito</p>
          </div>
          <div className={styles.transferredIcon}>
            <ArrowLeftRight className={styles.iconSize} />
          </div>
        </div>

        <Amount size="xl" emphasis="strong" className={styles.transferredValue}>
          {totalTransferred}
        </Amount>

        <p className={styles.transferredDescription}>
          Trasferimenti tra conti
        </p>
      </Card>

      {/* Total Balance */}
      <Card
        className={cn(
          styles.balanceCard,
          isPositiveBalance ? styles.balanceCardPositive : styles.balanceCardNegative
        )}
      >
        <div className={styles.headerRow}>
          <div className={styles.headerContent}>
            <p className={reportsStyles.overview.label}>Saldo Totale</p>
          </div>
          <div className={isPositiveBalance ? styles.balanceIconPositive : styles.balanceIconNegative}>
            <Wallet className={styles.iconSize} />
          </div>
        </div>

        <Amount
          type={isPositiveBalance ? "income" : "expense"}
          size="xl"
          emphasis="strong"
          className={isPositiveBalance ? styles.balanceValuePositive : styles.balanceValueNegative}
        >
          {totalBalance}
        </Amount>

        <p className={isPositiveBalance ? styles.balanceDescriptionPositive : styles.balanceDescriptionNegative}>
          {isPositiveBalance ? "Saldo positivo" : "Saldo negativo"}
        </p>
      </Card>
    </div>
  );
}
