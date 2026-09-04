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
import { Amount } from '@/components/ui/primitives/amount';
import { HomeSectionCard } from '@/components/home';
import { PageFab, SectionHeader } from '@/components/layout';
import { Link } from '@/i18n/routing';
import {
  stitchDashboardGroupedList,
  stitchHome,
  stitchRecurring,
  stitchSurface,
} from '@/styles/home-design-foundation';
import { buildRecurringView } from '@/lib/recurring/recurring-view';
import { cn, type AmountVariants } from '@/lib/utils';
import { User } from '@/lib/types';

type RecurringStatCard = {
  label: string;
  Icon: typeof Banknote;
  itemClass: string;
  iconWrap: string;
  iconClass: string;
  valueClass: string;
  amount: number;
  amountType: NonNullable<AmountVariants['type']>;
};

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
  readonly viewAllHref?: string | undefined;
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
  viewAllHref,
}: RecurringSeriesSectionProps) {
  const t = useTranslations('Recurring.Section');

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
    monthlySeries,
    yearlySeries,
    pausedSeries,
    monthlyTotals,
    totalMonthlyRecurring,
  } = view;

  const monthlyStats = useMemo(() => {
    const summaryCard: RecurringStatCard =
      totalMonthlyRecurring < 0
        ? {
            label: t('summary.netOutflowLabel'),
            Icon: TrendingDown,
            itemClass: stitchRecurring.statMiniItemDestructive,
            iconWrap: stitchRecurring.statMiniIconWrapDestructive,
            iconClass: stitchRecurring.statMiniIconDestructive,
            valueClass: stitchRecurring.statMiniValueDestructive,
            // Show absolute value — "Uscita netta" + red color already communicate direction
            amount: Math.abs(totalMonthlyRecurring),
            amountType: 'expense',
          }
        : totalMonthlyRecurring > 0
          ? {
              label: t('summary.netInflowLabel'),
              Icon: TrendingUp,
              itemClass: stitchRecurring.statMiniItemSuccess,
              iconWrap: stitchRecurring.statMiniIconWrapSuccess,
              iconClass: stitchRecurring.statMiniIconSuccess,
              valueClass: stitchRecurring.statMiniValueSuccess,
              amount: totalMonthlyRecurring,
              amountType: 'income',
            }
          : {
              label: t('summary.totalMonthlyLabel'),
              Icon: Banknote,
              itemClass: stitchRecurring.statMiniItemPrimary,
              iconWrap: stitchRecurring.statMiniIconWrap,
              iconClass: stitchRecurring.statMiniIcon,
              valueClass: stitchRecurring.statMiniValuePrimary,
              amount: totalMonthlyRecurring,
              amountType: 'neutral',
            };

    return [
      {
        label: t('stats.expensesPerMonth'),
        Icon: TrendingDown,
        itemClass: stitchRecurring.statMiniItemDestructive,
        iconWrap: stitchRecurring.statMiniIconWrapDestructive,
        iconClass: stitchRecurring.statMiniIconDestructive,
        valueClass: stitchRecurring.statMiniValueDestructive,
        amount: monthlyTotals.totalExpenses,
        amountType: 'expense' as const,
      },
      {
        label: t('stats.incomePerMonth'),
        Icon: TrendingUp,
        itemClass: stitchRecurring.statMiniItemSuccess,
        iconWrap: stitchRecurring.statMiniIconWrapSuccess,
        iconClass: stitchRecurring.statMiniIconSuccess,
        valueClass: stitchRecurring.statMiniValueSuccess,
        amount: monthlyTotals.totalIncome,
        amountType: 'income' as const,
      },
      summaryCard,
    ];
  }, [t, totalMonthlyRecurring, monthlyTotals.totalIncome, monthlyTotals.totalExpenses]);

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
      <PageFab
        onClick={onCreateRecurringSeries}
        ariaLabel={t('empty.addButton')}
        testId="recurring-fab-add"
      />
    );
  };

  const renderSeriesCard = (item: (typeof filteredSeries)[number]) => (
    <SeriesCard
      series={item}
      daysUntilDue={item.daysUntilDue}
      showDelete={showDelete}
      onEdit={onEditRecurringSeries}
      onCardClick={onCardClick}
      onDelete={onDeleteRecurringSeries}
      onPause={onPauseRecurringSeries}
    />
  );

  const renderSeriesList = (items: typeof filteredSeries) => (
    <ul className={cn(stitchDashboardGroupedList, 'm-0 list-none p-0')}>
      {items.map((item) => (
        <li key={item.id}>{renderSeriesCard(item)}</li>
      ))}
    </ul>
  );

  const viewAllAction =
    viewAllHref && filteredSeries.length > 0 ? (
      <Link href={viewAllHref} className={stitchHome.viewAllLink}>
        {t('viewAll')}
      </Link>
    ) : undefined;

  const renderSeriesGroup = (label: string, items: typeof filteredSeries) => {
    if (items.length === 0) return null;
    return (
      <div className={stitchRecurring.groupSection}>
        <h3 className={stitchRecurring.groupLabel}>{label}</h3>
        <div className={stitchRecurring.groupCard}>
          <div className={stitchRecurring.listStack}>{renderSeriesList(items)}</div>
        </div>
      </div>
    );
  };

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
          <SectionHeader
            title={t('title')}
            subtitle={t('subtitle.seriesCount', { count: visibleSeriesCount })}
            className="pb-1"
            titleClassName={stitchHome.sectionHeaderTitle}
            subtitleClassName={stitchHome.sectionHeaderSubtitle}
            actions={viewAllAction}
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
        <SectionHeader
          title={t('title')}
          subtitle={renderSubtitle()}
          className="pb-1"
          titleClassName={stitchHome.sectionHeaderTitle}
          subtitleClassName={stitchHome.sectionHeaderSubtitle}
          actions={viewAllAction}
        />

        {renderSeriesList(filteredSeries)}

        {renderFooter()}
      </HomeSectionCard>
    );
  }

  return (
    <div className={cn(stitchRecurring.relativeWrap, className)}>
      <div className={stitchRecurring.summaryCard}>
        <div className={stitchRecurring.summaryTopRow}>
          <div className={stitchRecurring.summaryHeaderLeft}>
            <div className={stitchRecurring.summaryIconWrap}>
              <RefreshCw className={stitchRecurring.summaryIcon} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className={stitchRecurring.summaryTitle}>{t('title')}</h2>
              <p className={stitchRecurring.summarySubtitle}>{renderSubtitle()}</p>
            </div>
          </div>
        </div>

        {showStats && filteredSeries.length > 0 ? (
          <div className={stitchRecurring.statMiniGrid}>
            {monthlyStats.map((stat) => (
              <div key={stat.label} className={cn(stitchRecurring.statMiniItem, stat.itemClass)}>
                <div className={stitchRecurring.statMiniHeader}>
                  <div className={stat.iconWrap}>
                    <stat.Icon className={stat.iconClass} aria-hidden />
                  </div>
                  <p className={stitchRecurring.statMiniLabel}>{stat.label}</p>
                </div>
                <Amount
                  type={stat.amountType}
                  size="sm"
                  emphasis="strong"
                  currency
                  className={stat.valueClass}
                >
                  {stat.amount}
                </Amount>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {renderSeriesGroup(t('groups.upcoming'), upcomingSeries)}
      {renderSeriesGroup(t('groups.monthly'), monthlySeries)}
      {renderSeriesGroup(t('groups.yearly'), yearlySeries)}
      {renderSeriesGroup(t('groups.paused'), pausedSeries)}

      {renderFooter()}
      {renderFab()}
    </div>
  );
}

export default RecurringSeriesSection;
