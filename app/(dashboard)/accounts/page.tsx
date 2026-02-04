/**
 * Accounts Page - Server Component
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';
import { PageDataService } from '@/server/services';
import AccountsContent from './accounts-content';
import { AccountHeaderSkeleton } from '@/features/accounts/components/account-skeletons';

export default async function AccountsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/auth');
  const groupUsers = await getGroupUsers();

  // Fetch accounts page data and categories in parallel
  const pageData = await PageDataService.getAccountsPageData(currentUser.group_id || '');

  const { accountBalances = {}, accounts = [] } = pageData;

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent
        accountBalances={accountBalances}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
      />
    </Suspense>
  );
}
