/**
 * SeriesCard - Domain card for recurring transaction series
 */

'use client';

import { memo, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib';
import type { RecurringTransactionSeries } from '@/lib';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import type { User } from '@/lib/types';
import { executeRecurringSeriesAction } from '@/features/recurring';
import { Pause, Play, Trash2 } from 'lucide-react';
import { Amount, Button, Card, CategoryBadge, StatusBadge, Text } from '@/components/ui';
import { cardStyles, getSeriesCardClassName, getSeriesUserBadgeStyle } from './theme/card-styles';
import { useCategories } from '@/stores/reference-data-store';
import { SwipeableCard } from '@/components/ui/interactions/swipeable-card';
import { useCloseAllCards } from '@/stores/swipe-state-store';
import { toast } from '@/hooks/use-toast';

interface SeriesCardProps {
  readonly series: RecurringTransactionSeries;
  /** Superficie piatta dentro contenitore con bordo/raggio (liste e griglia ricorrenze). */
  readonly embedded?: boolean | undefined;
  readonly className?: string | undefined;
  readonly showActions?: boolean | undefined;
  readonly showDelete?: boolean | undefined;
  /** Callback quando si clicca per modificare (modale) */
  readonly onEdit?: ((series: RecurringTransactionSeries) => void) | undefined;
  /** Callback quando si clicca sulla card (navigazione o altro) - se definito, sovrascrive onEdit per il click */
  readonly onCardClick?: ((series: RecurringTransactionSeries) => void) | undefined;
  readonly onDelete?: ((series: RecurringTransactionSeries) => void) | undefined;
  /** Callback quando si mette in pausa/riprende la serie */
  readonly onPause?: ((series: RecurringTransactionSeries) => void) | undefined;
  readonly onSeriesUpdate?: ((series: RecurringTransactionSeries) => void) | undefined;
  /** Group users for displaying user badges */
  readonly groupUsers?: User[] | undefined;
  /** Errore esecuzione manuale (toast + eventuale banner dal genitore). */
  readonly onExecuteError?: ((message: string) => void) | undefined;
}

// Helper function: Get frequency label
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

// Helper function: Get due date label
function getDueDateLabel(days: number, t: ReturnType<typeof useTranslations>): string {
  if (days === 0) return t('due.today');
  if (days === 1) return t('due.tomorrow');
  if (days < 0) return t('due.daysAgo', { count: Math.abs(days) });
  return t('due.inDays', { count: days });
}

function SeriesCardInner({
  series,
  embedded = false,
  className,
  showActions = false,
  showDelete = false,
  onEdit,
  onCardClick,
  onDelete,
  onPause,
  onSeriesUpdate,
  groupUsers,
  onExecuteError,
}: SeriesCardProps) {
  const t = useTranslations('Recurring.SeriesCard');
  const tSection = useTranslations('Recurring.Section');
  const [isLoading, setIsLoading] = useState(false);
  const closeAllCards = useCloseAllCards();
  const categories = useCategories();
  const categoryColor = useMemo(() => {
    return FinanceLogicService.getCategoryColor(categories, series.category);
  }, [categories, series.category]);
  const canSwipeDelete = Boolean(onDelete) && showDelete;
  const canSwipePause = showActions;

  // Calculate due date info using FinanceLogicService
  const daysUntilDue = FinanceLogicService.calculateDaysUntilDue(series);
  const isOverdue = daysUntilDue < 0;
  const isDueToday = daysUntilDue === 0;
  const isDueSoon = daysUntilDue <= 3;

  // Get associated users for badge display
  const associatedUsers = useMemo(() => {
    if (!groupUsers) return [];
    // Ensure theme_color is compatible (string | undefined) vs (string | null)
    const sanitizedGroupUsers = groupUsers.map((u) => ({
      ...u,
      theme_color: u.theme_color || undefined,
    }));
    return FinanceLogicService.getAssociatedUsers(series, sanitizedGroupUsers);
  }, [series, groupUsers]);

  // Handle card click - use onCardClick if defined, otherwise fall back to onEdit
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(series);
    } else {
      onEdit?.(series);
    }
  };

  const executeSeries = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await executeRecurringSeriesAction(series.id);
      if (result.error) {
        toast({
          title: tSection('executeErrorToastTitle'),
          description: result.error,
          variant: 'destructive',
        });
        onExecuteError?.(result.error);
        return;
      }
      if (!result.error && result.data) {
        onSeriesUpdate?.(series);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : tSection('executeErrorUnknown');
      toast({
        title: tSection('executeErrorToastTitle'),
        description: message,
        variant: 'destructive',
      });
      onExecuteError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers
  const handleExecute = (e: React.MouseEvent) => {
    e.stopPropagation();
    executeSeries();
  };

  // Action handlers with swipe close-first pattern
  const handleSwipeDelete = () => {
    closeAllCards();
    onDelete?.(series);
  };

  const handleSwipePause = () => {
    closeAllCards();
    onPause?.(series);
  };

  const handleDesktopPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPause?.(series);
  };

  const handleDesktopDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(series);
  };

  const getAmountType = (): 'income' | 'expense' | 'neutral' => {
    if (!series.is_active) return 'neutral';
    return series.type === 'income' ? 'income' : 'expense';
  };

  const cardContent = (
    <Card
      className={cn(
        getSeriesCardClassName({ isActive: series.is_active, isOverdue, isDueToday, isDueSoon }),
        embedded && cardStyles.series.embedded,
        className
      )}
      onClick={canSwipeDelete || canSwipePause ? undefined : handleCardClick}
    >
      <div className={cardStyles.series.layout}>
        {/* Left Section: Icon + Content */}
        <div className={cardStyles.series.left}>
          <CategoryBadge
            categoryKey={series.category}
            color={categoryColor}
            size="md"
            className={cardStyles.series.icon}
          />

          <div className={cardStyles.series.content}>
            <div className={cardStyles.series.titleRow}>
              <Text variant="primary" size="sm" as="h3" className={cardStyles.series.title}>
                {series.description}
              </Text>
              {!series.is_active && (
                <StatusBadge status="info" size="sm">
                  {t('status.stopped')}
                </StatusBadge>
              )}
            </div>
            <div className={cardStyles.series.details}>
              <Text variant="body" size="xs" className={cardStyles.series.frequency}>
                {getFrequencyLabel(series.frequency, t)}
              </Text>

              {/* User badges - show if multiple users */}
              {associatedUsers.length > 1 && (
                <div className={cardStyles.series.userBadges} aria-hidden="true">
                  {associatedUsers.slice(0, 3).map((user) => (
                    <div
                      key={user.id}
                      className={cardStyles.series.userBadge}
                      style={getSeriesUserBadgeStyle(user.theme_color)}
                      title={user.name}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {associatedUsers.length > 3 && (
                    <span className={cardStyles.series.userBadgeOverflow}>
                      +{associatedUsers.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Amount + Actions */}
        <div className={cardStyles.series.right}>
          <Amount type={getAmountType()} size="md" emphasis="strong">
            {series.type === 'income' ? series.amount : -series.amount}
          </Amount>
          <Text variant="body" size="xs" className={cardStyles.series.dueDate}>
            {t('nextLabel')}: {getDueDateLabel(daysUntilDue, t)}
          </Text>

          {(showActions || canSwipePause || canSwipeDelete) && (
            <div className={cn(cardStyles.series.actions, 'flex-wrap justify-end')}>
              {showActions && series.is_active ? (
                <>
                  {(isDueToday || isOverdue) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${cardStyles.series.actionButton} ${cardStyles.series.actionPrimary}`}
                      onClick={handleExecute}
                      disabled={isLoading}
                    >
                      <Play
                        className={`${cardStyles.series.actionIcon} ${cardStyles.series.actionIconAccent}`}
                      />
                    </Button>
                  )}
                </>
              ) : null}
              {(canSwipePause || canSwipeDelete) && (
                <div
                  className="flex shrink-0 items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canSwipePause ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`${cardStyles.series.actionButton} ${cardStyles.series.actionNeutral}`}
                      onClick={handleDesktopPause}
                      aria-label={
                        series.is_active ? t('actions.pauseAria') : t('actions.resumeAria')
                      }
                      title={series.is_active ? t('actions.pause') : t('actions.resume')}
                    >
                      {series.is_active ? (
                        <Pause className={cardStyles.series.actionIcon} />
                      ) : (
                        <Play className={cardStyles.series.actionIcon} />
                      )}
                    </Button>
                  ) : null}
                  {canSwipeDelete ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className={`${cardStyles.series.actionButton} ${cardStyles.series.actionDestructive}`}
                      onClick={handleDesktopDelete}
                      aria-label={t('actions.deleteAria')}
                      title={t('actions.delete')}
                    >
                      <Trash2 className={cardStyles.series.actionIcon} />
                    </Button>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
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
        {cardContent}
      </SwipeableCard>
    );
  }

  return cardContent;
}

export const SeriesCard = memo(SeriesCardInner);
export default SeriesCard;
