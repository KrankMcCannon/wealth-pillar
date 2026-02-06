'use client';

/**
 * RecurringSeriesSection - Display recurring transaction series
 *
 * Shows a list of recurring series with filtering and actions.
 * Data is passed from parent component (Server Component pattern).
 */

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { RecurringTransactionSeries } from '@/lib';
import { SeriesCard } from '@/components/cards';
import { EmptyState } from '@/components/shared';
import { RefreshCw, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { Button, Text } from '@/components/ui';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import { formatCurrency, cn } from '@/lib/utils';
import { User } from '@/lib/types';
import { recurringStyles } from '../theme/recurring-styles';
import { accountStyles } from '@/features/accounts/theme/account-styles';
import { transactionStyles } from '@/styles/system';

interface RecurringSeriesSectionProps {
  /** All recurring series data */
  readonly series: RecurringTransactionSeries[];
  /** Filter series by user ID (optional) */
  readonly selectedUserId?: string;
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
}: RecurringSeriesSectionProps) {
  const t = useTranslations('Recurring.Section');

  // Filter series by user if selected
  const filteredSeries = useMemo(() => {
    let result = series;

    // Filter by user (check if user is in user_ids array)
    if (selectedUserId) {
      result = result.filter((s) => s.user_ids.includes(selectedUserId));
    }

    // Sort by days left (ascending)
    result = result
      .slice()
      .sort(
        (a, b) =>
          FinanceLogicService.calculateDaysUntilDue(a) -
          FinanceLogicService.calculateDaysUntilDue(b)
      );

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
    return FinanceLogicService.calculateTotals(activeSeries);
  }, [activeSeries]);

  // Empty state
  if (filteredSeries.length === 0) {
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

      {/* Series List */}
      <div
        className={cn(
          recurringStyles.section.list,
          accountStyles.accountsList.groupCard,
          'rounded-t-none border-0 shadow-none'
        )}
      >
        <div className={transactionStyles.groupedCard.rowContainer}>
          {filteredSeries.map((item) => (
            <div key={item.id} className={accountStyles.list.cardWrapper}>
              <SeriesCard
                series={item}
                showActions={showActions}
                showDelete={showDelete}
                onEdit={onEditRecurringSeries}
                onCardClick={onCardClick}
                onDelete={onDeleteRecurringSeries}
                onPause={onPauseRecurringSeries}
                groupUsers={groupUsers}
                onSeriesUpdate={onSeriesUpdate}
                className="rounded-none border-0 shadow-none"
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
