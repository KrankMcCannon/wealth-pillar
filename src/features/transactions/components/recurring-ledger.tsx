'use client';

import { use, useMemo, useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { HomeDashboardMain, PageFab } from '@/components/layout';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import { RecurringSeriesSkeleton } from '@/features/transactions/components/transaction-skeletons';
import { buildRecurringView, type DecoratedRecurringSeries } from '@/lib/recurring/recurring-view';
import { calculateMonthlyAmount } from '@/lib/recurring/recurring-calculations';
import { formatCurrency, cn } from '@/lib/utils';
import type { RecurringTransactionSeries } from '@/lib/types';
import { stitchHome, stitchTransactions } from '@/styles/home-design-foundation';
import { CompactSegments, FilterDock, PeopleChips } from './filter-dock';
import { PageTabsBar, StickyTotal } from './sticky-total';
import type { RecurringLedgerProps } from './transactions-workspace-props';

type StatusFilter = 'all' | 'active' | 'paused';

export function RecurringLedgerWithSeries({
  seriesPromise,
  ...props
}: Omit<RecurringLedgerProps, 'series'> & {
  seriesPromise: Promise<RecurringTransactionSeries[]>;
}) {
  const series = use(seriesPromise);
  return <RecurringLedger {...props} series={series} />;
}

export function RecurringLedger(props: RecurringLedgerProps) {
  const tLedger = useTranslations('TransactionsContent.Ledger');
  const tSection = useTranslations('Recurring.Section');
  const tCard = useTranslations('Recurring.SeriesCard');
  const tUsers = useTranslations('UserSelector');
  const [status, setStatus] = useState<StatusFilter>('all');

  const view = useMemo(
    () =>
      buildRecurringView(props.series, {
        ...(props.selectedUserId ? { selectedUserId: props.selectedUserId } : {}),
      }),
    [props.series, props.selectedUserId]
  );

  const visible = useMemo(() => {
    if (status === 'active') return view.filteredSeries.filter((item) => item.is_active);
    if (status === 'paused') return view.filteredSeries.filter((item) => !item.is_active);
    return view.filteredSeries;
  }, [status, view.filteredSeries]);
  const upcoming = useMemo(() => {
    const ids = new Set(view.upcomingSeries.map((item) => item.id));
    return visible.filter((item) => ids.has(item.id));
  }, [visible, view.upcomingSeries]);
  const rest = useMemo(() => {
    const ids = new Set(upcoming.map((item) => item.id));
    return visible.filter((item) => !ids.has(item.id));
  }, [visible, upcoming]);

  const activeCount = view.filteredSeries.filter((item) => item.is_active).length;
  const pausedCount = view.filteredSeries.length - activeCount;
  const spend = view.monthlyTotals.totalExpenses;
  const earn = view.monthlyTotals.totalIncome;
  const net = view.monthlyTotals.netMonthly;
  const emptyDescription = props.selectedUserId
    ? tSection('empty.forUser')
    : tSection('empty.defaultDescription');

  return (
    <>
      <PageTabsBar>{props.tabs}</PageTabsBar>
      <StickyTotal>
        <section aria-labelledby="recurring-net-label">
          <p
            id="recurring-net-label"
            className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
          >
            {tLedger('monthlyNet')}
          </p>
          <p
            className={cn(
              'mt-1 text-[32px] font-semibold tabular-nums leading-none tracking-[-0.03em]',
              net >= 0 ? stitchHome.amountIncome : stitchHome.amountExpense
            )}
          >
            {net >= 0 ? '+' : '−'}
            {formatCurrency(Math.abs(net))}
          </p>
        </section>
      </StickyTotal>
      <HomeDashboardMain id="main-transactions" className="gap-2.5 pt-1.5">
        <section>
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {tLedger('monthlyEarn')}
              </dt>
              <dd
                className={cn(
                  'mt-0.5 text-base font-semibold tabular-nums',
                  stitchHome.amountIncome
                )}
              >
                {formatCurrency(earn)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {tLedger('monthlySpend')}
              </dt>
              <dd
                className={cn(
                  'mt-0.5 text-base font-semibold tabular-nums',
                  stitchHome.amountExpense
                )}
              >
                {formatCurrency(spend)}
              </dd>
            </div>
          </dl>
        </section>

        <FilterDock>
          {props.showUserPicker ? (
            <PeopleChips
              label={tLedger('filterWho')}
              ariaLabel={tLedger('usersAria')}
              allLabel={tUsers('all')}
              peopleAria={(name) => tUsers('selectUserAria', { name })}
              groupUsers={props.groupUsers}
              selectedUserId={props.selectedUserId}
              onUserFilterChange={props.onUserFilterChange}
            />
          ) : null}
          <CompactSegments
            label={tLedger('filterStatus')}
            ariaLabel={tLedger('statusAria')}
            selected={status}
            onSelect={setStatus}
            options={[
              {
                key: 'all' as const,
                label: tLedger('statusAll'),
                count: view.filteredSeries.length,
              },
              { key: 'active' as const, label: tLedger('statusActive'), count: activeCount },
              { key: 'paused' as const, label: tLedger('statusPaused'), count: pausedCount },
            ]}
          />
        </FilterDock>

        {visible.length === 0 ? (
          <div className={cn(stitchTransactions.emptyState, 'px-4 py-5')} role="status">
            <p className={stitchTransactions.emptyTitle}>{tSection('empty.title')}</p>
            <p className={stitchTransactions.emptyDescription}>{emptyDescription}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <SeriesGroup
              title={tSection('groups.upcoming')}
              items={upcoming}
              frequencyLabel={(item) => frequencyLabel(item.frequency, tCard)}
              dueLabel={(item) => dueLabel(item.daysUntilDue, tCard)}
              onEdit={props.onEditRecurringSeries}
            />
            <SeriesGroup
              title={tSection('groups.later')}
              items={rest}
              frequencyLabel={(item) => frequencyLabel(item.frequency, tCard)}
              dueLabel={(item) => dueLabel(item.daysUntilDue, tCard)}
              onEdit={props.onEditRecurringSeries}
            />
          </div>
        )}
      </HomeDashboardMain>
      <PageFab
        onClick={props.onCreateRecurringSeries}
        ariaLabel={tSection('empty.addButton')}
        testId="recurring-fab-add"
      />
    </>
  );
}

export function RecurringLedgerFallback({ tabs }: { tabs: ReactNode }) {
  return (
    <>
      <PageTabsBar>{tabs}</PageTabsBar>
      <div className="px-4 pt-4">
        <RecurringSeriesSkeleton />
      </div>
    </>
  );
}

function SeriesGroup({
  title,
  items,
  frequencyLabel: frequencyOf,
  dueLabel: dueOf,
  onEdit,
}: {
  title: string;
  items: DecoratedRecurringSeries[];
  frequencyLabel: (item: DecoratedRecurringSeries) => string;
  dueLabel: (item: DecoratedRecurringSeries) => string;
  onEdit: (series: RecurringTransactionSeries) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-1.5">
      <h3 className={stitchTransactions.dayHeaderTitle}>{title}</h3>
      <ul className={stitchHome.plainList}>
        {items.map((item) => (
          <li key={item.id}>
            <SeriesRow
              item={item}
              frequencyLabel={frequencyOf(item)}
              dueLabel={dueOf(item)}
              onClick={() => onEdit(item)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function frequencyLabel(frequency: string, t: ReturnType<typeof useTranslations>): string {
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

function dueLabel(days: number, t: ReturnType<typeof useTranslations>): string {
  if (days === 0) return t('due.today');
  if (days === 1) return t('due.tomorrow');
  if (days < 0) return t('due.daysAgo', { count: Math.abs(days) });
  return t('due.inDays', { count: days });
}

function SeriesRow({
  item,
  frequencyLabel: frequency,
  dueLabel: due,
  onClick,
}: {
  item: DecoratedRecurringSeries;
  frequencyLabel: string;
  dueLabel: string;
  onClick: () => void;
}) {
  const t = useTranslations('Recurring.SeriesCard');
  const amount = Math.abs(Number(item.amount));
  const monthly = calculateMonthlyAmount(item);
  const showMonthlyHint = item.frequency !== 'monthly' && item.is_active;
  const meta = [
    frequency,
    due,
    item.is_active ? undefined : t('status.stopped'),
    showMonthlyHint ? `${formatCurrency(Math.abs(monthly))}/m` : undefined,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PlainListRow
      title={item.description}
      meta={meta}
      onClick={onClick}
      ariaLabel={t('actions.editAria', {
        description: item.description,
        amount: formatCurrency(amount),
      })}
      className={item.is_active ? undefined : 'opacity-60'}
    >
      <Amount
        type={item.type === 'income' ? 'income' : item.type === 'expense' ? 'expense' : 'neutral'}
        size="sm"
        emphasis="strong"
      >
        {item.type === 'expense' ? -amount : amount}
      </Amount>
    </PlainListRow>
  );
}
