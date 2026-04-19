import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getReportsPageDataUseCase } from '@/server/use-cases/pages/reports-page.use-case';
import ReportsLoading from './loading';
import ReportsContent from './reports-content';

export default async function ReportsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const groupUserIds = groupUsers.map((u) => u.id);
  const groupId = await requireGroupId(currentUser);

  const reportsBundlePromise = (async () => {
    try {
      return await getReportsPageDataUseCase(groupId, groupUserIds);
    } catch (err) {
      const t = await getTranslations('Errors');
      throw new Error(t('loadFailedReports'), { cause: err });
    }
  })();

  return (
    <Suspense fallback={<ReportsLoading />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        reportsBundlePromise={reportsBundlePromise}
      />
    </Suspense>
  );
}
