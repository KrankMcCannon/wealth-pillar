'use client';

import { use, useRef, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { MoreHorizontal } from 'lucide-react';
import { HomeDashboardMain, PageFab } from '@/components/layout';
import { Amount } from '@/components/ui/primitives/amount';
import { PlainListRow } from '@/components/ui/layout/plain-list-row';
import {
  Button,
  Input,
  Spinner,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui';
import { RecurringSeriesSkeleton } from './transaction-skeletons';
import { buildRecurringView, type DecoratedRecurringSeries } from '@/lib/recurring/recurring-view';
import { formatDateShort, cn } from '@/lib/utils';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import type { RecurringTransactionSeries } from '@/lib/types';
import { stitchHome, stitchTransactions } from '@/styles/home-design-foundation';
import { toggleRecurringSeriesActiveAction } from '@/features/recurring/actions/recurring-actions';
import { toast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/routing';
import { CompactSegments, FilterDock } from './filter-dock';
import { StickyTotal } from './sticky-total';
import type { RecurringLedgerProps } from './transactions-workspace-props';

const statuses = ['all', 'active', 'paused', 'ended'] as const;
type StatusFilter = (typeof statuses)[number];
export function RecurringLedgerWithSeries({
  seriesPromise,
  ...props
}: Omit<RecurringLedgerProps, 'series'> & {
  seriesPromise: Promise<RecurringTransactionSeries[]>;
}) {
  return <RecurringLedger {...props} series={use(seriesPromise)} />;
}

export function RecurringLedger(props: RecurringLedgerProps) {
  const t = useTranslations('TransactionsContent.Ledger');
  const section = useTranslations('Recurring.Section');
  const card = useTranslations('Recurring.SeriesCard');
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useQueryState(
    'recurringStatus',
    parseAsStringEnum<StatusFilter>([...statuses])
      .withDefault('all')
      .withOptions({ history: 'replace' })
  );
  const [search, setSearch] = useQueryState(
    'recurringSearch',
    parseAsString.withDefault('').withOptions({ history: 'replace' })
  );
  const [account, setAccount] = useQueryState(
    'recurringAccount',
    parseAsString.withDefault('all').withOptions({ history: 'replace' })
  );
  const locks = useRef(new Set<string>());
  const [pending, setPending] = useState<string[]>([]);
  const [local, setLocal] = useState<{
    source: RecurringTransactionSeries[];
    overrides: Record<string, RecurringTransactionSeries>;
  }>({
    source: props.series,
    overrides: {},
  });
  if (local.source !== props.series) setLocal({ source: props.series, overrides: {} });
  const source = props.series.map((item) => local.overrides[item.id] ?? item);
  const scope = source.filter(
    (item) =>
      (account === 'all' || item.account_id === account) &&
      item.description.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))
  );
  const view = buildRecurringView(scope, {
    ...(props.selectedUserId ? { selectedUserId: props.selectedUserId } : {}),
  });
  const visible = view.filteredSeries.filter(
    (item) =>
      status === 'all' ||
      (status === 'paused'
        ? !item.is_active
        : status === 'ended'
          ? item.is_active && item.scheduleStatus === 'ended'
          : item.is_active && !['ended', 'invalid'].includes(item.scheduleStatus))
  );
  const activeCount = view.activeSeries.length;
  const ended = visible.filter((item) => item.is_active && item.scheduleStatus === 'ended');
  const recorded = visible.filter((item) => item.is_active && item.scheduleStatus === 'recorded');
  const upcoming = visible.filter(
    (item) =>
      item.is_active && ['due', 'scheduled'].includes(item.scheduleStatus) && item.daysUntilDue <= 7
  );
  const later = visible.filter(
    (item) => item.is_active && item.scheduleStatus === 'scheduled' && item.daysUntilDue > 7
  );
  const filtersActive = status !== 'all' || Boolean(search) || account !== 'all';
  const showSearch = props.series.length > 5 || search || account !== 'all';
  const money = (amount: number) => formatCurrencyLocale(amount, locale);

  async function toggle(
    item: RecurringTransactionSeries,
    next: boolean,
    withUndo = true
  ): Promise<void> {
    if (locks.current.has(item.id)) return;
    locks.current.add(item.id);
    setPending((ids) => [...ids, item.id]);
    try {
      const result = await toggleRecurringSeriesActiveAction(item.id, next);
      if (result.error || !result.data) throw new Error(result.error ?? t('updateError'));
      setLocal((state) => ({
        ...state,
        overrides: { ...state.overrides, [item.id]: { ...item, ...result.data! } },
      }));
      toast({
        title: card(next ? 'actions.resume' : 'actions.pause'),
        variant: 'success',
        ...(withUndo
          ? {
              action: {
                label: t('undo'),
                onClick: () => {
                  toggle({ ...item, is_active: next }, !next, false);
                },
              },
            }
          : {}),
      });
      router.refresh();
    } catch {
      toast({ title: t('updateError'), description: t('updateRetry'), variant: 'destructive' });
    } finally {
      locks.current.delete(item.id);
      setPending((ids) => ids.filter((id) => id !== item.id));
    }
  }

  const group = (title: string, items: DecoratedRecurringSeries[]) => (
    <SeriesGroup
      title={title}
      items={items}
      accountNames={props.accountNames}
      onEdit={props.onEditRecurringSeries}
      onToggle={(item) => {
        toggle(item, !item.is_active);
      }}
      pending={pending}
    />
  );
  return (
    <>
      <StickyTotal>
        <section aria-labelledby="recurring-net-label">
          <p
            id="recurring-net-label"
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {t('monthlyNet')}
          </p>
          <p
            className={cn(
              'mt-1 font-display text-[32px] font-semibold tabular-nums leading-none tracking-[-0.03em]',
              view.monthlyTotals.netMonthly >= 0
                ? stitchHome.amountIncome
                : stitchHome.amountExpense
            )}
          >
            {view.monthlyTotals.netMonthly >= 0 ? '+' : '−'}
            {money(Math.abs(view.monthlyTotals.netMonthly))}
          </p>
        </section>
      </StickyTotal>
      <HomeDashboardMain
        id="main-transactions"
        className="mx-auto max-w-5xl gap-2.5 pb-[calc(11rem+env(safe-area-inset-bottom))] pt-1.5"
      >
        <p className="max-w-prose text-sm text-muted-foreground">{t('monthlyEstimate')}</p>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('monthlyEarn')}
            </dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-income">
              {money(view.monthlyTotals.totalIncome)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('monthlySpend')}
            </dt>
            <dd className="mt-0.5 text-base font-semibold tabular-nums text-expense">
              {money(view.monthlyTotals.totalExpenses)}
            </dd>
          </div>
        </dl>
        <p className="max-w-prose text-sm text-muted-foreground">{t('scheduleForecast')}</p>
        <FilterDock>
          <CompactSegments
            ariaLabel={t('statusAria')}
            selected={status}
            onSelect={(value) => {
              setStatus(value);
            }}
            options={[
              { key: 'all', label: t('statusAll'), count: view.filteredSeries.length },
              { key: 'active', label: t('statusActive'), count: activeCount },
              { key: 'paused', label: t('statusPaused'), count: view.pausedCount },
              {
                key: 'ended',
                label: t('statusEnded'),
                count: view.filteredSeries.filter(
                  (item) => item.is_active && item.scheduleStatus === 'ended'
                ).length,
              },
            ]}
          />
        </FilterDock>
        {showSearch ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('searchSeries')}</span>
              <Input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                }}
                autoComplete="off"
                className="min-h-11"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span>{t('seriesAccount')}</span>
              <select
                value={account}
                onChange={(event) => {
                  setAccount(event.target.value);
                }}
                className="min-h-11 min-w-0 rounded-xl border border-border bg-background px-3 text-base"
              >
                <option value="all">{t('allAccounts')}</option>
                {Object.entries(props.accountNames ?? {}).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
        {visible.length === 0 ? (
          <div className={cn(stitchTransactions.emptyState, 'px-4 py-5')} role="status">
            <p className={stitchTransactions.emptyTitle}>{section('empty.title')}</p>
            <p className={stitchTransactions.emptyDescription}>
              {search || account !== 'all'
                ? t('empty.search')
                : status !== 'all'
                  ? t(`empty.${status}`)
                  : props.selectedUserId
                    ? section('empty.forUser')
                    : section('empty.defaultDescription')}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={
                filtersActive
                  ? () => {
                      setStatus('all');
                      setSearch('');
                      setAccount('all');
                    }
                  : props.onCreateRecurringSeries
              }
            >
              {filtersActive ? t('showAllSeries') : section('empty.addButton')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {group(section('groups.upcoming'), upcoming)}
            {group(section('groups.later'), later)}
            {group(t('recordedToday'), recorded)}
            {group(
              section('groups.paused'),
              visible.filter((item) => !item.is_active)
            )}
            {group(t('statusEnded'), ended)}
            {group(
              t('needsReview'),
              visible.filter((item) => item.is_active && item.scheduleStatus === 'invalid')
            )}
          </div>
        )}
      </HomeDashboardMain>
      <PageFab
        onClick={props.onCreateRecurringSeries}
        className="bottom-[calc(6rem+env(safe-area-inset-bottom))]"
        ariaLabel={section('empty.addButton')}
        testId="recurring-fab-add"
      />
    </>
  );
}

