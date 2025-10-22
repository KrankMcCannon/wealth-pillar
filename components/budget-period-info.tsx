"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { BudgetPeriod } from "@/lib/types";

interface BudgetPeriodInfoProps {
  period: BudgetPeriod | null;
  className?: string;
  showSpending?: boolean;
}

export function BudgetPeriodInfo({ period, className = "", showSpending = true }: BudgetPeriodInfoProps) {
  if (!period) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <p className="text-xs text-primary/70">Nessun periodo attivo</p>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return null;
    const d = new Date(date);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isCurrentPeriod = period.is_active && !period.end_date;
  const startDate = formatDate(period.start_date);
  const endDate = formatDate(period.end_date);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Period Status and Dates */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-3 w-3 text-primary/70" />
          <span className="text-xs font-medium text-primary/70">
            {startDate} {endDate ? `- ${endDate}` : '- in corso'}
          </span>
        </div>

        <Badge
          variant={isCurrentPeriod ? "default" : "secondary"}
          className="text-xs font-semibold"
        >
          {isCurrentPeriod ? (
            <>
              <Clock className="h-3 w-3 mr-1" />
              Attivo
            </>
          ) : (
            'Concluso'
          )}
        </Badge>
      </div>

      {/* Spending Summary */}
      {showSpending && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/5 rounded-lg px-3 py-2 border border-primary/10">
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-1">
              Speso
            </p>
            <p className="text-sm font-bold text-destructive">
              {formatCurrency(period.total_spent)}
            </p>
          </div>

          <div className="bg-success/5 rounded-lg px-3 py-2 border border-success/10">
            <p className="text-xs font-semibold text-success/70 uppercase tracking-wide mb-1">
              Risparmiato
            </p>
            <p className="text-sm font-bold text-success">
              {formatCurrency(period.total_saved)}
            </p>
          </div>
        </div>
      )}

      {/* Category Breakdown (if available) */}
      {period.category_spending && Object.keys(period.category_spending).length > 0 && (
        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide mb-2">
            Principali Categorie
          </p>
          <div className="space-y-1">
            {Object.entries(period.category_spending)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-xs text-primary/70 capitalize">
                    {category.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
