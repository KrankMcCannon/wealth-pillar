import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import InvestmentsContent from './investments-content';
import InvestmentsLoading from './loading';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getInvestmentsPageData } from '@/server/use-cases/pages/investments-page.use-case';

async function InvestmentsPageData({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}>) {
  const [{ currentUser, groupUsers, groupId }, resolvedSearchParams] = await Promise.all([
    resolvePageContext(params),
    searchParams,
  ]);

  const groupUserIds = groupUsers.map((u) => u.id);
  const userScope =
    typeof resolvedSearchParams.user === 'string' ? resolvedSearchParams.user : 'all';
  const indexSymbol =
    typeof resolvedSearchParams.index === 'string' ? resolvedSearchParams.index : 'IVV';

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
    <InvestmentsContent
      currentUser={currentUser}
      groupUsers={groupUsers}
      pageDataPromise={pageDataPromise}
    />
  );
}

export default function InvestmentsPage(props: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <Suspense fallback={<InvestmentsLoading />}>
      <InvestmentsPageData params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
