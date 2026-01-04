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

  const {
    transactions = [],
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = []
  } = data || {};

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        transactions={transactions}
        recurringSeries={recurringSeries}
        budgets={budgets}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
      />
    </Suspense>
  );
}
