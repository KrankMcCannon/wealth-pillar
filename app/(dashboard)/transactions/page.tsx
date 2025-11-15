/**
 * Transactions Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent currentUser={currentUser} groupUsers={groupUsers} />
    </Suspense>
  );
}
