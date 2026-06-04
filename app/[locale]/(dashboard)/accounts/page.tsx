/**
 * Accounts Page — Server Component.
 *
 * Auth and page data resolve inside Suspense with [`AccountsLoading`](./loading.tsx) fallback.
 */

import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getAccountsPageData } from '@/server/use-cases';
import AccountsContent from './accounts-content';
import AccountsLoading from './loading';

async function AccountsPageData({ params }: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers, groupId } = await resolvePageContext(params);

  let pageData;
  try {
    pageData = await getAccountsPageData(
      groupId,
      groupUsers.map((u) => u.id),
      currentUser
    );
  } catch (err) {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedAccounts'), { cause: err });
  }

  return <AccountsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}

export default function AccountsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  return (
    <Suspense fallback={<AccountsLoading />}>
      <AccountsPageData params={params} />
    </Suspense>
  );
}
