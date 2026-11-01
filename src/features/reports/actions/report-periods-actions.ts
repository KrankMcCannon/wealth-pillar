'use server';

import { cacheLife, cacheTag } from 'next/cache';
import { financialDateTime } from '@/lib/utils/financial-date';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { AccessScope } from '@/lib/permissions/access-scope';
import { CACHE_TAGS } from '@/lib/cache/config';
import type { ServiceResult } from '@/lib/types/service-result';
import {
  isValidReportsRange,
  type ReportsDateRange,
} from '@/features/reports/utils/reporting-window';
import {
  getReportsContextUseCase,
  getReportsPeriodSummariesUseCase,
  type ReportPeriodSummary,
} from '@/server/use-cases/reports/reports.use-cases';

async function getCachedPeriods(groupId: string, userIds: string[], window: ReportsDateRange) {
  'use cache';
  cacheLife('minutes');
  cacheTag(
    `group:${groupId}:transactions`,
    `group:${groupId}:accounts`,
    `group:${groupId}:budgets`,
    CACHE_TAGS.BUDGET_PERIODS
  );
  for (const id of userIds) cacheTag(CACHE_TAGS.USER_BUDGET_PERIODS(id));
  cacheTag(CACHE_TAGS.GROUP_USERS(groupId));
  const { periods, accounts, budgets } = await getReportsContextUseCase(groupId, userIds);
  return getReportsPeriodSummariesUseCase(groupId, periods, accounts, budgets, {
    start: financialDateTime(window.start).startOf('day').toJSDate(),
    end: financialDateTime(window.end).endOf('day').toJSDate(),
  });
}

/** Read-only details. Group and visible users always come from the authenticated session. */
export async function loadReportPeriodsAction(
  window: ReportsDateRange
): Promise<ServiceResult<ReportPeriodSummary[]>> {
  try {
    const user = await getCurrentUser();
    if (!user?.group_id || !isValidReportsRange(window))
      return { data: null, error: 'UNAVAILABLE' };
    const scope = AccessScope.for(user);
    const users = scope.isAdmin ? await getGroupUsers() : [user];
    const userIds = users.filter((u) => u.group_id === user.group_id).map((u) => u.id);
    const periods = await getCachedPeriods(user.group_id, userIds, {
      start: window.start,
      end: window.end,
    });
    return {
      data: scope.isAdmin ? periods : periods.filter((p) => p.userId === user.id),
      error: null,
    };
  } catch (error) {
    const errorType = error instanceof Error ? error.name : typeof error;
    console.error('[Report periods] Load failed', { errorType });
    return { data: null, error: 'UNAVAILABLE' };
  }
}
