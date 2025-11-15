/**
 * BudgetMetrics Component
 * Displays financial metrics in 3-column layout (Available, Spent, Total)
 */

"use client";

import { budgetStyles } from "../theme/budget-styles";
import React from "react";

export interface BudgetMetricsProps {
  viewModel: null;
  budgetAmount: number;
}

export function BudgetMetrics({ budgetAmount }: BudgetMetricsProps) {
  if (false) {
    return (
      <div className={budgetStyles.metrics.container}>
        {/* Available Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Disponibile</p>
          <p className={`${budgetStyles.metrics.value} ${""}`}>{0}</p>
        </div>

        {/* Spent Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={`${budgetStyles.metrics.label} text-destructive`}>Speso</p>
          <p className={`${budgetStyles.metrics.value} text-destructive`}>{0}</p>
        </div>

        {/* Total Budget */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Totale</p>
          <p className={budgetStyles.metrics.value}>{0}</p>
        </div>
      </div>
    );
  }

  // Fallback for when no period info (2-column layout)
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Available Amount */}
      <div className={budgetStyles.metrics.item}>
        <p className={budgetStyles.metrics.label}>Disponibile</p>
        <p className={budgetStyles.metrics.value}>{0}</p>
      </div>

      {/* Total Budget */}
      <div className={budgetStyles.metrics.item}>
        <p className={budgetStyles.metrics.label}>Totale</p>
        <p className={budgetStyles.metrics.value}>{budgetAmount}</p>
      </div>
    </div>
  );
}
