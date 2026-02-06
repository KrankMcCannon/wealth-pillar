/**
 * BudgetDisplayCard Component
 * Shows selected budget with icon, name, period, and actions menu
 */

'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Button,
  CategoryBadge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import { Budget, BudgetPeriod } from '@/lib';
import { budgetStyles } from '@/styles/system';
import { formatCurrency } from '@/lib/utils/currency-formatter';
import { formatDateShort, toDateTime } from '@/lib/utils/date-utils';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useCategories } from '@/stores/reference-data-store';
import { FinanceLogicService } from '@/server/services/finance-logic.service';

export interface BudgetDisplayCardProps {
  budget: Budget | null;
  period: BudgetPeriod | null;
  budgetProgress: {
    spent: number;
    remaining: number;
    percentage: number;
    amount: number;
  } | null;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetDisplayCard({
  budget,
  period,
  budgetProgress,
  onEdit,
  onDelete,
}: Readonly<BudgetDisplayCardProps>) {
  const t = useTranslations('Budgets.DisplayCard');
  const locale = useLocale();
  const categories = useCategories();
  const categoryColor = FinanceLogicService.getCategoryColor(
    categories,
    budget?.categories?.[0] || 'altro'
  );
  const remainingColorClass =
    budgetProgress && budgetProgress.remaining < 0 ? 'text-destructive' : 'text-success';

  if (!budget) return null;

  const periodStart = period ? toDateTime(period.start_date) : null;
  const periodEnd = period?.end_date ? toDateTime(period.end_date) : null;
  const periodStartLabel = periodStart ? formatDateShort(periodStart, locale) : '';
  const periodEndLabel = periodEnd ? formatDateShort(periodEnd, locale) : t('period.inProgress');

  return (
    <div className={budgetStyles.budgetDisplay.container}>
      {/* Budget Actions Dropdown - Top Right Corner */}
      <div className={budgetStyles.budgetDisplay.actionsMenu}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={budgetStyles.budgetDisplay.actionsButton}
              title={t('actions.title')}
            >
              <MoreVertical className={budgetStyles.budgetDisplay.actionIcon} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className={budgetStyles.dropdownMenu.contentWide}>
            <DropdownMenuItem
              className={`${budgetStyles.dropdownMenu.itemBase} ${budgetStyles.dropdownMenu.itemEdit}`}
              onSelect={() => onEdit(budget)}
            >
              <Pencil
                className={`${budgetStyles.budgetDisplay.actionIcon} ${budgetStyles.dropdownMenu.itemIcon}`}
              />
              {t('actions.edit')}
            </DropdownMenuItem>

            <DropdownMenuItem
              className={`${budgetStyles.dropdownMenu.itemBase} ${budgetStyles.dropdownMenu.itemDelete}`}
              onSelect={() => onDelete(budget)}
            >
              <Trash2
                className={`${budgetStyles.budgetDisplay.actionIcon} ${budgetStyles.dropdownMenu.itemIcon}`}
              />
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Budget Icon, Name and Period */}
      <div className={budgetStyles.budgetDisplay.headerRow}>
        <div className={budgetStyles.budgetDisplay.headerContent}>
          <div className={budgetStyles.budgetDisplay.iconContainer}>
            <CategoryBadge
              categoryKey={budget.categories?.[0] || 'altro'}
              color={categoryColor}
              size="sm"
              className={budgetStyles.budgetDisplay.iconClass}
            />
          </div>
          <div className={budgetStyles.budgetDisplay.iconText}>
            <h3 className={budgetStyles.budgetDisplay.budgetName}>{budget.description}</h3>
            <p className={budgetStyles.budgetDisplay.budgetStatus}>{t('status.active')}</p>
          </div>
        </div>

        {/* Budget Period Date */}
        {period && (
          <div className={budgetStyles.budgetDisplay.periodContainer}>
            <p className={budgetStyles.budgetDisplay.periodLabel}>{t('period.label')}</p>
            <p className={budgetStyles.budgetDisplay.periodValue}>
              {periodStartLabel} - {periodEndLabel}
            </p>
          </div>
        )}
      </div>

      {/* Budget Metrics - Balances */}
      {budgetProgress && (
        <div className={budgetStyles.metrics.container}>
          {/* Total Budget */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} text-primary`}>{t('metrics.total')}</p>
            <p className={`${budgetStyles.metrics.value} text-primary`}>
              {formatCurrency(budgetProgress.amount)}
            </p>
          </div>

          {/* Spent Amount */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} text-destructive`}>{t('metrics.spent')}</p>
            <p className={`${budgetStyles.metrics.value} ${budgetStyles.metrics.valueDanger}`}>
              {formatCurrency(budgetProgress.spent)}
            </p>
          </div>

          {/* Available Amount */}
          <div className={budgetStyles.metrics.item}>
            <p className={`${budgetStyles.metrics.label} ${remainingColorClass}`}>
              {t('metrics.available')}
            </p>
            <p className={`${budgetStyles.metrics.value} ${remainingColorClass}`}>
              {formatCurrency(budgetProgress.remaining)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
