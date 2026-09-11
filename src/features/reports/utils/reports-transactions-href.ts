import { format } from 'date-fns';
import {
  getCurrentReportingWindow,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';
import { defaultFiltersState } from '@/features/transactions/components/filters/filter-helpers';
import { buildTransactionsQueryString } from '@/features/transactions/utils/transactions-query';
import type { ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';
import { isSyntheticBudgetPeriodId } from '@/server/use-cases/budget-periods/synthetic-active-period.logic';

export function buildReportsSearchQuery(input: {
  preset: ReportsTimePreset;
  customRange: { start: string; end: string } | null;
  scope: ReportsScope;
}): string {
  const params = new URLSearchParams();
  params.set('preset', input.preset);
  if (input.preset === 'custom' && input.customRange) {
    params.set('customStart', input.customRange.start);
    params.set('customEnd', input.customRange.end);
  }
  if (input.scope !== 'all') {
    params.set('member', input.scope);
  }
  return params.toString();
}

export function canOpenPeriodDetail(period: { id: string }): boolean {
  return !isSyntheticBudgetPeriodId(period.id);
}

export function buildReportsPeriodHref(input: {
  periodId: string;
  preset: ReportsTimePreset;
  customRange: { start: string; end: string } | null;
  scope: ReportsScope;
}): string {
  const query = buildReportsSearchQuery(input);
  return query
    ? `/reports/periods/${input.periodId}?${query}`
    : `/reports/periods/${input.periodId}`;
}

export function buildPeriodTransactionsHref(input: {
  startDate: string;
  endDate: string;
  userId: string;
  categoryKey?: string;
}): string {
  const qs = buildTransactionsQueryString(
    {
      ...defaultFiltersState,
      searchQuery: '',
      type: input.categoryKey ? 'expense' : 'all',
      dateRange: 'custom',
      categoryKey: input.categoryKey ?? 'all',
      accountId: 'all',
      startDate: input.startDate,
      endDate: input.endDate,
    },
    input.userId
  );
  return `/transactions?${qs}`;
}

export function buildReportsCategoryTransactionsHref(input: {
  preset: ReportsTimePreset;
  customRange: { start: string; end: string } | null;
  scope: ReportsScope;
  categoryKey: string;
  now?: Date;
}): string {
  const window = getCurrentReportingWindow(input.preset, input.customRange, input.now);
  const qs = buildTransactionsQueryString(
    {
      ...defaultFiltersState,
      searchQuery: '',
      type: 'expense',
      dateRange: 'custom',
      categoryKey: input.categoryKey,
      accountId: 'all',
      startDate: format(window.start, 'yyyy-MM-dd'),
      endDate: format(window.end, 'yyyy-MM-dd'),
    },
    input.scope === 'all' ? undefined : input.scope
  );
  return `/transactions?${qs}`;
}

/** Ledger for the report window, transfers only (server `type=transfer`). */
export function buildReportsReserveTransactionsHref(input: {
  preset: ReportsTimePreset;
  customRange: { start: string; end: string } | null;
  scope: ReportsScope;
  now?: Date;
}): string {
  const window = getCurrentReportingWindow(input.preset, input.customRange, input.now);
  const params = new URLSearchParams();
  params.set('type', 'transfer');
  params.set('dateRange', 'custom');
  params.set('startDate', format(window.start, 'yyyy-MM-dd'));
  params.set('endDate', format(window.end, 'yyyy-MM-dd'));
  if (input.scope !== 'all') params.set('user', input.scope);
  return `/transactions?${params.toString()}`;
}
