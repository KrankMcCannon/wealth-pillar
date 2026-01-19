/**
 * Transactions Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { PageDataService } from '@/server/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all transactions page data in parallel with centralized service
  const pageData = await PageDataService.getTransactionsPageData(currentUser.group_id || '');

  const {
    transactions = [],
    recurringSeries = [],
    budgets = [],
    accounts = [],
    categories = []
  } = pageData;

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
