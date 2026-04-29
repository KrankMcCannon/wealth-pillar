'use client';

/**
 * RecurringSeriesSection - Display recurring transaction series
 *
 * Shows a list of recurring series with filtering and actions.
 * Data is passed from parent component (Server Component pattern).
 */

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { RecurringTransactionSeries } from '@/lib';
import { SeriesCard } from '@/components/cards';
import { EmptyState } from '@/components/shared';
import { CircleAlert, RefreshCw, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, CategoryBadge, Text } from '@/components/ui';
import { HomeSectionCard } from '@/components/home';
import { SectionHeader } from '@/components/layout';
import { stitchHome } from '@/styles/home-design-foundation';
import {
  calculateDaysUntilDue,
  calculateRecurringTotals,
} from '@/lib/recurring/recurring-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { recurringStyles } from '../theme/recurring-styles';

interface RecurringSeriesSectionProps {
  /** All recurring series data */
  readonly series: RecurringTransactionSeries[];
  /** Filter series by user ID (optional) */
  readonly selectedUserId?: string | undefined;
  /** Additional CSS classes */
  readonly className?: string;
  /** Maximum number of items to display */
  readonly maxItems?: number;
  /** Show action buttons on each series card */
  readonly showActions?: boolean;
  /** Show statistics header */
  readonly showStats?: boolean;
  /** Show delete icon on each series card */
  readonly showDelete?: boolean;
  /** Callback when create button is clicked */
  readonly onCreateRecurringSeries?: () => void;
  /** Callback when edit button is clicked (modale) */
  readonly onEditRecurringSeries?: (series: RecurringTransactionSeries) => void;
  /** Callback when card is clicked (navigazione) - se definito, sovrascrive onEditRecurringSeries per il click */
  readonly onCardClick?: (series: RecurringTransactionSeries) => void;
  /** Callback when delete icon is clicked */
  readonly onDeleteRecurringSeries?: (series: RecurringTransactionSeries) => void;
  /** Callback when pause icon is clicked */
  readonly onPauseRecurringSeries?: (series: RecurringTransactionSeries) => void;
  /** Group users for badge display on cards */
  readonly groupUsers?: User[];
  /** Callback when series is updated (pause/resume) to refresh UI */
  readonly onSeriesUpdate?: (series: RecurringTransactionSeries) => void;
  /** Home dashboard: card in griglia su md+ invece che colonna unica stretta. */
  readonly homeDashboardListLayout?: boolean;
}

