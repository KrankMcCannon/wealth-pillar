/**
 * Transactions Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService, CategoryService } from '@/lib/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch data in parallel for optimal performance
  const [transactionsResult, categoriesResult] = await Promise.all([
    TransactionService.getTransactionsByGroup(currentUser.group_id),
    CategoryService.getAllCategories(),
  ]);

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactionsResult.data || []}
        categories={categoriesResult.data || []}
      />
    </Suspense>
  );
}
