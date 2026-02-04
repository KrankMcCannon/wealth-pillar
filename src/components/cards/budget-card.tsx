/**
 * BudgetCard - Domain card for budgets
 */

'use client';

import { memo, useMemo } from 'react';
import { CategoryBadge, StatusBadge, Text } from '@/components/ui';
import type { Budget } from '@/lib';
import { progressBarVariants, progressFillVariants } from '@/lib';
import { formatCurrency } from '@/lib/utils/currency-formatter';
import { cardStyles, getBudgetProgressStyle, getBudgetStatusTextClass } from './theme/card-styles';
import { useCategories } from '@/stores/reference-data-store';
import { FinanceLogicService } from '@/server/services/finance-logic.service';

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

export const BudgetCard = memo(function BudgetCard({
  budget,
  budgetInfo,
  onClick,
}: BudgetCardProps) {
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return FinanceLogicService.getCategoryColor(categories, budget.categories?.[0] || 'altro');
  }, [categories, budget.categories]);
  // Status calculation (centralized logic)
  const getStatusVariant = (progress: number): 'success' | 'warning' | 'danger' => {
    if (progress >= 100) return 'danger';
    if (progress >= 80) return 'warning';
    return 'success';
  };

  // Get text color class based on status
  const remaining = budgetInfo?.remaining ?? budget.amount;
  const progress = budgetInfo?.progress || 0;
  const status = getStatusVariant(progress);

  return (
    <button
      className={cardStyles.budget.container}
      onClick={onClick}
      data-testid={`budget-card-${budget.id}`}
    >
      <div className={cardStyles.budget.row}>
        <div className={cardStyles.budget.left}>
          <CategoryBadge
            categoryKey={budget.categories?.[0] || 'altro'}
            color={categoryColor}
            size="md"
          />

          <div className={cardStyles.budget.content}>
            {/* Budget title */}
            <Text variant="primary" size="sm" className={cardStyles.budget.title}>
              {budget.description}
            </Text>

            {/* Progress badge */}
            <StatusBadge
              status={status}
              size="sm"
              showDot
              className={cardStyles.budget.statusBadge}
            >
              {Math.round(progress)}%
            </StatusBadge>
          </div>
        </div>

        <div className={cardStyles.budget.right}>
          {/* Remaining amount */}
          <Text variant="emphasis" size="sm" className={getBudgetStatusTextClass(status)}>
            {formatCurrency(remaining)}
          </Text>
          <div className="flex flex-col items-end">
            <Text variant="subtle" size="xs">
              su {formatCurrency(budget.amount)}
            </Text>
            {budgetInfo && (
              <Text variant="subtle" size="xs" className="text-muted-foreground/70">
                Spesi: {formatCurrency(budgetInfo.spent)}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={cardStyles.budget.progress}>
        <div className={progressBarVariants({ status })}>
          <div
            className={progressFillVariants({ status })}
            style={getBudgetProgressStyle(progress)}
          />
        </div>
      </div>
    </button>
  );
});
