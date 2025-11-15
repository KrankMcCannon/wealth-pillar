"use client";

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is pre-hydrated from server via HydrationBoundary
 */

import { AccountHeader, TotalBalanceCard, AccountsList, accountStyles } from "@/features/accounts";

/**
 * Accounts Content Component
 * Separated to enable proper Suspense boundaries
 * Data is fetched client-side via TanStack Query with parallel execution
 */
export default function AccountsContent() {
  return (
    <div className={accountStyles.page.container}>
      {/* Header Section - shows skeleton while loading */}
      <AccountHeader
        totalAccounts={0}
        onAddAccount={() => {
          /* TODO: Open add account modal */
        }}
        isLoading={false}
      />

      {/* Total Balance Card Section - shows skeleton while loading */}
      <TotalBalanceCard
        totalBalance={0}
        totalAccounts={0}
        positiveAccounts={0}
        negativeAccounts={0}
        isLoading={false}
      />

      {/* Accounts List Section - shows individual card skeletons while loading */}
      <AccountsList
        accounts={[]}
        accountBalances={{}}
        onAccountClick={() => {
          /* TODO: Open account detail */
        }}
        isLoading={false}
      />
    </div>
  );
}
