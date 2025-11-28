/**
 * Reports Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 * Business logic is handled by TransactionService and CategoryService following SOLID principles
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
    AccountService.getAccountsByGroup(currentUser.group_id),
  ]);

  // Calculate metrics using business logic in service layer
  const metrics = TransactionService.calculateReportMetrics(transactionsResult.data || []);

  // Reuse the same balance calculation used by Accounts/Dashboard pages
  const accounts = accountsResult.data || [];
  const transactions = transactionsResult.data || [];
  const accountBalances = AccountService.calculateAccountBalances(
    accounts.map((account) => account.id),
    transactions
  );

  return (
    <Suspense fallback={<PageLoader message="Caricamento report..." />}>
      <ReportsContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        accountBalances={accountBalances}
        transactions={transactions}
        categories={categoriesResult.data || []}
        initialMetrics={metrics}
      />
    </Suspense>
  );
}