export function RecurringSeriesSection({
  series,
  selectedUserId,
  className = '',
  maxItems,
  showActions = false,
  showStats = false,
  showDelete = false,
  onCreateRecurringSeries,
  onEditRecurringSeries,
  onCardClick,
  onDeleteRecurringSeries,
  onPauseRecurringSeries,
  groupUsers,
  onSeriesUpdate,
  homeDashboardListLayout = false,
}: RecurringSeriesSectionProps) {
  const t = useTranslations('Recurring.Section');
  const tSeriesCard = useTranslations('Recurring.SeriesCard');
  const [executeErrorMessage, setExecuteErrorMessage] = useState<string | null>(null);

  const handleExecuteError = useCallback((message: string) => {
    setExecuteErrorMessage(message);
  }, []);

  const getDueLabel = useCallback(
    (seriesItem: RecurringTransactionSeries) => {
      const days = calculateDaysUntilDue(seriesItem);
      if (days === 0) return tSeriesCard('due.today');
      if (days === 1) return tSeriesCard('due.tomorrow');
      if (days < 0) return tSeriesCard('due.daysAgo', { count: Math.abs(days) });
      return tSeriesCard('due.inDays', { count: days });
    },
    [tSeriesCard]
  );

  // Filter series by user if selected
  const filteredSeries = useMemo(() => {
    let result = series;

    // Filter by user (check if user is in user_ids array)
    if (selectedUserId) {
      result = result.filter((s) => s.user_ids.includes(selectedUserId));
    }

    // Sort by days left (ascending)
    result = result.slice().sort((a, b) => calculateDaysUntilDue(a) - calculateDaysUntilDue(b));

    // Limit results if maxItems specified
    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [series, selectedUserId, maxItems]);

  // Get active series only for count
  const activeSeries = useMemo(() => {
    return filteredSeries.filter((s) => s.is_active);
  }, [filteredSeries]);
  const visibleSeriesCount = useMemo(() => {
    return selectedUserId
      ? series.filter((s) => s.user_ids.includes(selectedUserId)).length
      : series.length;
  }, [selectedUserId, series]);
  const pausedCount = filteredSeries.length - activeSeries.length;

  // Calculate monthly totals using service method
  const monthlyTotals = useMemo(() => {
    return calculateRecurringTotals(activeSeries);
  }, [activeSeries]);

  // Empty state
  if (filteredSeries.length === 0) {
    if (homeDashboardListLayout) {
      return (
        <HomeSectionCard className={className}>
          <SectionHeader
            title={t('title')}
            subtitle={t('subtitle.seriesCount', { count: visibleSeriesCount })}
            className="pb-1"
            titleClassName={stitchHome.sectionHeaderTitle}
            subtitleClassName={stitchHome.sectionHeaderSubtitle}
          />
          <EmptyState
            icon={RefreshCw}
            title={t('empty.title')}
            description={selectedUserId ? t('empty.forUser') : t('empty.defaultDescription')}
            action={
              onCreateRecurringSeries && (
                <Button onClick={onCreateRecurringSeries} variant="default" size="sm">
                  <Plus className={recurringStyles.section.emptyActionIcon} />
                  {t('empty.addButton')}
                </Button>
              )
            }
          />
        </HomeSectionCard>
      );
    }
    return (
      <div className={cn(recurringStyles.section.emptyWrap, className)}>
        <EmptyState
          icon={RefreshCw}
          title={t('empty.title')}
          description={selectedUserId ? t('empty.forUser') : t('empty.defaultDescription')}
          action={
            onCreateRecurringSeries && (
              <Button onClick={onCreateRecurringSeries} variant="default" size="sm">
                <Plus className={recurringStyles.section.emptyActionIcon} />
                {t('empty.addButton')}
              </Button>
            )
          }
        />
      </div>
    );
  }

  if (homeDashboardListLayout) {
    return (
      <HomeSectionCard className={className}>
        <SectionHeader
          title={t('title')}
          subtitle={
            <>
              {t('subtitle.seriesCount', { count: visibleSeriesCount })}
              {pausedCount > 0 && (
                <>
                  {' '}
                  • {t('subtitle.pausedCount', { count: pausedCount })}
                </>
              )}
            </>
          }
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
        />

        {executeErrorMessage ? (
          <Alert
            variant="destructive"
            className={recurringStyles.section.executeErrorBanner}
            role="status"
            aria-live="polite"
          >
            <CircleAlert className="size-4" aria-hidden />
            <AlertTitle>{t('executeErrorBannerTitle')}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">{executeErrorMessage}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => setExecuteErrorMessage(null)}
              >
                {t('executeErrorDismiss')}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-col gap-2">
          {filteredSeries.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (onCardClick ? onCardClick(item) : onEditRecurringSeries?.(item))}
              className={stitchHome.listRow}
            >
              <div className="flex min-w-0 items-center gap-3">
                <CategoryBadge categoryKey={item.category} size="md" />
                <div className="min-w-0">
                  <p className={stitchHome.rowTitle}>{item.description}</p>
                  <p className={stitchHome.rowMeta}>{getDueLabel(item)}</p>
                </div>
              </div>
              <p
                className={cn(
                  'shrink-0 text-sm font-semibold tabular-nums',
                  item.type === 'income' ? stitchHome.amountIncome : stitchHome.amountExpense
                )}
              >
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(Math.abs(item.amount))}
              </p>
            </button>
          ))}
        </div>

        {maxItems && series.length > maxItems ? (
          <div className="px-1 py-1">
            <p className={`text-center text-xs ${stitchHome.sectionHeaderSubtitle}`}>
              {t('footer.showingOf', {
                shown: filteredSeries.length,
                total: visibleSeriesCount,
              })}
            </p>
          </div>
        ) : null}
      </HomeSectionCard>
    );
  }

  return (
    <div className={cn(recurringStyles.section.container, className)}>
      {/* Header Section */}
      <div className={recurringStyles.section.header}>
        <div className={recurringStyles.section.headerRow}>
          <div className={recurringStyles.section.headerLeft}>
            <div className={recurringStyles.section.headerIconWrap}>
              <RefreshCw className={recurringStyles.section.headerIcon} />
            </div>
            <div>
              <Text variant="primary" size="md" as="h3" className={recurringStyles.section.title}>
                {t('title')}
              </Text>
              <Text variant="primary" size="xs" className={recurringStyles.section.subtitle}>
                {t('subtitle.seriesCount', { count: visibleSeriesCount })}
                {pausedCount > 0 && (
                  <span className={recurringStyles.section.subtitle}>
                    {' '}
                    • {t('subtitle.pausedCount', { count: pausedCount })}
                  </span>
                )}
              </Text>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        {showStats && activeSeries.length > 0 && (
          <div className={recurringStyles.section.stats}>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapPositive}>
                  <TrendingUp className={recurringStyles.section.statIconPositive} />
                </div>
                <p className={recurringStyles.section.statLabel}>{t('stats.incomePerMonth')}</p>
              </div>
              <p className={recurringStyles.section.statValuePositive}>
                +{formatCurrency(monthlyTotals.totalIncome)}
              </p>
            </div>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapNegative}>
                  <TrendingDown className={recurringStyles.section.statIconNegative} />
                </div>
                <p className={recurringStyles.section.statLabel}>{t('stats.expensesPerMonth')}</p>
              </div>
              <p className={recurringStyles.section.statValueNegative}>
                -{formatCurrency(monthlyTotals.totalExpenses)}
              </p>
            </div>
          </div>
        )}
      </div>

      {executeErrorMessage ? (
        <Alert
          variant="destructive"
          className={recurringStyles.section.executeErrorBanner}
          role="status"
          aria-live="polite"
        >
          <CircleAlert className="size-4" aria-hidden />
          <AlertTitle>{t('executeErrorBannerTitle')}</AlertTitle>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="min-w-0">{executeErrorMessage}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setExecuteErrorMessage(null)}
            >
              {t('executeErrorDismiss')}
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Series List */}
      <div className={cn(recurringStyles.section.list, 'rounded-t-none border-0 shadow-none')}>
        <div className={recurringStyles.section.listLayoutHome}>
          {filteredSeries.map((item) => (
            <div key={item.id} className={recurringStyles.section.cardCellHome}>
              <SeriesCard
                series={item}
                embedded
                showActions={showActions}
                showDelete={showDelete}
                onEdit={onEditRecurringSeries}
                onCardClick={onCardClick}
                onDelete={onDeleteRecurringSeries}
                onPause={onPauseRecurringSeries}
                groupUsers={groupUsers}
                onSeriesUpdate={onSeriesUpdate}
                onExecuteError={handleExecuteError}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Show More Link (if truncated) */}
      {maxItems && series.length > maxItems && (
        <div>
          <div className={recurringStyles.section.listDivider} />
          <div className={recurringStyles.section.footer}>
            <p className={recurringStyles.section.footerText}>
              {t('footer.showingOf', {
                shown: filteredSeries.length,
                total: visibleSeriesCount,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecurringSeriesSection;
