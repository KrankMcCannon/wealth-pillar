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
import { SeriesCard } from './series-card';
import { EmptyState } from '@/components/shared';
import { Banknote, Plus, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui';
import { Amount } from '@/components/ui/primitives/amount';
import { HomeSectionCard } from '@/components/home';
import { SectionHeader } from '@/components/layout';
import {
  stitchDashboardGroupedList,
  stitchFab,
  stitchHome,
  stitchRecurring,
  stitchSurface,
} from '@/styles/home-design-foundation';
import { buildRecurringView } from '@/lib/recurring/recurring-view';
import { cn } from '@/lib/utils';
import { User } from '@/lib/types';

interface RecurringSeriesSectionProps {
  readonly series: RecurringTransactionSeries[];
  readonly selectedUserId?: string | undefined;
  readonly className?: string;
  readonly maxItems?: number;
  readonly showDelete?: boolean;
  readonly showStats?: boolean;
  readonly onCreateRecurringSeries?: () => void;
  readonly onEditRecurringSeries?: (series: RecurringTransactionSeries) => void;
  readonly onCardClick?: (series: RecurringTransactionSeries) => void;
  readonly onDeleteRecurringSeries?: (series: RecurringTransactionSeries) => void;
  readonly onPauseRecurringSeries?: (series: RecurringTransactionSeries) => void;
  readonly groupUsers?: User[];
  readonly homeDashboardListLayout?: boolean;
}

export function RecurringSeriesSection({
  series,
  selectedUserId,
  className = '',
  maxItems,
  showStats = false,
  showDelete = false,
  onCreateRecurringSeries,
  onEditRecurringSeries,
  onCardClick,
  onDeleteRecurringSeries,
  onPauseRecurringSeries,
  homeDashboardListLayout = false,
}: RecurringSeriesSectionProps) {
  const t = useTranslations('Recurring.Section');
  const tHome = useTranslations('HomeContent');

  const view = useMemo(
    () =>
      buildRecurringView(series, {
        ...(selectedUserId ? { selectedUserId } : {}),
        ...(maxItems ? { maxItems } : {}),
      }),
    [series, selectedUserId, maxItems]
  );

  const {
    filteredSeries,
    visibleSeriesCount,
    pausedCount,
    upcomingSeries,
    monthlyTotals,
    totalMonthlyRecurring,
  } = view;

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
        <Plus className={stitchFab.pageAddIcon} aria-hidden />
      </Button>
    );
  };

  const renderSeriesCard = (item: (typeof filteredSeries)[number]) => (
    <SeriesCard
      key={item.id}
      series={item}
      daysUntilDue={item.daysUntilDue}
      showDelete={showDelete}
      onEdit={onEditRecurringSeries}
      onCardClick={onCardClick}
      onDelete={onDeleteRecurringSeries}
      onPause={onPauseRecurringSeries}
    />
  );

  const renderSeriesGroup = (label: string, items: typeof filteredSeries, emptyMessage: string) => (
    <div className={stitchRecurring.groupSection}>
      <p className={stitchRecurring.groupLabel}>{label}</p>
      <div className={stitchRecurring.groupCard}>
        <div className={stitchRecurring.listStack}>
          {items.length === 0 ? (
            <div className={stitchHome.emptyWell}>{emptyMessage}</div>
          ) : (
            items.map(renderSeriesCard)
          )}
        </div>
      </div>
    </div>
  );

  const renderFooter = () => {
    if (!maxItems || series.length <= maxItems) return null;
    return (
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
    );
  };

  const renderSubtitle = () => (
    <>
      {t('subtitle.seriesCount', { count: visibleSeriesCount })}
      {pausedCount > 0 && <> • {t('subtitle.pausedCount', { count: pausedCount })}</>}
    </>
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
          subtitle={renderSubtitle()}
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
        />

        <div className={stitchDashboardGroupedList}>{filteredSeries.map(renderSeriesCard)}</div>

        {renderFooter()}
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
            <p className={stitchRecurring.summarySubtitle}>{renderSubtitle()}</p>
          </div>
        </div>

        {showStats && filteredSeries.length > 0 ? (
          <div className={stitchRecurring.statsGrid}>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemPrimary)}>
              <div className={stitchRecurring.statIconWrap}>
                <Banknote className={stitchRecurring.statIcon} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('summary.totalMonthlyLabel')}</p>
              <Amount
                type="neutral"
                size="md"
                emphasis="strong"
                className={stitchRecurring.statValue}
              >
                {totalMonthlyRecurring}
              </Amount>
            </div>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemSuccess)}>
              <div className={stitchRecurring.statIconWrapSuccess}>
                <TrendingUp className={stitchRecurring.statIconSuccess} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('stats.incomePerMonth')}</p>
              <Amount
                type="income"
                size="md"
                emphasis="strong"
                className={stitchRecurring.statValueSuccess}
              >
                {monthlyTotals.totalIncome}
              </Amount>
            </div>
            <div className={cn(stitchRecurring.statItem, stitchRecurring.statItemDestructive)}>
              <div className={stitchRecurring.statIconWrapDestructive}>
                <TrendingDown className={stitchRecurring.statIconDestructive} aria-hidden />
              </div>
              <p className={stitchRecurring.statLabel}>{t('stats.expensesPerMonth')}</p>
              <Amount
                type="expense"
                size="md"
                emphasis="strong"
                className={stitchRecurring.statValueDestructive}
              >
                {-monthlyTotals.totalExpenses}
              </Amount>
            </div>
          </div>
        ) : null}
      </div>

      {renderSeriesGroup(t('groups.upcoming'), upcomingSeries, t('groups.upcomingEmpty'))}

      {renderFooter()}
      {renderFab()}
    </div>
  );
}

export default RecurringSeriesSection;
