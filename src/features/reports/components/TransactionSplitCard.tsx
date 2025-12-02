/**
 * TransactionSplitCard Component
 * Displays side-by-side comparison of earned vs spent amounts
 */

"use client";

import { Card } from "@/components/ui";
import { Amount } from "@/components/ui/primitives";
import { TrendingUp, TrendingDown } from "lucide-react";
import { reportsStyles } from "../theme/reports-styles";

export interface TransactionSplitCardProps {
  earned: number;
  spent: number;
}

export function TransactionSplitCard({
  earned,
  spent,
}: Readonly<TransactionSplitCardProps>) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* Earned Column (Left) */}
      <Card className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className={reportsStyles.overview.label}>Totale Guadagnato</p>
          </div>
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        <Amount type="income" size="xl" emphasis="strong" className="text-emerald-700 dark:text-emerald-400">
          {earned}
        </Amount>

        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2">
          Incassi + Trasferimenti in entrata
        </p>
      </Card>

      {/* Spent Column (Right) */}
      <Card className="p-4 bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/50 hover:shadow-lg transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className={reportsStyles.overview.label}>Totale Speso</p>
          </div>
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 shrink-0">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>

        <Amount type="expense" size="xl" emphasis="strong" className="text-red-700 dark:text-red-400">
          {spent}
        </Amount>

        <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2">
          Spese + Trasferimenti in uscita
        </p>
      </Card>
    </div>
  );
}
