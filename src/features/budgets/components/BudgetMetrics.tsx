/**
 * BudgetMetrics Component
 * Displays financial metrics in 3-column layout (Available, Spent, Total)
 */

"use client";

import { budgetStyles } from "../theme/budget-styles";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import React from "react";

export interface BudgetMetricsProps {
  viewModel: {
    spent: number;
    remaining: number;
    percentage: number;
  } | null;
  budgetAmount: number;
}

export function BudgetMetrics({ viewModel, budgetAmount }: BudgetMetricsProps) {
  if (viewModel) {
    const remainingColorClass = viewModel.remaining < 0 ? "text-destructive" : "text-primary";

    return (
      <div className={budgetStyles.metrics.container}>
        {/* Available Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Disponibile</p>
          <p className={`${budgetStyles.metrics.value} ${remainingColorClass}`}>
            {formatCurrency(viewModel.remaining)}
          </p>
        </div>

        {/* Spent Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={`${budgetStyles.metrics.label} text-destructive`}>Speso</p>
          <p className={`${budgetStyles.metrics.value} text-destructive`}>{formatCurrency(viewModel.spent)}</p>
        </div>

        {/* Total Budget */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Totale</p>
          <p className={budgetStyles.metrics.value}>{formatCurrency(budgetAmount)}</p>
        </div>
      </div>
    );
  }

  // Fallback for when no viewModel (2-column layout)
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Available Amount */}
      <div className={budgetStyles.metrics.item}>
        <p className={budgetStyles.metrics.label}>Disponibile</p>
        <p className={budgetStyles.metrics.value}>{formatCurrency(budgetAmount)}</p>
      </div>

      {/* Total Budget */}
      <div className={budgetStyles.metrics.item}>
        <p className={budgetStyles.metrics.label}>Totale</p>
        <p className={budgetStyles.metrics.value}>{formatCurrency(budgetAmount)}</p>
      </div>
    </div>
  );
}
