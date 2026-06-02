import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import { InvestmentsSkeleton } from '@/components/ui/primitives/skeletons';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getInvestmentsPageData } from '@/server/use-cases/pages/investments-page.use-case';

export default async function InvestmentsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [{ currentUser, groupUsers }, searchParams] = await Promise.all([
    requirePageAuth(props.params),
    props.searchParams,
  ]);

  const groupId = await requireGroupId(currentUser);
  const groupUserIds = groupUsers.map((u) => u.id);
  const userScope = typeof searchParams.user === 'string' ? searchParams.user : 'all';
  const indexSymbol = typeof searchParams.index === 'string' ? searchParams.index : 'IVV';

  const pageDataPromise = getInvestmentsPageData(
    groupId,
    { user: userScope, index: indexSymbol },
    currentUser,
    groupUserIds
  ).catch(async (err) => {
    const t = await getTranslations('InvestmentsPage');
    const message = err instanceof Error ? err.message : t('loadError');
    throw new Error(message, { cause: err });
  });

  return (
    <Suspense fallback={<InvestmentsSkeleton />}>
      <InvestmentsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
