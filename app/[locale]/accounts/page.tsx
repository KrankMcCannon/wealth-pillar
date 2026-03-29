/**
 * Accounts Page - Server Component
 *
 * Await page data on the server so client navigations (e.g. desktop sidebar)
 * always get resolved props instead of a cross-boundary Promise + use().
 */

import { requireGroupId, requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import AccountsContent from './accounts-content';

export default async function AccountsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);
  const groupId = requireGroupId(currentUser);

  let pageData;
  try {
    pageData = await PageDataService.getAccountsPageData(groupId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore nel caricamento degli account';
    throw new Error(message, { cause: err });
  }

  return <AccountsContent currentUser={currentUser} groupUsers={groupUsers} pageData={pageData} />;
}
