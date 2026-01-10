/**
 * BudgetCard - Domain card for budgets
 */

"use client";

import { memo } from "react";
import { IconContainer, StatusBadge, Text } from "@/components/ui";
import { Budget, CategoryIcon, iconSizes, progressBarVariants, progressFillVariants } from "@/lib";
import { formatCurrency } from "@/lib/utils/currency-formatter";
import { cardStyles, getBudgetProgressStyle, getBudgetStatusTextClass } from "./theme/card-styles";

interface BudgetCardProps {
  budget: Budget;
  budgetInfo?: {
    id: string;
    spent: number;
    remaining: number;
    progress: number;
  };
  onClick: () => void;
}

export const BudgetCard = memo(function BudgetCard({ budget, budgetInfo, onClick }: BudgetCardProps) {
  // Status calculation (centralized logic)
  const getStatusVariant = (progress: number): "success" | "warning" | "danger" => {
    if (progress >= 100) return "danger";
    if (progress >= 80) return "warning";
    return "success";
  };

  // Get text color class based on status
  const remaining = budgetInfo?.remaining ?? budget.amount;
  const progress = budgetInfo?.progress || 0;
  const status = getStatusVariant(progress);

  // Custom subtitle with status badge
  // We'll use a custom implementation for this specific case
  return (
    <button
      className={cardStyles.budget.container}
      onClick={onClick}
      data-testid={`budget-card-${budget.id}`}
    >
      <div className={cardStyles.budget.row}>
        <div className={cardStyles.budget.left}>
          {/* Icon Container */}
          <IconContainer size="md" color="primary">
            <CategoryIcon categoryKey={budget.categories?.[0] || "altro"} size={iconSizes.md} />
          </IconContainer>

          <div className={cardStyles.budget.content}>
            {/* Budget title */}
            <Text variant="heading" size="sm" className={cardStyles.budget.title}>
              {budget.description}
            </Text>

            {/* Progress badge */}
            <StatusBadge status={status} size="sm" showDot className={cardStyles.budget.statusBadge}>
              {Math.round(progress)}%
            </StatusBadge>
          </div>
        </div>

        <div className={cardStyles.budget.right}>
          {/* Remaining amount */}
          <Text variant="emphasis" size="sm" className={getBudgetStatusTextClass(status)}>
            {formatCurrency(remaining)}
          </Text>
          <Text variant="subtle" size="xs">
            di {formatCurrency(budget.amount)}
          </Text>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={cardStyles.budget.progress}>
        <div className={progressBarVariants({ status })}>
          <div className={progressFillVariants({ status })} style={getBudgetProgressStyle(progress)} />
        </div>
      </div>
    </button>
  );
});
