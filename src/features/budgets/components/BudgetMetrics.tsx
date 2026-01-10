/**
 * BudgetMetrics Component
 * Displays financial metrics in 3-column layout (Available, Spent, Total)
 */

"use client";

import { budgetStyles } from "../theme/budget-styles";
import { formatCurrency } from "@/lib/utils/currency-formatter";

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
    const remainingColorClass = viewModel.remaining < 0 ? "text-destructive" : "text-success";

    return (
      <div className={budgetStyles.metrics.container}>
        {/* Available Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={`${budgetStyles.metrics.label} ${remainingColorClass}`}>Disponibile</p>
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
          <p className={`${budgetStyles.metrics.label} text-primary`}>Totale</p>
          <p className={`${budgetStyles.metrics.value} text-primary`}>{formatCurrency(budgetAmount)}</p>
        </div>
      </div>
    );
  }

  // Fallback for when no viewModel (2-column layout)
  return (
    <div className={budgetStyles.metrics.fallbackGrid}>
      {/* Available Amount */}
      <div className={budgetStyles.metrics.item}>
        <p className={`${budgetStyles.metrics.label} text-primary`}>Disponibile</p>
        <p className={`${budgetStyles.metrics.value} text-primary`}>{formatCurrency(budgetAmount)}</p>
      </div>

      {/* Total Budget */}
      <div className={budgetStyles.metrics.item}>
        <p className={`${budgetStyles.metrics.label} text-primary`}>Totale</p>
        <p className={`${budgetStyles.metrics.value} text-primary`}>{formatCurrency(budgetAmount)}</p>
      </div>
    </div>
  );
}
