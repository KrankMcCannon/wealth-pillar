/**
 * Accounts Page - Server Component
 */

import { Suspense } from 'react';
import { requirePageAuth } from '@/lib/auth/page-auth';
import { PageDataService } from '@/server/services';
import AccountsContent from './accounts-content';
import { AccountHeaderSkeleton } from '@/features/accounts/components/account-skeletons';

export default async function AccountsPage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>) {
  const { currentUser, groupUsers } = await requirePageAuth(params);

  const pageDataPromise = PageDataService.getAccountsPageData(currentUser.group_id || '').catch(
    (err) => {
      const message = err instanceof Error ? err.message : 'Errore nel caricamento degli account';
      throw new Error(message, { cause: err });
    }
  );

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        pageDataPromise={pageDataPromise}
      />
    </Suspense>
  );
}
