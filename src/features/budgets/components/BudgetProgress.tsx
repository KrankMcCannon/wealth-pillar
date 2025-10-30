/**
 * BudgetProgress Component
 * Progress bar with status indicator and status message
 */

'use client';

import { getProgressBarFillStyles, getProgressIndicatorStyles } from '../theme/budget-styles';
import { budgetStyles } from '../theme/budget-styles';
import React from 'react';
import { BudgetProgress as BudgetProgressData } from '@/lib';

export interface BudgetProgressProps {
  progressData: BudgetProgressData;
}

export function BudgetProgress({ progressData }: BudgetProgressProps) {
  const status = progressData.status;
  const percentage = Math.round(progressData.percentage);
  const indicatorClass = getProgressIndicatorStyles(status);
  const { className: barFillClass, style: barFillStyle } = getProgressBarFillStyles(
    status,
    percentage
  );

  const statusMessages = {
    safe: '✅ Budget sotto controllo',
    warning: '⚠️ Attenzione, quasi esaurito',
    danger: '⚠️ Budget superato',
  };

  const percentageColorClasses = {
    safe: budgetStyles.progress.percentageSafe,
    warning: budgetStyles.progress.percentageWarning,
    danger: budgetStyles.progress.percentageDanger,
  };

  return (
    <div className={budgetStyles.progress.container}>
      {/* Header with indicator and label */}
      <div className={budgetStyles.progress.header}>
        <div className="flex items-center gap-2">
          <div className={indicatorClass}></div>
          <span className={budgetStyles.progress.label}>Progresso Budget</span>
        </div>
        <span className={`${budgetStyles.progress.percentage} ${percentageColorClasses[status]}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className={budgetStyles.progress.barContainer}>
          <div className={barFillClass} style={barFillStyle} />
        </div>
      </div>

      {/* Status message */}
      <div className={budgetStyles.progress.status}>
        <p className={budgetStyles.progress.statusText}>{statusMessages[status]}</p>
      </div>
    </div>
  );
}
