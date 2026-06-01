import { cacheLife, cacheTag } from 'next/cache';
import { endOfDay, startOfDay, subYears } from 'date-fns';
import {
  getReportsDataUseCase,
  calculatePeriodSummariesUseCase,
  resolveYtdBudgetStart,
  type ReportPeriodSummary,
} from '../reports/reports.use-cases';
import {
  buildReportsSectionViewModel,
  periodOverlapsWindow,
  type DateWindow,
  type ReportsSectionViewModel,
} from '../reports/report.logic';
import {
  getComparisonReportingWindow,
  getCurrentReportingWindow,
  DEFAULT_REPORTS_PRESET,
  type ReportsTimePreset,
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
  cacheTag('categories');

  const preset = params.preset ?? DEFAULT_REPORTS_PRESET;
  const customRange =
    params.customStart && params.customEnd
      ? { start: params.customStart, end: params.customEnd }
      : null;

  const reportsData = await getReportsDataUseCase(groupId, groupUserIds);
  const { transactions, accounts, periods, categories, users } = reportsData;

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

  const periodSummaries = calculatePeriodSummariesUseCase(periods, transactions, accounts);
  const filteredPeriods = periodSummaries
    .filter((p) => periodOverlapsWindow(p, currentWindow))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

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
    preset === 'monthly'
      ? 'vsLastMonth'
      : preset === 'weekly'
        ? 'vsLastWeek'
        : preset === 'yearly' || preset === 'ytd'
          ? 'vsLastYear'
          : 'vsPreviousRange';

  return {
    sections,
    periods: filteredPeriods,
    defaultScope,
    preset,
    comparisonLabelKey,
  };
}

export async function getReportsPageDataUseCase(
  groupId: string,
  groupUserIds: string[],
  currentUser: User,
  params: ReportsPageParams = {}
): Promise<ReportsPageData> {
  const data = await getCachedReportsPageData(groupId, groupUserIds, params);
  return scopeReportsPageData(data, currentUser);
}
