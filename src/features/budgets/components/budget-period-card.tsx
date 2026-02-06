'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Trash2 } from 'lucide-react';
import type { BudgetPeriod } from '@/lib/types';
import { Button, Badge } from '@/components/ui';
import { toDateTime } from '@/lib/utils/date-utils';
import { budgetStyles } from '@/styles/system';

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
  const t = useTranslations('Budgets.PeriodCard');
  const locale = useLocale();

  // Format date for display
  const formatDate = (date: string | Date | null) => {
    if (!date) return '—';
    const dt = toDateTime(date);
    if (!dt) return t('invalidDate');
    return dt.toFormat('d LLL yyyy', { locale: locale.split('-')[0] });
  };

  // Format currency (EUR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Get top 3 categories by spending (if available)
  const topCategories = categorySpending
    ? Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
    : [];

  // Determine if period is active
  const isActive = period.is_active && !period.end_date;

  return (
    <div className={budgetStyles.periodCard.container}>
      {/* Header with dates and status */}
      <div className={budgetStyles.periodCard.header}>
        <div className={budgetStyles.periodCard.headerContent}>
          <p className={budgetStyles.periodCard.title}>
            {formatDate(period.start_date)}
            {period.end_date && (
              <>
                <span className={budgetStyles.periodCard.arrow}>→</span>
                {formatDate(period.end_date)}
              </>
            )}
          </p>
          <Badge
            variant={isActive ? 'default' : 'secondary'}
            className={
              isActive ? budgetStyles.periodCard.badgeActive : budgetStyles.periodCard.badge
            }
          >
            {isActive ? t('status.inProgress') : t('status.closed')}
          </Badge>
        </div>

        {/* Delete action */}
        {showActions && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className={budgetStyles.periodCard.deleteButton}
            title={t('deleteTitle')}
          >
            <Trash2 className={budgetStyles.periodCard.deleteIcon} />
          </Button>
        )}
      </div>

      {/* Financial Metrics */}
      {(totalSpent !== undefined || totalSaved !== undefined) && (
        <div className={budgetStyles.periodCard.metricsGrid}>
          {/* Total Spent */}
          {totalSpent !== undefined && (
            <div className={budgetStyles.periodCard.metricSpent}>
              <p className={budgetStyles.periodCard.metricLabelSpent}>{t('metrics.spent')}</p>
              <p className={budgetStyles.periodCard.metricValueSpent}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          )}

          {/* Total Saved */}
          {totalSaved !== undefined && (
            <div className={budgetStyles.periodCard.metricSaved}>
              <p className={budgetStyles.periodCard.metricLabelSaved}>{t('metrics.saved')}</p>
              <p className={budgetStyles.periodCard.metricValueSaved}>
                {formatCurrency(totalSaved)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Categories */}
      {topCategories.length > 0 && (
        <div className={budgetStyles.periodCard.categorySection}>
          <p className={budgetStyles.periodCard.categoryTitle}>{t('topCategories')}</p>
          <div className={budgetStyles.periodCard.categoryList}>
            {topCategories.map(([category, amount]) => (
              <div key={category} className={budgetStyles.periodCard.categoryRow}>
                <span className={budgetStyles.periodCard.categoryLabel}>{category}</span>
                <span className={budgetStyles.periodCard.categoryAmount}>
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

// Export with displayName for debugging
BudgetPeriodCard.displayName = 'BudgetPeriodCard';
