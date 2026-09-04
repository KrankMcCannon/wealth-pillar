import { format } from 'date-fns';
import {
  getCurrentReportingWindow,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';
import { defaultFiltersState } from '@/features/transactions/components/filters/filter-helpers';
import { buildTransactionsQueryString } from '@/features/transactions/utils/transactions-query';
import type { ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';

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
