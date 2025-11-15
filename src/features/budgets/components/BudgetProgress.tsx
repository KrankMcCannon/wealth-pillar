/**
 * BudgetProgress Component
 * Progress bar with status indicator and status message
 */

"use client";

import { budgetStyles } from "../theme/budget-styles";
import React from "react";

export interface BudgetProgressProps {
  progressData: null;
}

export function BudgetProgress({}: BudgetProgressProps) {
  // const statusMessages = {
  //   safe: "✅ Budget sotto controllo",
  //   warning: "⚠️ Attenzione, quasi esaurito",
  //   danger: "⚠️ Budget superato",
  // };

  // const percentageColorClasses = {
  //   safe: budgetStyles.progress.percentageSafe,
  //   warning: budgetStyles.progress.percentageWarning,
  //   danger: budgetStyles.progress.percentageDanger,
  // };

  return (
    <div className={budgetStyles.progress.container}>
      {/* Header with indicator and label */}
      <div className={budgetStyles.progress.header}>
        <div className="flex items-center gap-2">
          <div className={""}></div>
          <span className={budgetStyles.progress.label}>Progresso Budget</span>
        </div>
        <span className={`${budgetStyles.progress.percentage} ${""}`}>{""}%</span>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className={budgetStyles.progress.barContainer}>
          <div className={""} style={{}} />
        </div>
      </div>

      {/* Status message */}
      <div className={budgetStyles.progress.status}>
        <p className={budgetStyles.progress.statusText}>{""}</p>
      </div>
    </div>
  );
}
