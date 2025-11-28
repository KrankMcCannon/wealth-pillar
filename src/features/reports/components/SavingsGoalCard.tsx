"use client";

import React from "react";
import { Card } from "@/src/components/ui";
import { reportsStyles } from "@/features/reports";
import { formatCurrency } from "@/lib/utils";

/**
 * Savings Goal Card
 * Displays annual savings goal progress and projections
 */

export interface SavingsGoalProps {
  currentSavings: number;
  savingsGoal: number;
  projectedYearEnd: number;
  projectedMonthly: number;
  monthlyTarget?: number;
  totalToReach?: number;
}

export function SavingsGoalCard({
  currentSavings,
  savingsGoal,
  projectedYearEnd,
  projectedMonthly,
  monthlyTarget = 0,
  totalToReach = 0,
}: Readonly<SavingsGoalProps>) {

  const progress = Math.min((currentSavings / savingsGoal) * 100, 100);
  const onTrack = projectedYearEnd >= savingsGoal;

  return (
    <Card className={reportsStyles.card.container}>
      <div className={reportsStyles.savingsGoal.container}>
        <div className={reportsStyles.savingsGoal.topSection}>
          <h3 className={reportsStyles.savingsGoal.goalTitle}>Obiettivo di Risparmio</h3>
          <span
            className={`${reportsStyles.savingsGoal.goalStatus} ${onTrack ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
          >
            {onTrack ? "Sei sulla buona strada" : "Rimetti in pista"}
          </span>
        </div>

        <div className={reportsStyles.savingsGoal.progressSection}>
          <div className={reportsStyles.savingsGoal.progressLabel}>
            <span>Risparmi anno</span>
            <span>{formatCurrency(currentSavings)}</span>
          </div>
          <p className={reportsStyles.savingsGoal.progressValue}>
            Obiettivo: {formatCurrency(savingsGoal)}
          </p>
          <div className={reportsStyles.savingsGoal.progressBar}>
            <div
              className={reportsStyles.savingsGoal.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(progress)}% completato
          </p>
        </div>

        <div className={reportsStyles.savingsGoal.projection}>
          <div className="space-y-3">
            <div>
              <p className={reportsStyles.savingsGoal.projectionLabel}>Media mensile</p>
              <p className={reportsStyles.savingsGoal.projectionValue}>{formatCurrency(projectedMonthly)}</p>
            </div>
            <div>
              <p className={reportsStyles.savingsGoal.projectionLabel}>Broadcast annuale</p>
              <p className={reportsStyles.savingsGoal.projectionValue}>{formatCurrency(projectedYearEnd)}</p>
            </div>
            {!onTrack && totalToReach > 0 && (
              <>
                <div className="pt-2 border-t border-primary/20">
                  <p className={reportsStyles.savingsGoal.projectionLabel}>Totale da raggiungere</p>
                  <p className="text-sm font-semibold text-amber-600">
                    {formatCurrency(totalToReach)}
                  </p>
                </div>
                <div>
                  <p className={reportsStyles.savingsGoal.projectionLabel}>Target mensile (per raggiungere goal)</p>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(monthlyTarget)}
                  </p>
                </div>
              </>
            )}
            {onTrack && (
              <div className="pt-2 border-t border-primary/20 bg-emerald-50/50 rounded p-2">
                <p className={reportsStyles.savingsGoal.projectionLabel}>Margine raggiunto</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(Math.max(0, projectedYearEnd - savingsGoal))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
