/**
 * Dashboard Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { AccountService, TransactionService, BudgetService, RecurringService, CategoryService } from '@/lib/services';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch all data in parallel (each cached with appropriate TTL)
  const [accountsResult, transactionsResult, budgetsResult, recurringResult, categoriesResult] = await Promise.all([
    AccountService.getAccountsByGroup(currentUser.group_id),
    TransactionService.getTransactionsByGroup(currentUser.group_id),
    BudgetService.getBudgetsByGroup(currentUser.group_id),
    RecurringService.getSeriesByGroup(currentUser.group_id),
    CategoryService.getAllCategories(),
  ]);

  if (accountsResult.error) {
    console.error('Failed to fetch accounts:', accountsResult.error);
  }

  if (transactionsResult.error) {
    console.error('Failed to fetch transactions:', transactionsResult.error);
  }

  if (budgetsResult.error) {
    console.error('Failed to fetch budgets:', budgetsResult.error);
  }

  if (recurringResult.error) {
    console.error('Failed to fetch recurring series:', recurringResult.error);
  }

  // Calculate balances for all accounts
  const accountIds = (accountsResult.data || []).map((account) => account.id);
  const accountBalances = AccountService.calculateAccountBalances(accountIds, transactionsResult.data || []);

  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accountsResult.data || []}
        accountBalances={accountBalances}
        transactions={transactionsResult.data || []}
        budgets={budgetsResult.data || []}
        recurringSeries={recurringResult.data || []}
        categories={categoriesResult.data || []}
      />
    </Suspense>
  );
}
