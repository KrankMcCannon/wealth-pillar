import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import {
  getReportsPageDataUseCase,
  type ReportsPageParams,
} from '@/server/use-cases/pages/reports-page.use-case';
import { ReportsSkeleton } from '@/components/reports/reports-skeleton';
import ReportsContent from './reports-content';
import { resolveReportsPreset } from '@/features/reports/utils/reporting-window';

function parseReportsParams(
  searchParams: Record<string, string | string[] | undefined>
): ReportsPageParams {
  const presetRaw = typeof searchParams.preset === 'string' ? searchParams.preset : undefined;
  const preset = resolveReportsPreset(presetRaw);

  return {
    preset,
    customStart:
      typeof searchParams.customStart === 'string' ? searchParams.customStart : undefined,
    customEnd: typeof searchParams.customEnd === 'string' ? searchParams.customEnd : undefined,
    memberUserId: typeof searchParams.member === 'string' ? searchParams.member : undefined,
  };
}

export default async function ReportsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const sp = await searchParams;

  const groupUserIds = groupUsers.map((u) => u.id);
  const groupId = await requireGroupId(currentUser);
  const reportParams = parseReportsParams(sp);

  const reportsBundlePromise = (async () => {
    try {
      return await getReportsPageDataUseCase(groupId, groupUserIds, reportParams);
    } catch (err) {
      const t = await getTranslations('Errors');
      throw new Error(t('loadFailedReports'), { cause: err });
    }
  })();

  return (
    <Suspense fallback={<ReportsSkeleton />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        reportsBundlePromise={reportsBundlePromise}
        initialPreset={reportParams.preset ?? resolveReportsPreset()}
        initialCustomStart={reportParams.customStart}
        initialCustomEnd={reportParams.customEnd}
        initialScope={
          reportParams.memberUserId && groupUserIds.includes(reportParams.memberUserId)
            ? reportParams.memberUserId
            : 'all'
        }
      />
    </Suspense>
  );
}
