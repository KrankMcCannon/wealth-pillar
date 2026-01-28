/**
 * ReportsOverviewCard Component
 * Displays overall financial metrics at the top of the reports page
 * Shows: Total Earned, Total Spent, Total Transferred, Total Balance
 */

"use client";

import { MetricCard, MetricGrid } from "@/components/ui/layout";
import { TrendingUp, TrendingDown, ArrowLeftRight, Wallet } from "lucide-react";
import { reportsStyles } from "@/styles/system";

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

  return (
    <MetricGrid columns={4}>
      {/* Total Earned */}
      <MetricCard
        label="Totale Guadagnato"
        icon={<TrendingUp className={reportsStyles.reportsOverviewCard.icon} />}
        iconColor="success"
        labelTone="variant"
        value={totalEarned}
        valueType="income"
        valueSize="xl"
        description="Incassi + Trasferimenti ricevuti"
        variant="success"
      />

      {/* Total Spent */}
      <MetricCard
        label="Totale Speso"
        icon={<TrendingDown className={reportsStyles.reportsOverviewCard.icon} />}
        iconColor="destructive"
        labelTone="variant"
        value={totalSpent}
        valueType="expense"
        valueSize="xl"
        description="Spese + Trasferimenti effettuati"
        variant="danger"
      />

      {/* Total Transferred */}
      <MetricCard
        label="Totale Trasferito"
        icon={<ArrowLeftRight className={reportsStyles.reportsOverviewCard.icon} />}
        iconColor="accent"
        labelTone="variant"
        value={totalTransferred}
        valueType="neutral"
        valueSize="xl"
        description="Trasferimenti tra conti"
        variant="highlighted"
      />

      {/* Total Balance */}
      <MetricCard
        label="Saldo Totale"
        icon={<Wallet className={reportsStyles.reportsOverviewCard.icon} />}
        iconColor={isPositiveBalance ? "success" : "destructive"}
        labelTone="variant"
        value={totalBalance}
        valueType={isPositiveBalance ? "income" : "expense"}
        valueSize="xl"
        description={isPositiveBalance ? "Saldo positivo" : "Saldo negativo"}
        variant={isPositiveBalance ? "success" : "danger"}
      />
    </MetricGrid>
  );
}
