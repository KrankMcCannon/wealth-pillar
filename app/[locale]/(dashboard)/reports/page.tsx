import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import {
  getReportsPageDataUseCase,
  type ReportsPageParams,
} from '@/server/use-cases/pages/reports-page.use-case';
import ReportsContent from './reports-content';
import ReportsLoading from './loading';
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

async function ReportsPageData({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [{ currentUser, groupUsers, groupId }, sp] = await Promise.all([
    resolvePageContext(params),
    searchParams,
  ]);

  const groupUserIds = groupUsers.map((u) => u.id);
  const reportParams = parseReportsParams(sp);

  const reportsBundlePromise = (async () => {
    try {
      return await getReportsPageDataUseCase(groupId, groupUserIds, currentUser, reportParams);
    } catch (err) {
      const t = await getTranslations('Errors');
      throw new Error(t('loadFailedReports'), { cause: err });
    }
  })();

  return (
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
  );
}

export default function ReportsPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsPageData params={params} searchParams={searchParams} />
    </Suspense>
  );
}
