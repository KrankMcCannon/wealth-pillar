"use client";

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { AccountHeader, TotalBalanceCard, AccountsList, accountStyles } from "@/features/accounts";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";

/**
 * Accounts Content Component
 * Receives user data from Server Component parent
 */
export default function AccountsContent({ currentUser, groupUsers }: DashboardDataProps) {
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
