"use client";

import { Suspense, useMemo } from "react";
import {
  AccountHeader,
  TotalBalanceCard,
  AccountsList,
  AccountHeaderSkeleton,
  BalanceCardSkeleton,
  AccountListSkeleton,
  createAccountsViewModel,
  accountStyles,
} from "@/features/accounts";
import { useDashboardData } from "@/features/dashboard";
import { useUserSelection } from "@/src/lib";

/**
 * Accounts Content Component
 * Orchestrates the account page with data fetching and layout
 * Separated to enable proper Suspense boundaries
 */
function AccountsContent() {
  const { currentUser, selectedViewUserId } = useUserSelection();
  const data = useDashboardData(selectedViewUserId, currentUser);

  // Create view model from raw data
  const viewModel = useMemo(
    () =>
      createAccountsViewModel(
        data.accounts.data || [],
        data.accountBalances
      ),
    [data.accounts.data, data.accountBalances]
  );

  return (
    <div className={accountStyles.page.container}>
      {/* Header Section */}
      <Suspense fallback={<AccountHeaderSkeleton />}>
        <AccountHeader
          totalAccounts={viewModel.totalAccounts}
          onAddAccount={() => {
            /* TODO: Open add account modal */
          }}
        />
      </Suspense>

      {/* Total Balance Card Section */}
      <Suspense fallback={<BalanceCardSkeleton />}>
        <TotalBalanceCard
          totalBalance={data.totalBalance}
          totalAccounts={viewModel.totalAccounts}
          positiveAccounts={viewModel.positiveAccounts}
          negativeAccounts={viewModel.negativeAccounts}
        />
      </Suspense>

      {/* Accounts List Section */}
      <Suspense fallback={<AccountListSkeleton />}>
        <AccountsList
          accounts={viewModel.sortedAccounts}
          accountBalances={data.accountBalances}
          onAccountClick={() => {
            /* TODO: Open account detail */
          }}
        />
      </Suspense>
    </div>
  );
}

/**
 * Bank Accounts Detail Page
 *
 * Shows all bank accounts with detailed information
 * Implements progressive loading with skeleton screens and reusable components
 * Following ARCHITECTURE.md patterns for page structure
 */
export default function AccountsPage() {
  return (
    <Suspense fallback={<AccountHeaderSkeleton />}>
      <AccountsContent />
    </Suspense>
  );
}
