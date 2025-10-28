/**
 * BudgetMetrics Component
 * Displays financial metrics in 3-column layout (Available, Spent, Total)
 */

'use client';

import { formatCurrency } from '@/lib';
import { budgetStyles } from '../theme/budget-styles';
import React from 'react';
import { BudgetsViewModel } from '../services/budgets-view-model';

export interface BudgetMetricsProps {
  viewModel: BudgetsViewModel | null;
  budgetAmount: number;
}

export function BudgetMetrics({ viewModel, budgetAmount }: BudgetMetricsProps) {
  if (viewModel && viewModel.periodInfo) {
    return (
      <div className={budgetStyles.metrics.container}>
        {/* Available Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Disponibile</p>
          <p
            className={`${budgetStyles.metrics.value} ${
              viewModel.financialMetrics.remaining >= 0
                ? budgetStyles.metrics.valueSafe
                : budgetStyles.metrics.valueDanger
            }`}
          >
            {formatCurrency(viewModel.financialMetrics.remaining)}
          </p>
        </div>

        {/* Spent Amount */}
        <div className={budgetStyles.metrics.item}>
          <p className={`${budgetStyles.metrics.label} text-destructive`}>
            Speso
          </p>
          <p className={`${budgetStyles.metrics.value} text-destructive`}>
            {formatCurrency(viewModel.financialMetrics.totalSpent)}
          </p>
        </div>

        {/* Total Budget */}
        <div className={budgetStyles.metrics.item}>
          <p className={budgetStyles.metrics.label}>Totale</p>
          <p className={budgetStyles.metrics.value}>
            {formatCurrency(viewModel.financialMetrics.totalBudgeted)}
          </p>
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
        <p className={budgetStyles.metrics.value}>{formatCurrency(0)}</p>
      </div>

      {/* Total Budget */}
      <div className={budgetStyles.metrics.item}>
        <p className={budgetStyles.metrics.label}>Totale</p>
        <p className={budgetStyles.metrics.value}>{formatCurrency(budgetAmount)}</p>
      </div>
    </div>
  );
}
