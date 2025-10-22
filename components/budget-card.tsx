"use client";

import { CategoryIcon, iconSizes } from '@/lib/icons';
import { formatCurrency } from "@/lib/utils";
import { Budget } from "@/lib/types";
import { IconContainer, StatusBadge, Text } from "@/components/ui/primitives";
import { progressBarVariants, progressFillVariants } from "@/lib/ui-variants";

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

export function BudgetCard({ budget, budgetInfo, onClick }: BudgetCardProps) {
  // Using centralized variants instead of inline logic
  const getStatusVariant = (progress: number): "success" | "warning" | "danger" => {
    if (progress >= 100) return 'danger';
    if (progress >= 80) return 'warning';
    return 'success';
  };

  const remaining = budgetInfo?.remaining || budget.amount;

  return (
    <div
      className="px-3 py-2 hover:bg-accent/10 transition-colors duration-200 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3 flex-1">
          {/* Icon Container - Using primitive */}
          <IconContainer size="md" color="primary">
            <CategoryIcon
              categoryKey={budget.categories?.[0] || 'altro'}
              size={iconSizes.md}
            />
          </IconContainer>

          <div className="flex-1">
            {/* Budget title - Using Text primitive */}
            <Text
              variant="heading"
              size="sm"
              className="truncate max-w-[140px] sm:max-w-[160px] mb-1"
            >
              {budget.description}
            </Text>

            {/* Progress badge - Using StatusBadge primitive */}
            <StatusBadge
              status={getStatusVariant(budgetInfo?.progress || 0)}
              size="sm"
              showDot
              className="w-fit"
            >
              {Math.round(budgetInfo?.progress || 0)}%
            </StatusBadge>
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-2">
          {/* Amount displays - Using Text primitives */}
          <Text
            variant="emphasis"
            size="sm"
            className={getStatusVariant(budgetInfo?.progress || 0) === 'success' ? 'text-success' : getStatusVariant(budgetInfo?.progress || 0) === 'warning' ? 'text-warning' : 'text-destructive'}
          >
            {formatCurrency(remaining)}
          </Text>
          <Text variant="subtle" size="xs">
            di {formatCurrency(budget.amount)}
          </Text>
        </div>
      </div>

      {/* Progress Bar - Using centralized variants */}
      <div className="relative">
        <div className={progressBarVariants({ status: getStatusVariant(budgetInfo?.progress || 0) })}>
          <div
            className={progressFillVariants({ status: getStatusVariant(budgetInfo?.progress || 0) })}
            style={{ width: `${Math.min(budgetInfo?.progress || 0, 100)}%` }}
          />
        </div>
      </div>

    </div>
  );
}
