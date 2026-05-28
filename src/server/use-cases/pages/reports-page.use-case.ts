import { cacheLife, cacheTag } from 'next/cache';
import {
  getReportsDataUseCase,
  calculatePeriodSummariesUseCase,
  type ReportPeriodSummary,
} from '../reports/reports.use-cases';
import {
  buildReportsSectionViewModel,
  periodOverlapsWindow,
  type ReportsSectionViewModel,
} from '../reports/report.logic';
import {
  getComparisonReportingWindow,
  getCurrentReportingWindow,
  type ReportsTimePreset,
} from '@/features/reports/utils/reporting-window';

export interface ReportsPageParams {
  preset?: ReportsTimePreset | undefined;
  customStart?: string | undefined;
  customEnd?: string | undefined;
  memberUserId?: string | undefined;
}

export interface ReportsPageData {
  group: ReportsSectionViewModel;
  member: ReportsSectionViewModel;
  memberUserId: string;
  periodSummaries: ReportPeriodSummary[];
  filteredPeriodsAllUsers: ReportPeriodSummary[];
  memberPeriods: ReportPeriodSummary[];
  preset: ReportsTimePreset;
  comparisonLabelKey: 'vsLastMonth' | 'vsLastWeek' | 'vsLastYear' | 'vsPreviousRange';
}

export async function getReportsPageDataUseCase(
  groupId: string,
  groupUserIds: string[],
  params: ReportsPageParams = {}
): Promise<ReportsPageData> {
  'use cache';
  cacheLife('minutes');
  cacheTag(`group:${groupId}:transactions`);
  cacheTag(`group:${groupId}:accounts`);
  cacheTag('categories');

  const preset = params.preset ?? 'monthly';
  const customRange =
    params.customStart && params.customEnd
      ? { start: params.customStart, end: params.customEnd }
      : null;

  const currentWindow = getCurrentReportingWindow(preset, customRange);
  const comparisonWindow = getComparisonReportingWindow(preset, currentWindow);

  const reportsData = await getReportsDataUseCase(groupId, groupUserIds);
  const { transactions, accounts, periods, categories, users } = reportsData;

  const userIds = users.map((u) => u.id);
  const memberUserId =
    params.memberUserId && userIds.includes(params.memberUserId)
      ? params.memberUserId
      : (userIds[0] ?? '');

  const periodSummaries = calculatePeriodSummariesUseCase(periods, transactions, accounts);
  const filteredPeriodsAllUsers = periodSummaries
    .filter((p) => periodOverlapsWindow(p, currentWindow))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

  const memberPeriods = filteredPeriodsAllUsers.filter((p) => p.userId === memberUserId);

  const group = buildReportsSectionViewModel(
    transactions,
    accounts,
    categories,
    userIds,
    currentWindow,
    comparisonWindow
  );

  const member = buildReportsSectionViewModel(
    transactions,
    accounts,
    categories,
    userIds,
    currentWindow,
    null,
    memberUserId
  );

  const comparisonLabelKey =
    preset === 'monthly'
      ? 'vsLastMonth'
      : preset === 'weekly'
        ? 'vsLastWeek'
        : preset === 'yearly'
          ? 'vsLastYear'
          : 'vsPreviousRange';

  return {
    group,
    member,
    memberUserId,
    periodSummaries,
    filteredPeriodsAllUsers,
    memberPeriods,
    preset,
    comparisonLabelKey,
  };
}
