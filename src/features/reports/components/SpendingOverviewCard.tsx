"use client";

import React from "react";
import { Card } from "@/src/components/ui";
import { TrendingDown, TrendingUp } from "lucide-react";
import { reportsStyles } from "@/features/reports";

/**
 * Spending Overview Card
 * Displays current month income, expenses, net savings with trends
 */

export interface SpendingOverviewProps {
  income: number;
  expenses: number;
  netSavings: number;
  incomeChange?: number;
  expenseChange?: number;
  savingsRate: number;
}

export function SpendingOverviewCard({
  income,
  expenses,
  netSavings,
  incomeChange = 0,
  expenseChange = 0,
}: Readonly<SpendingOverviewProps>) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getTrendColor = (change: number) => {
    if (change === 0) return reportsStyles.overview.neutral;
    return change > 0 ? reportsStyles.overview.positive : reportsStyles.overview.negative;
  };

  const getTrendIcon = (change: number) => {
    if (change === 0) return null;
    return change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
  };

  return (
    <Card className={reportsStyles.card.container}>
      <div className={reportsStyles.overview.container}>
        <div className={reportsStyles.overview.grid}>
          {/* Income */}
          <div className={reportsStyles.overview.item}>
            <span className={reportsStyles.overview.label}>Entrate</span>
            <span className={reportsStyles.overview.value}>{formatCurrency(income)}</span>
            {incomeChange !== 0 && (
              <div className={`${reportsStyles.overview.change} ${getTrendColor(incomeChange)}`}>
                {getTrendIcon(incomeChange)}
                <span>{Math.abs(incomeChange).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Expenses */}
          <div className={reportsStyles.overview.item}>
            <span className={reportsStyles.overview.label}>Uscite</span>
            <span className={reportsStyles.overview.value}>{formatCurrency(expenses)}</span>
            {expenseChange !== 0 && (
              <div className={`${reportsStyles.overview.change} ${getTrendColor(-expenseChange)}`}>
                {getTrendIcon(-expenseChange)}
                <span>{Math.abs(expenseChange).toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Net Savings */}
          <div className={reportsStyles.overview.item}>
            <span className={reportsStyles.overview.label}>Risparmi</span>
            <span className={`${reportsStyles.overview.value} ${netSavings >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {formatCurrency(netSavings)}
            </span>
            <div className={reportsStyles.overview.change}>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
