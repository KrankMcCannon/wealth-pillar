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
import { SeriesCard } from './series-card';
import { EmptyState } from '@/components/shared';
import { Banknote, CircleAlert, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui';
import { HomeSectionCard } from '@/components/home';
import { SectionHeader } from '@/components/layout';
import {
  stitchDashboardGroupedList,
  stitchFab,
  stitchHome,
  stitchRecurring,
  stitchSurface,
} from '@/styles/home-design-foundation';
import {
  calculateDaysUntilDue,
  calculateMonthlyTotalAbs,
  calculateRecurringTotals,
} from '@/lib/recurring/recurring-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import { User } from '@/lib/types';

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
  const tHome = useTranslations('HomeContent');
  const [executeErrorMessage, setExecuteErrorMessage] = useState<string | null>(null);

  const handleExecuteError = useCallback((message: string) => {
    setExecuteErrorMessage(message);
  }, []);

  const filteredSeries = useMemo(() => {
    let result = series;

    if (selectedUserId) {
      result = result.filter((s) => s.user_ids.includes(selectedUserId));
    }

    result = result.slice().sort((a, b) => calculateDaysUntilDue(a) - calculateDaysUntilDue(b));

    if (maxItems && maxItems > 0) {
      result = result.slice(0, maxItems);
    }

    return result;
  }, [series, selectedUserId, maxItems]);

  const activeSeries = useMemo(() => {
    return filteredSeries.filter((s) => s.is_active);
  }, [filteredSeries]);
  const visibleSeriesCount = useMemo(() => {
    return selectedUserId
      ? series.filter((s) => s.user_ids.includes(selectedUserId)).length
      : series.length;
  }, [selectedUserId, series]);
  const pausedCount = filteredSeries.length - activeSeries.length;

  const monthlyTotals = useMemo(() => {
    return calculateRecurringTotals(activeSeries);
  }, [activeSeries]);

  const upcomingSeries = useMemo(
    () => filteredSeries.filter((item) => item.is_active && calculateDaysUntilDue(item) >= 0),
    [filteredSeries]
  );
  const paidSeries = useMemo(
    () => filteredSeries.filter((item) => !item.is_active || calculateDaysUntilDue(item) < 0),
    [filteredSeries]
  );
  const totalMonthlyRecurring = useMemo(
    () => calculateMonthlyTotalAbs(activeSeries),
    [activeSeries]
  );

  const renderExecuteErrorBanner = () => {
    if (!executeErrorMessage) return null;
    return (
      <Alert
        variant="destructive"
        className={stitchRecurring.executeErrorBanner}
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
    );
  };

  const renderPageEmptyState = () => (
    <div className={cn(stitchRecurring.emptyState, className)} role="status" aria-live="polite">
      <p className={stitchRecurring.emptyTitle}>{t('empty.title')}</p>
      <p className={stitchRecurring.emptyDescription}>
        {selectedUserId ? t('empty.forUser') : t('empty.defaultDescription')}
      </p>
      {onCreateRecurringSeries ? (
        <div className={stitchRecurring.emptyActions}>
          <button
            type="button"
            onClick={onCreateRecurringSeries}
            className={stitchRecurring.emptyCtaPrimary}
          >
            {t('empty.addButton')}
          </button>
        </div>
      ) : null}
    </div>
  );

  const renderFab = () => {
    if (!onCreateRecurringSeries || filteredSeries.length === 0) return null;
    return (
      <Button
        type="button"
        variant="default"
        size="icon"
        data-testid="recurring-fab-add"
        onClick={onCreateRecurringSeries}
        className={stitchFab.pageAdd}
        aria-label={t('empty.addButton')}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </Button>
    );
  };

  const renderSeriesGroup = (
    label: string,
    items: RecurringTransactionSeries[],
    emptyMessage: string
  ) => (
    <div className={stitchRecurring.groupSection}>
      <p className={stitchRecurring.groupLabel}>{label}</p>
      <div className={stitchRecurring.groupCard}>
        <div className={stitchRecurring.listStack}>
          {items.length === 0 ? (
            <div className={stitchHome.emptyWell}>{emptyMessage}</div>
          ) : (
            items.map((item) => (
              <SeriesCard
                key={item.id}
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
            ))
          )}
        </div>
      </div>
    </div>
  );

  if (filteredSeries.length === 0) {
    if (homeDashboardListLayout) {
      return (
        <HomeSectionCard className={className}>
          <p className={stitchHome.sectionEyebrow}>{tHome('recurringAsideLabel')}</p>
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
                <button
                  type="button"
                  onClick={onCreateRecurringSeries}
                  className={stitchSurface.primaryCta}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('empty.addButton')}
                </button>
              )
            }
          />
        </HomeSectionCard>
      );
    }
    return renderPageEmptyState();
  }

  if (homeDashboardListLayout) {
    return (
      <HomeSectionCard className={className}>
        <p className={stitchHome.sectionEyebrow}>{tHome('recurringAsideLabel')}</p>
        <SectionHeader
          title={t('title')}
          subtitle={
            <>
              {t('subtitle.seriesCount', { count: visibleSeriesCount })}
              {pausedCount > 0 && <> • {t('subtitle.pausedCount', { count: pausedCount })}</>}
            </>
          }
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
        />

        {renderExecuteErrorBanner()}

        <div className={stitchDashboardGroupedList}>
          {filteredSeries.map((item) => (
            <SeriesCard
              key={item.id}
              series={item}
              embedded
              showActions={showActions}
              showDelete={showDelete}
              onEdit={onEditRecurringSeries}
              onCardClick={onCardClick}
              onPause={onPauseRecurringSeries}
              onDelete={onDeleteRecurringSeries}
              groupUsers={groupUsers}
              onSeriesUpdate={onSeriesUpdate}
              onExecuteError={handleExecuteError}
            />
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
    <div className={cn(stitchRecurring.relativeWrap, className)}>
      <div className={stitchRecurring.summaryCard}>
        <div className={stitchRecurring.summaryHeaderRow}>
          <div className={stitchRecurring.summaryIconWrap}>
            <RefreshCw className={stitchRecurring.summaryIcon} aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className={stitchRecurring.summaryTitle}>{t('title')}</h3>
            <p className={stitchRecurring.summarySubtitle}>
              {t('subtitle.seriesCount', { count: visibleSeriesCount })}
              {pausedCount > 0 && <> • {t('subtitle.pausedCount', { count: pausedCount })}</>}
            </p>
          </div>
        </div>

        {showStats && filteredSeries.length > 0 ? (
          <div className={stitchRecurring.statsGrid}>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemPrimary)}>
              <div className={stitchRecurring.statIconWrap}>
                <Banknote className={stitchRecurring.statIcon} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('summary.totalMonthlyLabel')}</p>
              <p className={stitchRecurring.statValue}>{formatCurrency(totalMonthlyRecurring)}</p>
            </div>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemSuccess)}>
              <div className={stitchRecurring.statIconWrapSuccess}>
                <TrendingUp className={stitchRecurring.statIconSuccess} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('stats.incomePerMonth')}</p>
              <p className={stitchRecurring.statValueSuccess}>
                +{formatCurrency(monthlyTotals.totalIncome)}
              </p>
            </div>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemDestructive)}>
              <div className={stitchRecurring.statIconWrapDestructive}>
                <TrendingDown className={stitchRecurring.statIconDestructive} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('stats.expensesPerMonth')}</p>
              <p className={stitchRecurring.statValueDestructive}>
                -{formatCurrency(monthlyTotals.totalExpenses)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {renderExecuteErrorBanner()}

      {renderSeriesGroup(t('groups.upcoming'), upcomingSeries, t('groups.upcomingEmpty'))}
      {renderSeriesGroup(t('groups.paid'), paidSeries, t('groups.paidEmpty'))}

      {maxItems && series.length > maxItems ? (
        <div>
          <div className={stitchRecurring.footerDivider} />
          <div className={stitchRecurring.footer}>
            <p className={stitchRecurring.footerText}>
              {t('footer.showingOf', {
                shown: filteredSeries.length,
                total: visibleSeriesCount,
              })}
            </p>
          </div>
        </div>
      ) : null}

      {renderFab()}
    </div>
  );
}

export default RecurringSeriesSection;
