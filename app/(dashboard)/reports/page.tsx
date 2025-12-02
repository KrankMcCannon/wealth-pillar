/**
 * Reports Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService, CategoryService, AccountService } from '@/lib/services';
import { PageLoader } from '@/src/components/shared';
import ReportsContent from './reports-content';

export default async function ReportsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch data in parallel for optimal performance
  const [transactionsResult, categoriesResult, accountsResult] = await Promise.all([
    TransactionService.getTransactionsByGroup(currentUser.group_id),
    CategoryService.getAllCategories(),
    AccountService.getAccountsByGroup(currentUser.group_id)
  ]);

  const accounts = accountsResult.data || [];
  const categories = categoriesResult.data || [];
  const transactions = transactionsResult.data || [];

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        transactions={transactions}
        categories={categories}
      />
    </Suspense>
  );
}
