"use client";

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { useMemo } from "react";
import {
  AccountHeader,
  TotalBalanceCard,
  AccountsList,
  createAccountsViewModel,
  accountStyles,
} from "@/features/accounts";
import { useDashboardData } from "@/features/dashboard";
import { useUserSelection } from "@/src/lib";

/**
 * Accounts Content Component
 * Separated to enable proper Suspense boundaries
 * Data is fetched client-side via TanStack Query with parallel execution
 */
export default function AccountsContent() {
  const { currentUser, selectedViewUserId } = useUserSelection();
  const data = useDashboardData(currentUser, selectedViewUserId);

  // Create view model from raw data
  const viewModel = useMemo(
    () =>
      createAccountsViewModel(
        data.accounts.data,
        data.accountBalances
      ),
    [data.accounts.data, data.accountBalances]
  );

  return (
    <div className={accountStyles.page.container}>
      {/* Header Section - shows skeleton while loading */}
      <AccountHeader
        totalAccounts={viewModel.totalAccounts}
        onAddAccount={() => {
          /* TODO: Open add account modal */
        }}
        isLoading={data.accounts.isLoading}
      />

      {/* Total Balance Card Section - shows skeleton while loading */}
      <TotalBalanceCard
        totalBalance={data.totalBalance}
        totalAccounts={viewModel.totalAccounts}
        positiveAccounts={viewModel.positiveAccounts}
        negativeAccounts={viewModel.negativeAccounts}
        isLoading={data.accounts.isLoading}
      />

      {/* Accounts List Section - shows individual card skeletons while loading */}
      <AccountsList
        accounts={viewModel.sortedAccounts}
        accountBalances={data.accountBalances}
        onAccountClick={() => {
          /* TODO: Open account detail */
        }}
        isLoading={data.accounts.isLoading}
      />
    </div>
  );
}