export function RecurringLedgerFallback() {
  return (
    <div className="px-4 pt-4">
      <RecurringSeriesSkeleton />
    </div>
  );
}
function SeriesGroup({
  title,
  items,
  accountNames,
  onEdit,
  onToggle,
  pending,
}: {
  title: string;
  items: DecoratedRecurringSeries[];
  accountNames?: Record<string, string> | undefined;
  onEdit: (item: RecurringTransactionSeries) => void;
  onToggle: (item: RecurringTransactionSeries) => void;
  pending: string[];
}) {
  const t = useTranslations('Recurring.SeriesCard');
  if (!items.length) return null;
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className={stitchTransactions.dayHeaderTitle}>{title}</h3>
      <ul className={stitchHome.plainList}>
        {items.map((item) => (
          <li key={item.id} className="flex min-w-0 items-center gap-1">
            <div className="min-w-0 flex-1">
              <SeriesRow
                item={item}
                accountName={accountNames?.[item.account_id]}
                onClick={() => onEdit(item)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="size-11 shrink-0 p-0"
                  aria-label={t('actions.menuAria', { description: item.description })}
                  disabled={pending.includes(item.id)}
                  aria-busy={pending.includes(item.id)}
                >
                  {pending.includes(item.id) ? (
                    <Spinner className="size-5" />
                  ) : (
                    <MoreHorizontal className="size-5" aria-hidden />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="min-h-11" onSelect={() => onEdit(item)}>
                  {t('actions.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="min-h-11"
                  onSelect={() => onToggle(item)}
                  disabled={item.type === 'transfer' && !item.is_active}
                >
                  {t(item.is_active ? 'actions.pause' : 'actions.resume')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
    </section>
  );
}
function SeriesRow({
  item,
  accountName,
  onClick,
}: {
  item: DecoratedRecurringSeries;
  accountName?: string | undefined;
  onClick: () => void;
}) {
  const t = useTranslations('Recurring.SeriesCard');
  const ledger = useTranslations('TransactionsContent.Ledger');
  const locale = useLocale();
  const amount = Math.abs(Number(item.amount));
  const days = item.daysUntilDue;
  const due = !Number.isFinite(days)
    ? ''
    : days === 0
      ? t('due.today')
      : days === 1
        ? t('due.tomorrow')
        : days < 0
          ? t('due.daysAgo', { count: Math.abs(days) })
          : t('due.inDays', { count: days });
  const dateLabel =
    item.scheduleStatus === 'paused'
      ? t('status.stopped')
      : item.scheduleStatus === 'invalid'
        ? ledger('needsReview')
        : item.scheduleStatus === 'ended'
          ? ledger('statusEnded')
          : item.scheduleStatus === 'recorded'
            ? ledger('recordedToday')
            : item.nextExecutionDate
              ? `${due} (${formatDateShort(item.nextExecutionDate, locale)})`
              : ledger('statusEnded');
  const meta = [t(`frequency.${item.frequency}`), dateLabel, accountName]
    .filter(Boolean)
    .join(' · ');
  const signed = item.type === 'expense' ? -amount : amount;
  return (
    <PlainListRow
      title={item.description}
      meta={meta}
      onClick={onClick}
      ariaLabel={`${t('actions.editAria', { description: item.description, amount: formatCurrencyLocale(signed, locale) })} · ${meta}`}
    >
      <span className="inline-flex items-baseline gap-0.5">
        {item.type === 'income' ? (
          <span aria-hidden>+</span>
        ) : item.type === 'transfer' ? (
          <span aria-hidden>↔</span>
        ) : null}
        <Amount
          locale={locale}
          type={item.type === 'income' ? 'income' : item.type === 'expense' ? 'expense' : 'neutral'}
          size="md"
          emphasis="strong"
        >
          {signed}
        </Amount>
      </span>
    </PlainListRow>
  );
}
