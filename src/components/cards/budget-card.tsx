/**
 * BudgetCard - Domain card for budgets
 */

'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { CategoryBadge, StatusBadge, Text } from '@/components/ui';
import type { Budget } from '@/lib';
import { progressBarVariants, progressFillVariants } from '@/lib';
import { formatCurrency } from '@/lib/utils/currency-formatter';
import { cn } from '@/lib/utils';
import { cardStyles, getBudgetProgressStyle, getBudgetStatusTextClass } from './theme/card-styles';
import { useCategories } from '@/stores/reference-data-store';
import { getCategoryColor } from '@/server/use-cases/categories/category.logic';

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
  const t = useTranslations('Budgets.Card');
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return getCategoryColor(categories, budget.categories?.[0] || 'altro');
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
            {/* Budget title - Improved mobile visibility */}
            <h4 className="font-bold text-[14px] sm:text-[16px] leading-snug text-primary/90 line-clamp-3 mb-1.5 wrap-break-word">
              {budget.description}
            </h4>

            {/* Progress badge */}
            <div className="flex items-center gap-2">
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
        </div>

        <div className={cardStyles.budget.right}>
          {/* Remaining amount */}
          <div className="flex flex-col items-end gap-0.5">
            <Text
              variant="subtle"
              size="xs"
              className="uppercase tracking-wider font-semibold leading-none text-muted-foreground"
              style={{ fontSize: '9px' }}
            >
              {status === 'danger' ? t('exceededTitle') : t('remainingTitle')}
            </Text>
            <Text
              variant="emphasis"
              size="sm"
              className={cn(getBudgetStatusTextClass(status), 'leading-none font-black')}
            >
              {formatCurrency(Math.abs(remaining))}
            </Text>
          </div>

          {/* Speso · Totale compact inline */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-semibold">
              {t('spentPrefix')}{' '}
              <span className="text-primary/70 font-bold">
                {formatCurrency(budgetInfo?.spent ?? 0)}
              </span>
            </span>
            <span className="text-muted-foreground/40 text-[8px]">·</span>
            <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-semibold">
              {t('totalPrefix')}{' '}
              <span className="text-primary/80 font-bold">{formatCurrency(budget.amount)}</span>
            </span>
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
