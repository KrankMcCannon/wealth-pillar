/**
 * BudgetProgress Component
 * Progress bar with status indicator and status message
 */

"use client";

import { budgetStyles } from "../theme/budget-styles";
import React from "react";

export interface BudgetProgressProps {
  progressData: {
    percentage: number;
    spent: number;
    remaining: number;
    amount: number;
  } | null;
}

export function BudgetProgress({ progressData }: BudgetProgressProps) {
  if (!progressData) return null;

  const { percentage } = progressData;

  // Determine status based on percentage
  const getStatus = (pct: number): 'safe' | 'warning' | 'danger' => {
    if (pct >= 100) return 'danger';
    if (pct >= 75) return 'warning';
    return 'safe';
  };

  const status = getStatus(percentage);

  const statusMessages = {
    safe: "✅ Budget sotto controllo",
    warning: "⚠️ Attenzione, quasi esaurito",
    danger: "⚠️ Budget superato",
  };

  const indicatorColors = {
    safe: "bg-primary",
    warning: "bg-warning",
    danger: "bg-destructive",
  };

  const percentageColors = {
    safe: "text-primary",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const barColors = {
    safe: "bg-primary",
    warning: "bg-warning",
    danger: "bg-destructive",
  };

  return (
    <div className={budgetStyles.progress.container}>
      {/* Header with indicator and label */}
      <div className={budgetStyles.progress.header}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${indicatorColors[status]}`}></div>
          <span className={budgetStyles.progress.label}>Progresso Budget</span>
        </div>
        <span className={`${budgetStyles.progress.percentage} ${percentageColors[status]}`}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className={budgetStyles.progress.barContainer}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColors[status]}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Status message */}
      <div className={budgetStyles.progress.status}>
        <p className={budgetStyles.progress.statusText}>{statusMessages[status]}</p>
      </div>
    </div>
  );
}
