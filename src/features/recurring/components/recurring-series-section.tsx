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
import { Button, CategoryBadge, Text } from '@/components/ui';
import { HomeSectionCard } from '@/components/home';
import { SectionHeader } from '@/components/layout';
import { stitchHome } from '@/styles/home-design-foundation';
import {
  calculateDaysUntilDue,
  calculateMonthlyTotalAbs,
  calculateRecurringTotals,
} from '@/lib/recurring/recurring-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import { User } from '@/lib/types';
const recurringStyles = {
  section: {
    container: 'rounded-xl',
    emptyWrap: 'p-6',
    emptyActionIcon: 'h-4 w-4 mr-2',
    header:
      'rounded-2xl border border-border/25 bg-card/85 p-3.5 shadow-[0_12px_28px_rgba(0,7,30,0.22)]',
    headerRow: 'flex items-center justify-between',
    headerLeft: 'flex items-center gap-2',
    headerIconWrap:
      'flex size-10 items-center justify-center rounded-full border border-border/35 bg-muted/85',
    headerIcon: 'h-4 w-4 text-primary',
    title: 'text-2xl font-bold tracking-tight text-primary',
    subtitle: 'mt-1 text-sm text-muted-foreground',
    subtitleMuted: 'text-muted-foreground',
    stats: 'mt-3 grid grid-cols-1 gap-2 border-t border-border/20 pt-3 sm:grid-cols-3',
    statRow:
      'flex items-center justify-between gap-3 rounded-full border border-border/30 bg-muted/75 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
    statLeft: 'flex items-center gap-2 min-w-0',
    statIconWrapNeutral:
      'flex size-7 shrink-0 items-center justify-center rounded-full border border-border/35 bg-accent',
    statIconNeutral: 'h-3.5 w-3.5 text-primary',
    statValueNeutral: 'text-[1.85rem] font-semibold leading-none tabular-nums text-foreground',
    statIconWrapPositive:
      'flex size-7 items-center justify-center rounded-full border border-teal-accent/35 bg-teal-accent/15',
    statIconPositive: 'h-3.5 w-3.5 text-income',
    statIconWrapNegative:
      'flex size-7 items-center justify-center rounded-full border border-destructive/35 bg-destructive/15',
    statIconNegative: 'h-3.5 w-3.5 text-expense',
    statLabel: 'text-sm text-muted-foreground',
    statValuePositive: 'text-[1.85rem] font-semibold leading-none tabular-nums text-income',
    statValueNegative: 'text-[1.85rem] font-semibold leading-none tabular-nums text-expense',
    list: '',
    /** Home desktop: griglia al posto della lista verticale stretta. */
    listLayoutHome: 'grid grid-cols-1 md:grid-cols-2 md:gap-4 md:divide-y-0 xl:grid-cols-3 py-2',
    listLayoutPage: 'space-y-2.5',
    /** overflow-hidden: clip figli (SwipeableCard + Card rounded-none) al raggio del contenitore. */
    cardCellHome:
      'min-w-0 md:overflow-hidden md:rounded-xl md:border md:border-border/55 md:bg-card/60 md:shadow-sm',
    cardCellPage: 'min-w-0',
    listDivider: 'border-t border-primary/20 mx-2',
    footer: 'px-4 py-1.5',
    footerText: 'text-xs text-primary text-center',
    executeErrorBanner:
      'mx-2 mt-2 shrink-0 motion-reduce:animate-none motion-reduce:opacity-100 animate-in fade-in slide-in-from-top-1 duration-200',
  },
  form: {
    form: 'space-y-4',
    errorWrap: 'mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20',
    errorText: 'text-sm text-destructive',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-4',
  },
  formModal: {
    form: 'space-y-2',
    content: 'gap-2',
    error: 'px-3 py-2 text-sm text-destructive bg-destructive/10 rounded-md',
    section: 'gap-2',
    grid: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  },
  pauseModal: {
    container: 'space-y-4',
    card: 'rounded-lg bg-card/10 p-4 border border-primary/10',
    title: 'text-sm font-medium text-primary mb-2',
    description: 'text-sm text-muted-foreground space-y-2',
    descriptionStrong: 'font-medium',
    buttonIcon: 'mr-2 h-4 w-4',
    loadingIcon: 'mr-2 h-4 w-4 animate-spin',
  },
} as const;

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
    );
  };

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
              {pausedCount > 0 && <> • {t('subtitle.pausedCount', { count: pausedCount })}</>}
            </>
          }
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
        />

        {renderExecuteErrorBanner()}

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

        {showStats && filteredSeries.length > 0 ? (
          <div className={recurringStyles.section.stats}>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapNeutral}>
                  <Banknote className={recurringStyles.section.statIconNeutral} aria-hidden />
                </div>
                <p className={recurringStyles.section.statLabel}>
                  {t('summary.totalMonthlyLabel')}
                </p>
              </div>
              <p className={recurringStyles.section.statValueNeutral}>
                {formatCurrency(totalMonthlyRecurring)}
              </p>
            </div>
            <div className={recurringStyles.section.statRow}>
              <div className={recurringStyles.section.statLeft}>
                <div className={recurringStyles.section.statIconWrapPositive}>
                  <TrendingUp className={recurringStyles.section.statIconPositive} aria-hidden />
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
                  <TrendingDown className={recurringStyles.section.statIconNegative} aria-hidden />
                </div>
                <p className={recurringStyles.section.statLabel}>{t('stats.expensesPerMonth')}</p>
              </div>
              <p className={recurringStyles.section.statValueNegative}>
                -{formatCurrency(monthlyTotals.totalExpenses)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {renderExecuteErrorBanner()}

      {/* Series List */}
      <div className="space-y-4">
        <div>
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('groups.upcoming')}
          </p>
          <div className={cn(recurringStyles.section.list, 'mt-2')}>
            <div className={recurringStyles.section.listLayoutPage}>
              {upcomingSeries.length === 0 ? (
                <div className={stitchHome.emptyWell}>{t('groups.upcomingEmpty')}</div>
              ) : (
                upcomingSeries.map((item) => (
                  <div key={item.id} className={recurringStyles.section.cardCellPage}>
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
                      onExecuteError={handleExecuteError}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t('groups.paid')}
          </p>
          <div className={cn(recurringStyles.section.list, 'mt-2')}>
            <div className={recurringStyles.section.listLayoutPage}>
              {paidSeries.length === 0 ? (
                <div className={stitchHome.emptyWell}>{t('groups.paidEmpty')}</div>
              ) : (
                paidSeries.map((item) => (
                  <div key={item.id} className={recurringStyles.section.cardCellPage}>
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
                      onExecuteError={handleExecuteError}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
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
