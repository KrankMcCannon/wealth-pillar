/**
 * Accounts Page — Server Component.
 *
 * Route `loading.tsx` is the navigation fallback. Do not wrap this file in Suspense.
 */

import { getTranslations } from 'next-intl/server';
import { resolvePageContext } from '@/lib/auth/page-auth';
import { getAccountsPageData } from '@/server/use-cases';
import AccountsContent from './accounts-content';

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
  return <AccountsPageData params={params} />;
}
