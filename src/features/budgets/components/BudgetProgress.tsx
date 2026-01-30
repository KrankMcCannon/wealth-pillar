/**
 * BudgetProgress Component
 * Progress bar with status indicator and status message
 */

"use client";

import { budgetStyles, getProgressBarFillStyles, getProgressIndicatorStyles } from "@/styles/system";

export interface BudgetProgressProps {
  progressData: {
    percentage: number;
    spent: number;
    remaining: number;
    amount: number;
  } | null;
}

export function BudgetProgress({ progressData }: Readonly<BudgetProgressProps>) {
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

  const percentageColors = {
    safe: "text-primary",
    warning: "text-warning",
    danger: "text-destructive",
  };

  const indicatorClass = getProgressIndicatorStyles(status);
  const barFill = getProgressBarFillStyles(status, percentage);

  return (
    <div className={budgetStyles.progress.container}>
      {/* Header with indicator and label */}
      <div className={budgetStyles.progress.header}>
        <div className={budgetStyles.progress.indicatorRow}>
          <div className={indicatorClass}></div>
          <span className={budgetStyles.progress.label}>Progresso Budget</span>
        </div>
        <span className={`${budgetStyles.progress.percentage} ${percentageColors[status]}`}>
          {Math.round(percentage)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className={budgetStyles.progress.barWrapper}>
        <div className={budgetStyles.progress.barContainer}>
          <div
            className={barFill.className}
            style={barFill.style}
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
