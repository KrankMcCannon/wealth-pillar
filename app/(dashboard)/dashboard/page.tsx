/**
 * Dashboard Page - Server Component
 * Uses shared utility for consistent data fetching across all dashboard pages
 */

import { Suspense } from 'react';
import { getDashboardData } from '@/lib/auth/get-dashboard-data';
import { AccountService, TransactionService } from '@/lib/services';
import DashboardContent from './dashboard-content';
import DashboardPageLoading from './loading';

export default async function DashboardPage() {
  const { currentUser, groupUsers } = await getDashboardData();

  // Fetch accounts for group (cached for 5 minutes)
  const { data: accounts, error: accountsError } = await AccountService.getAccountsByGroup(currentUser.group_id);

  if (accountsError) {
    console.error('Failed to fetch accounts:', accountsError);
  }

  // Fetch transactions for group to calculate balances (cached for 2 minutes)
  const { data: transactions, error: transactionsError } = await TransactionService.getTransactionsByGroup(
    currentUser.group_id
  );

  if (transactionsError) {
    console.error('Failed to fetch transactions:', transactionsError);
  }

  // Calculate balances for all accounts
  const accountIds = (accounts || []).map((account) => account.id);
  const accountBalances = AccountService.calculateAccountBalances(accountIds, transactions || []);

  return (
    <Suspense fallback={<DashboardPageLoading />}>
      <DashboardContent
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts || []}
        accountBalances={accountBalances}
        transactions={transactions || []}
      />
    </Suspense>
  );
}
