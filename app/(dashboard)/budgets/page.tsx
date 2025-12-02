/**
 * Budgets Page - Server Component
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { CategoryService, BudgetService, TransactionService, AccountService } from '@/lib/services';
import BudgetsContent from './budgets-content';
import { BudgetSelectorSkeleton } from '@/features/budgets/components';

export default async function BudgetsPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch categories for budget form
  const { data: categories, error: categoriesError } = await CategoryService.getAllCategories();

  if (categoriesError) {
    console.error('Failed to fetch categories:', categoriesError);
  }

  // Fetch budgets for group (cached for 5 minutes)
  const { data: budgets, error: budgetsError } = await BudgetService.getBudgetsByGroup(currentUser.group_id);

  if (budgetsError) {
    console.error('Failed to fetch budgets:', budgetsError);
  }

  // Fetch transactions for group to calculate budget balances (cached for 2 minutes)
  const { data: transactions, error: transactionsError } = await TransactionService.getTransactionsByGroup(
    currentUser.group_id
  );

  if (transactionsError) {
    console.error('Failed to fetch transactions:', transactionsError);
  }

  // Fetch accounts for transaction display
  const { data: accounts, error: accountsError } = await AccountService.getAccountsByGroup(currentUser.group_id);

  if (accountsError) {
    console.error('Failed to fetch accounts:', accountsError);
  }

  return (
    <Suspense fallback={<BudgetSelectorSkeleton />}>
      <BudgetsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        categories={categories || []}
        budgets={budgets || []}
        transactions={transactions || []}
        accounts={accounts || []}
      />
    </Suspense>
  );
}
