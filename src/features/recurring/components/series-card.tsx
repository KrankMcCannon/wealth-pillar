/**
 * SeriesCard - Domain row for recurring transaction series (mobile-first)
 */

'use client';

import { memo, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import type { RecurringTransactionSeries } from '@/lib';
import { getCategoryColor } from '@/server/use-cases/categories/category.logic';
import { calculateDaysUntilDue } from '@/lib/recurring/recurring-calculations';
import { Pause, Play, Trash2 } from 'lucide-react';
import { Button, CategoryBadge, StatusBadge } from '@/components/ui';
import { RowCard } from '@/components/ui/layout/row-card';
import { stitchHome } from '@/styles/home-design-foundation';
import { transactionStyles } from '@/features/transactions/theme/transaction-styles';
import { formatCurrency } from '@/lib/utils';
import { useCategories } from '@/stores/reference-data-store';
import { SwipeableCard } from '@/components/ui/interactions/swipeable-card';
import { useCloseAllCards } from '@/stores/swipe-state-store';

interface SeriesCardProps {
  readonly series: RecurringTransactionSeries;
  readonly daysUntilDue?: number | undefined;
  readonly className?: string | undefined;
  readonly showDelete?: boolean | undefined;
  readonly onEdit?: ((series: RecurringTransactionSeries) => void) | undefined;
  readonly onCardClick?: ((series: RecurringTransactionSeries) => void) | undefined;
  readonly onDelete?: ((series: RecurringTransactionSeries) => void) | undefined;
  readonly onPause?: ((series: RecurringTransactionSeries) => void) | undefined;
}

function getFrequencyLabel(frequency: string, t: ReturnType<typeof useTranslations>): string {
  switch (frequency) {
    case 'weekly':
      return t('frequency.weekly');
    case 'biweekly':
      return t('frequency.biweekly');
    case 'monthly':
      return t('frequency.monthly');
    case 'yearly':
      return t('frequency.yearly');
    default:
      return frequency;
  }
}

function getDueDateLabel(days: number, t: ReturnType<typeof useTranslations>): string {
  if (days === 0) return t('due.today');
  if (days === 1) return t('due.tomorrow');
  if (days < 0) return t('due.daysAgo', { count: Math.abs(days) });
  return t('due.inDays', { count: days });
}

function SeriesCardInner({
  series,
  daysUntilDue: daysUntilDueProp,
  className,
  showDelete = false,
  onEdit,
  onCardClick,
  onDelete,
  onPause,
}: SeriesCardProps) {
  const t = useTranslations('Recurring.SeriesCard');
  const closeAllCards = useCloseAllCards();
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return getCategoryColor(categories, series.category);
  }, [categories, series.category]);

  const daysUntilDue = daysUntilDueProp ?? calculateDaysUntilDue(series);
  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isDueSoon = daysUntilDue <= 3;
  const canSwipeDelete = Boolean(onDelete) && showDelete;
  const canSwipePause = Boolean(onPause);

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(series);
    } else {
      onEdit?.(series);
    }
  };

  const handleSwipeDelete = () => {
    closeAllCards();
    onDelete?.(series);
  };

  const handleSwipePause = () => {
    closeAllCards();
    onPause?.(series);
  };

  const getAmountType = (): 'income' | 'expense' | 'neutral' => {
    if (!series.is_active) return 'neutral';
    return series.type === 'income' ? 'income' : 'expense';
  };

  const amountType = getAmountType();
  const valueClassName =
    amountType === 'income'
      ? stitchHome.amountIncome
      : amountType === 'expense'
        ? stitchHome.amountExpense
        : 'text-muted-foreground';

  const urgencyRingClass = cn(
    isOverdue && 'ring-1 ring-inset ring-expense/35',
    isDueToday && 'ring-1 ring-inset ring-amber-400/40',
    isDueSoon && !isDueToday && !isOverdue && 'ring-1 ring-inset ring-border/30'
  );

  const metadata = (
    <>
      <span className={stitchHome.rowMeta}>{getFrequencyLabel(series.frequency, t)}</span>
      <span className={transactionStyles.transactionRow.separator}>•</span>
      <span className={stitchHome.rowMeta}>{getDueDateLabel(daysUntilDue, t)}</span>
      {!series.is_active ? (
        <>
          <span className={transactionStyles.transactionRow.separator}>•</span>
          <StatusBadge status="info" size="sm">
            {t('status.stopped')}
          </StatusBadge>
        </>
      ) : null}
    </>
  );

  const pauseDeleteActions =
    canSwipePause || canSwipeDelete ? (
      <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {canSwipePause ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-11 min-h-11 min-w-11 rounded-md p-0 hover:bg-primary/10"
            onClick={handleSwipePause}
            aria-label={series.is_active ? t('actions.pauseAria') : t('actions.resumeAria')}
            title={series.is_active ? t('actions.pause') : t('actions.resume')}
          >
            {series.is_active ? <Pause aria-hidden /> : <Play aria-hidden />}
          </Button>
        ) : null}
        {canSwipeDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-11 min-h-11 min-w-11 rounded-md p-0 hover:bg-expense/12"
            onClick={handleSwipeDelete}
            aria-label={t('actions.deleteAria')}
            title={t('actions.delete')}
          >
            <Trash2 className="text-expense" aria-hidden />
          </Button>
        ) : null}
      </div>
    ) : null;

  const row = (
    <RowCard
      icon={<CategoryBadge categoryKey={series.category} color={categoryColor} size="md" />}
      iconSize="sm"
      iconColor="none"
      iconClassName="!rounded-full !bg-transparent !p-0 !shadow-none ring-0"
      title={series.description}
      titleClassName={stitchHome.rowTitle}
      metadata={metadata}
      primaryValue={formatCurrency(Math.abs(Number(series.amount)))}
      amountVariant={
        amountType === 'income' ? 'success' : amountType === 'expense' ? 'destructive' : 'primary'
      }
      valueClassName={valueClassName}
      actions={pauseDeleteActions}
      rightLayout={pauseDeleteActions ? 'row' : 'stack'}
      variant="regular"
      onClick={canSwipeDelete || canSwipePause ? undefined : handleCardClick}
      className={cn(
        stitchHome.listRowInteractive,
        'w-full',
        !series.is_active && 'opacity-60',
        urgencyRingClass,
        className
      )}
      testId={`recurring-series-row-${series.id}`}
    />
  );

  if (canSwipeDelete || canSwipePause) {
    return (
      <SwipeableCard
        id={`series-${series.id}`}
        leftAction={
          canSwipePause
            ? {
                label: series.is_active ? t('actions.pause') : t('actions.resume'),
                variant: series.is_active ? 'pause' : 'resume',
                onAction: handleSwipePause,
              }
            : undefined
        }
        rightAction={
          canSwipeDelete
            ? {
                label: t('actions.delete'),
                variant: 'delete',
                onAction: handleSwipeDelete,
              }
            : undefined
        }
        onCardClick={handleCardClick}
      >
        {row}
      </SwipeableCard>
    );
  }

  return row;
}

export const SeriesCard = memo(SeriesCardInner);
export default SeriesCard;
