/**
 * Transactions Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/lib/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all transactions page data in parallel with centralized service
  const { data, error } = await PageDataService.getTransactionsPageData(currentUser.group_id);

  if (error) {
    console.error('Failed to fetch transactions page data:', error);
  }

  const { transactions = [], categories = [], accounts = [], recurringSeries = [], budgets = [] } = data || {};

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactions}
        categories={categories}
        accounts={accounts}
        recurringSeries={recurringSeries}
        budgets={budgets}
      />
    </Suspense>
  );
}
