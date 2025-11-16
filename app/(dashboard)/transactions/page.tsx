/**
 * Transactions Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService } from '@/lib/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all transactions for the group (client-side filtering by user will be done in content component)
  const { data: transactions } = await TransactionService.getTransactionsByGroup(
    currentUser.group_id
  );

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactions || []}
      />
    </Suspense>
  );
}
