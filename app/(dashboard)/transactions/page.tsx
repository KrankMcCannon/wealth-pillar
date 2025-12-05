/**
 * Transactions Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { TransactionService, CategoryService, AccountService, RecurringService, BudgetService } from '@/lib/services';
import TransactionsContent from './transactions-content';
import TransactionPageLoading from './loading';

export default async function TransactionsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch data in parallel for optimal performance
  const [transactionsResult, categoriesResult, accountsResult, recurringResult, budgetsResult] = await Promise.all([
    TransactionService.getTransactionsByGroup(currentUser.group_id),
    CategoryService.getAllCategories(),
    AccountService.getAccountsByGroup(currentUser.group_id),
    RecurringService.getSeriesByGroup(currentUser.group_id),
    BudgetService.getBudgetsByGroup(currentUser.group_id),
  ]);

  return (
    <Suspense fallback={<TransactionPageLoading />}>
      <TransactionsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        transactions={transactionsResult.data || []}
        categories={categoriesResult.data || []}
        accounts={accountsResult.data || []}
        recurringSeries={recurringResult.data || []}
        budgets={budgetsResult.data || []}
      />
    </Suspense>
  );
}
