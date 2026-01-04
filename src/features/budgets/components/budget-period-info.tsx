"use client";

import { Badge } from "@/src/components/ui";
import { BudgetPeriod } from "@/src/lib";
import { Calendar, Clock } from "lucide-react";

interface BudgetPeriodInfoProps {
  period: BudgetPeriod | null;
  className?: string;
  showSpending?: boolean;
  totalSpent?: number;
  totalSaved?: number;
  categorySpending?: Record<string, number>;
}

export function BudgetPeriodInfo({
  period,
  className = "",
  showSpending = true,
  totalSpent,
  totalSaved,
  categorySpending,
}: BudgetPeriodInfoProps) {
  if (!period) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <p className="text-xs text-primary/70">Nessun periodo attivo</p>
      </div>
    );
  }

  const isCurrentPeriod = period.is_active && !period.end_date;
  const endDate = period.end_date ? period.end_date : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Period Status and Dates */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary/70" />
          <span className="text-xs font-medium text-primary/70">{endDate ? `- ${endDate}` : "- in corso"}</span>
        </div>

        <Badge variant={isCurrentPeriod ? "default" : "secondary"} className="text-xs font-semibold">
          {isCurrentPeriod ? (
            <>
              <Clock className="h-3 w-3 mr-1" />
              Attivo
            </>
          ) : (
            "Concluso"
          )}
        </Badge>
      </div>

      {/* Spending Summary */}
      {showSpending && (totalSpent !== undefined || totalSaved !== undefined) && (
        <div className="grid grid-cols-2 gap-3">
          {totalSpent !== undefined && (
            <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
              <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1">Speso</p>
              <p className="text-sm font-bold text-destructive">{totalSpent}</p>
            </div>
          )}

          {totalSaved !== undefined && (
            <div className="bg-success/5 rounded-lg px-3 py-2 border border-success/10">
              <p className="text-xs font-semibold text-success/70 uppercase tracking-wide mb-1">Risparmiato</p>
              <p className="text-sm font-bold text-success">{totalSaved}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown (if available) */}
      {categorySpending && Object.keys(categorySpending).length > 0 && (
        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-2">Principali Categorie</p>
          <div className="space-y-1">
            {Object.entries(categorySpending)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-xs text-primary/70 capitalize">{category.replace(/_/g, " ")}</span>
                  <span className="text-xs font-semibold text-primary">{amount as number}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
