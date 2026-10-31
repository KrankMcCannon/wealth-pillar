import { cacheLife, cacheTag } from 'next/cache';
import { endOfDay, format, startOfDay, subYears } from 'date-fns';
import { CACHE_TAGS } from '@/lib/cache/config';
import {
  getReportsContextUseCase,
  getReportsTransactionsUseCase,
  resolveYtdBudgetStart,
  type ReportPeriodSummary,
} from '../reports/reports.use-cases';
import {
  buildReportsSectionViewModel,
  type DateWindow,
  type ReportsSectionViewModel,
} from '../reports/report.logic';
import {
  getComparisonReportingWindow,
  getCurrentReportingWindow,
  unionReportingWindows,
  DEFAULT_REPORTS_PRESET,
  type ReportsTimePreset,
  type ReportsDateRange,
} from '@/features/reports/utils/reporting-window';
import type { User } from '@/lib/types';
import { scopeReportsPageData } from '@/server/permissions/scope-page-data';

export type ReportsScope = 'all' | string;

export interface ReportsPageParams {
  preset?: ReportsTimePreset | undefined;
  customStart?: string | undefined;
  customEnd?: string | undefined;
  memberUserId?: string | undefined;
}

export interface ReportsPageData {
  sections: { all: ReportsSectionViewModel } & Record<string, ReportsSectionViewModel>;
  periods: ReportPeriodSummary[];
  defaultScope: ReportsScope;
  preset: ReportsTimePreset;
  comparisonLabelKey: 'vsLastMonth' | 'vsLastWeek' | 'vsLastYear' | 'vsPreviousRange';
  transactionsTruncated: boolean;
  currentWindow: ReportsDateRange;
  comparisonWindow: ReportsDateRange | null;
}

async function getCachedReportsPageData(
  groupId: string,
  groupUserIds: string[],
  params: ReportsPageParams = {}
): Promise<ReportsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag(`group:${groupId}:budgets`);
  cacheTag(CACHE_TAGS.BUDGET_PERIODS);
  cacheTag('categories');

  const preset = params.preset ?? DEFAULT_REPORTS_PRESET;
  const customRange =
    params.customStart && params.customEnd
      ? { start: params.customStart, end: params.customEnd }
      : null;

  const { accounts, periods, categories, users } = await getReportsContextUseCase(
    groupId,
    groupUserIds
  );
  const userIds = users.map((u) => u.id);

  let currentWindow: DateWindow = getCurrentReportingWindow(preset, customRange);
  let comparisonWindow = getComparisonReportingWindow(preset, currentWindow);

  if (preset === 'ytd') {
    const now = new Date();
    const anchor = resolveYtdBudgetStart(periods, now);
    if (anchor) {
      currentWindow = { start: startOfDay(anchor), end: currentWindow.end };
      comparisonWindow = {
        start: startOfDay(subYears(currentWindow.start, 1)),
        end: endOfDay(subYears(currentWindow.end, 1)),
      };
    }
  }

  const fetchWindow = unionReportingWindows(currentWindow, comparisonWindow);
  const { transactions, hasMore: transactionsTruncated } = await getReportsTransactionsUseCase(
    groupId,
    {
      startDate: fetchWindow.start,
      endDate: fetchWindow.end,
    }
  );

  const sections: ReportsPageData['sections'] = {
    all: buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow
    ),
  };

  for (const uid of userIds) {
    sections[uid] = buildReportsSectionViewModel(
      transactions,
      accounts,
      categories,
      userIds,
      currentWindow,
      comparisonWindow,
      uid
    );
  }

  const defaultScope: ReportsScope =
    params.memberUserId && userIds.includes(params.memberUserId) ? params.memberUserId : 'all';

  const comparisonLabelKey =
    preset === 'monthly' || preset === 'last_month'
      ? 'vsLastMonth'
      : preset === 'weekly'
        ? 'vsLastWeek'
        : preset === 'yearly' || preset === 'ytd' || preset === 'last_year'
          ? 'vsLastYear'
          : 'vsPreviousRange';

  return {
    sections,
    // Period summaries are loaded by the authenticated details action on demand.
    periods: [],
    defaultScope,
    preset,
    comparisonLabelKey,
    transactionsTruncated,
    currentWindow: {
      start: format(currentWindow.start, 'yyyy-MM-dd'),
      end: format(currentWindow.end, 'yyyy-MM-dd'),
    },
    comparisonWindow: comparisonWindow
      ? {
          start: format(comparisonWindow.start, 'yyyy-MM-dd'),
          end: format(comparisonWindow.end, 'yyyy-MM-dd'),
        }
      : null,
  };
}

export async function getReportsPageDataUseCase(
  groupId: string,
  groupUserIds: string[],
  currentUser: User,
  params: ReportsPageParams = {}
): Promise<ReportsPageData> {
  // The selected member changes presentation only, not the cached financial dataset.
  const { memberUserId, ...financialParams } = params;
  const data = await getCachedReportsPageData(groupId, groupUserIds, financialParams);
  return scopeReportsPageData(
    {
      ...data,
      defaultScope: memberUserId && groupUserIds.includes(memberUserId) ? memberUserId : 'all',
    },
    currentUser
  );
}
