/**
 * Accounts Page - Server Component
 *
 * Await page data on the server so client navigations (e.g. desktop sidebar)
 * always get resolved props instead of a cross-boundary Promise + use().
 */

import { getTranslations } from 'next-intl/server';
import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { getAccountsPageData } from '@/server/use-cases';
import AccountsContent from './accounts-content';

export default async function AccountsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = await requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await getAccountsPageData(groupId);
  } catch (err) {
    const t = await getTranslations('Errors');
    throw new Error(t('loadFailedAccounts'), { cause: err });
  }

  return <AccountsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}
