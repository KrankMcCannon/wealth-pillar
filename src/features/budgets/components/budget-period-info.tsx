"use client";

import { Badge } from "@/components/ui";
import { BudgetPeriod } from "@/lib";
import { Calendar, Clock } from "lucide-react";
import { budgetStyles } from "@/styles/system";

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
}: Readonly<BudgetPeriodInfoProps>) {
  if (!period) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <p className={budgetStyles.periodInfo.emptyText}>Nessun periodo attivo</p>
      </div>
    );
  }

  const isCurrentPeriod = period.is_active && !period.end_date;
  const endDate = period.end_date ? period.end_date : null;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Period Status and Dates */}
      <div className={budgetStyles.periodInfo.headerRow}>
        <div className={budgetStyles.periodInfo.headerLeft}>
          <Calendar className={budgetStyles.periodInfo.headerIcon} />
          <span className={budgetStyles.periodInfo.headerText}>{endDate ? `- ${endDate}` : "- in corso"}</span>
        </div>

        <Badge variant={isCurrentPeriod ? "default" : "secondary"} className={budgetStyles.periodInfo.badge}>
          {isCurrentPeriod ? (
            <>
              <Clock className={budgetStyles.periodInfo.badgeIcon} />
              Attivo
            </>
          ) : (
            "Concluso"
          )}
        </Badge>
      </div>

      {/* Spending Summary */}
      {showSpending && (totalSpent !== undefined || totalSaved !== undefined) && (
        <div className={budgetStyles.periodInfo.metricsGrid}>
          {totalSpent !== undefined && (
            <div className={budgetStyles.periodInfo.metricSpent}>
              <p className={budgetStyles.periodInfo.metricLabelSpent}>Speso</p>
              <p className={budgetStyles.periodInfo.metricValueSpent}>{totalSpent}</p>
            </div>
          )}

          {totalSaved !== undefined && (
            <div className={budgetStyles.periodInfo.metricSaved}>
              <p className={budgetStyles.periodInfo.metricLabelSaved}>Risparmiato</p>
              <p className={budgetStyles.periodInfo.metricValueSaved}>{totalSaved}</p>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown (if available) */}
      {categorySpending && Object.keys(categorySpending).length > 0 && (
        <div className={budgetStyles.periodInfo.topCategories}>
          <p className={budgetStyles.periodInfo.topCategoriesTitle}>Principali Categorie</p>
          <div className={budgetStyles.periodInfo.topCategoriesList}>
            {Object.entries(categorySpending)
              .sort(([, a], [, b]) => (b) - (a))
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} className={budgetStyles.periodInfo.topCategoryRow}>
                  <span className={budgetStyles.periodInfo.topCategoryLabel}>{category.replaceAll('_', " ")}</span>
                  <span className={budgetStyles.periodInfo.topCategoryAmount}>{amount}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
