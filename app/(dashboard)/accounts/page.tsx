/**
 * Accounts Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import AccountsContent from './accounts-content';
import { AccountHeaderSkeleton } from '@/features/accounts/components/account-skeletons';

export default async function AccountsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
