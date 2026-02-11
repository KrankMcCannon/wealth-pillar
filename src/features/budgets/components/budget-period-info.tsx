'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui';
import { BudgetPeriod } from '@/lib';
import { toDateTime } from '@/lib/utils/date-utils';
import { Calendar, Clock } from 'lucide-react';
import { budgetStyles } from '@/styles/system';

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
  className = '',
  showSpending = true,
  totalSpent,
  totalSaved,
  categorySpending,
}: Readonly<BudgetPeriodInfoProps>) {
  const t = useTranslations('Budgets.PeriodInfo');
  const locale = useLocale();

  const formatDate = (date: string | Date | null) => {
    if (!date) return '—';
    const dt = toDateTime(date);
    if (!dt) return t('invalidDate');
    return dt.toFormat('d LLL yyyy', { locale: locale.split('-')[0] });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  if (!period) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <p className={budgetStyles.periodInfo.emptyText}>{t('empty.noActivePeriod')}</p>
      </div>
    );
  }

  const isCurrentPeriod = period.is_active && !period.end_date;
  const startLabel = formatDate(period.start_date);
  const endLabel = period.end_date ? formatDate(period.end_date) : t('inProgress');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Period Status and Dates */}
      <div className={budgetStyles.periodInfo.headerRow}>
        <div className={budgetStyles.periodInfo.headerLeft}>
          <Calendar className={budgetStyles.periodInfo.headerIcon} />
          <span className={budgetStyles.periodInfo.headerText}>
            {startLabel} - {endLabel}
          </span>
        </div>

        <Badge
          variant={isCurrentPeriod ? 'default' : 'secondary'}
          className={budgetStyles.periodInfo.badge}
        >
          {isCurrentPeriod ? (
            <>
              <Clock className={budgetStyles.periodInfo.badgeIcon} />
              {t('status.active')}
            </>
          ) : (
            t('status.completed')
          )}
        </Badge>
      </div>

      {/* Spending Summary */}
      {showSpending && (totalSpent !== undefined || totalSaved !== undefined) && (
        <div className={budgetStyles.periodInfo.metricsGrid}>
          {totalSpent !== undefined && (
            <div className={budgetStyles.periodInfo.metricSpent}>
              <p className={budgetStyles.periodInfo.metricLabelSpent}>{t('metrics.spent')}</p>
              <p className={budgetStyles.periodInfo.metricValueSpent}>
                {formatCurrency(totalSpent)}
              </p>
            </div>
          )}

          {totalSaved !== undefined && (
            <div className={budgetStyles.periodInfo.metricSaved}>
              <p className={budgetStyles.periodInfo.metricLabelSaved}>{t('metrics.saved')}</p>
              <p className={budgetStyles.periodInfo.metricValueSaved}>
                {formatCurrency(totalSaved)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown (if available) */}
      {categorySpending && Object.keys(categorySpending).length > 0 && (
        <div className={budgetStyles.periodInfo.topCategories}>
          <p className={budgetStyles.periodInfo.topCategoriesTitle}>{t('topCategories')}</p>
          <div className={budgetStyles.periodInfo.topCategoriesList}>
            {Object.entries(categorySpending)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([category, amount]) => (
                <div key={category} className={budgetStyles.periodInfo.topCategoryRow}>
                  <span className={budgetStyles.periodInfo.topCategoryLabel}>
                    {category.replaceAll('_', ' ')}
                  </span>
                  <span className={budgetStyles.periodInfo.topCategoryAmount}>
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
