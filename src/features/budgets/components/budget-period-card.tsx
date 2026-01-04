"use client";

import { Trash2 } from "lucide-react";
import type { BudgetPeriod } from "@/lib/types";
import { Button, Badge } from "@/src/components/ui";
import { toDateTime } from "@/lib/utils/date-utils";

interface BudgetPeriodCardProps {
  period: BudgetPeriod;
  onDelete?: () => void;
  showActions?: boolean;
  totalSpent?: number;
  totalSaved?: number;
  categorySpending?: Record<string, number>;
}

/**
 * Budget Period Card Component
 * Displays a single budget period with metrics and actions
 *
 * @param period - Budget period data to display
 * @param onDelete - Callback for delete action
 * @param showActions - Whether to show action buttons (default: true)
 */
export function BudgetPeriodCard({
  period,
  onDelete,
  showActions = true,
  totalSpent,
  totalSaved,
  categorySpending,
}: Readonly<BudgetPeriodCardProps>) {
  // Format date for display (Italian locale)
  const formatDate = (date: string | Date | null) => {
    if (!date) return "—";
    const dt = toDateTime(date);
    if (!dt) return "Data non valida";
    return dt.toFormat("d LLL yyyy", { locale: "it" });
  };

  // Format currency (EUR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  // Get top 3 categories by spending (if available)
  const topCategories = categorySpending
    ? Object.entries(categorySpending)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 3)
    : [];

  // Determine if period is active
  const isActive = period.is_active && !period.end_date;

  return (
    <div className="p-4 border border-primary/10 rounded-xl space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Header with dates and status */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-black">
            {formatDate(period.start_date)}
            {period.end_date && (
              <>
                <span className="text-muted-foreground mx-1">→</span>
                {formatDate(period.end_date)}
              </>
            )}
          </p>
          <Badge
            variant={isActive ? "default" : "secondary"}
            className={isActive ? "bg-primary text-white mt-1" : "mt-1"}
          >
            {isActive ? "In corso" : "Chiuso"}
          </Badge>
        </div>

        {/* Delete action */}
        {showActions && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            title="Elimina periodo"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Financial Metrics */}
      {(totalSpent !== undefined || totalSaved !== undefined) && (
        <div className="grid grid-cols-2 gap-2">
          {/* Total Spent */}
          {totalSpent !== undefined && (
            <div className="p-3 bg-destructive/5 rounded-lg border border-destructive/20">
              <p className="text-xs font-bold text-destructive uppercase tracking-wide mb-1">
                Speso
              </p>
              <p className="text-base font-bold text-destructive">
                {formatCurrency(totalSpent)}
              </p>
            </div>
          )}

          {/* Total Saved */}
          {totalSaved !== undefined && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-bold text-primary uppercase tracking-wide mb-1">
                Risparmiato
              </p>
              <p className="text-base font-bold text-primary">
                {formatCurrency(totalSaved)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className="pt-2 border-t border-primary/10">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Top Categorie
          </p>
          <div className="space-y-1.5">
            {topCategories.map(([category, amount]) => (
              <div
                key={category}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-muted-foreground capitalize">
                  {category}
                </span>
                <span className="font-medium text-black">
                  {formatCurrency(amount as number)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export with displayName for debugging
BudgetPeriodCard.displayName = "BudgetPeriodCard";
