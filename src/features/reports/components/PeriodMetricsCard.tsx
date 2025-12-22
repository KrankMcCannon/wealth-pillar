"use client";

import { useState } from "react";
import { Card } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { Wallet, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportsStyles } from "../theme/reports-styles";

export interface PeriodMetricsCardProps {
  // Account-based metrics (excludes internal transfers)
  accountMoneyIn: number;
  accountMoneyOut: number;
  accountBalance: number;
  internalTransfers: number;

  // Budget-based metrics (includes all transfers)
  budgetIncrease: number;
  budgetDecrease: number;
  budgetBalance: number;
}

type ViewMode = "account" | "budget";

export function PeriodMetricsCard({
  accountMoneyIn,
  accountMoneyOut,
  accountBalance,
  internalTransfers,
  budgetIncrease,
  budgetDecrease,
  budgetBalance,
}: Readonly<PeriodMetricsCardProps>) {
  const [viewMode, setViewMode] = useState<ViewMode>("account");

  const isAccountPositive = accountBalance >= 0;
  const isBudgetPositive = budgetBalance >= 0;

  const styles = reportsStyles.periodMetricsCard;

  return (
    <Card className={styles.container}>
      {/* Tab Navigation */}
      <div className={styles.tabContainer}>
        <button
          onClick={() => setViewMode("account")}
          className={cn(
            styles.tabButton,
            viewMode === "account" ? styles.tabActive : styles.tabInactive
          )}
        >
          <Wallet className={styles.tabIcon} />
          Vista Account
        </button>
        <button
          onClick={() => setViewMode("budget")}
          className={cn(
            styles.tabButton,
            viewMode === "budget" ? styles.tabActive : styles.tabInactive
          )}
        >
          <PiggyBank className={styles.tabIcon} />
          Vista Budget
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {viewMode === "account" ? (
          <div className={styles.viewContainer}>
            {/* Description */}
            <p className={styles.description}>
              Flusso di cassa reale (esclude trasferimenti interni)
            </p>

            {/* Money In */}
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Denaro in entrata</span>
              <Amount type="income" size="md" emphasis="default" className={styles.metricValueIncome}>
                {accountMoneyIn}
              </Amount>
            </div>

            {/* Money Out */}
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Denaro in uscita</span>
              <Amount type="expense" size="md" emphasis="default" className={styles.metricValueExpense}>
                {accountMoneyOut}
              </Amount>
            </div>

            {/* Internal Transfers (for reference) */}
            {internalTransfers > 0 && (
              <div className={styles.transfersRow}>
                <span className={styles.transfersLabel}>Trasferimenti interni</span>
                <Amount size="sm" className={styles.transfersValue}>
                  {internalTransfers}
                </Amount>
              </div>
            )}

            {/* Balance */}
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>Saldo Account</span>
              <Amount
                type={isAccountPositive ? "income" : "expense"}
                size="lg"
                emphasis="strong"
                className={isAccountPositive ? styles.balanceValuePositive : styles.balanceValueNegative}
              >
                {accountBalance}
              </Amount>
            </div>
          </div>
        ) : (
          <div className={styles.viewContainer}>
            {/* Description */}
            <p className={styles.description}>
              Impatto totale sul budget (include tutti i trasferimenti)
            </p>

            {/* Budget Increase */}
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Aumento budget</span>
              <Amount type="income" size="md" emphasis="default" className={styles.metricValueIncome}>
                {budgetIncrease}
              </Amount>
            </div>

            {/* Budget Decrease */}
            <div className={styles.metricRow}>
              <span className={styles.metricLabel}>Riduzione budget</span>
              <Amount type="expense" size="md" emphasis="default" className={styles.metricValueExpense}>
                {budgetDecrease}
              </Amount>
            </div>

            {/* Balance */}
            <div className={styles.balanceRow}>
              <span className={styles.balanceLabel}>Saldo Budget</span>
              <Amount
                type={isBudgetPositive ? "income" : "expense"}
                size="lg"
                emphasis="strong"
                className={isBudgetPositive ? styles.balanceValuePositive : styles.balanceValueNegative}
              >
                {budgetBalance}
              </Amount>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
