import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getReportPeriodDetailPageData } from '@/server/use-cases/pages/report-period-detail-page.use-case';
import { resolveReportsPreset } from '@/features/reports/utils/reporting-window';
import type { ReportsScope } from '@/server/use-cases/pages/reports-page.use-case';
import PeriodDetailContent from './period-detail-content';
import PeriodDetailLoading from './loading';

async function PeriodDetailPageData({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; periodId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [{ currentUser, groupId, groupUsers }, routeParams, sp] = await Promise.all([
    resolvePageContext(params),
    params,
    searchParams,
  ]);

  const preset = resolveReportsPreset(typeof sp.preset === 'string' ? sp.preset : undefined);
  const memberUserId = typeof sp.member === 'string' ? sp.member : undefined;
  const groupUserIds = groupUsers.map((user) => user.id);
  const backScope: ReportsScope =
    memberUserId && groupUserIds.includes(memberUserId) ? memberUserId : 'all';

  const pageDataPromise = getReportPeriodDetailPageData(
    groupId,
    routeParams.periodId,
    currentUser
  ).catch(async (err) => {
    if (err instanceof Error && err.message === 'NOT_FOUND') {
      throw err;
    }
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedReports'), { cause: err });
  });

  return (
    <PeriodDetailContent
      pageDataPromise={pageDataPromise}
      backPreset={preset}
      backCustomStart={typeof sp.customStart === 'string' ? sp.customStart : undefined}
      backCustomEnd={typeof sp.customEnd === 'string' ? sp.customEnd : undefined}
      backScope={backScope}
    />
  );
}

export default function PeriodDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string; periodId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  return (
    <Suspense fallback={<PeriodDetailLoading />}>
      <PeriodDetailPageData params={params} searchParams={searchParams} />
    </Suspense>
  );
}
