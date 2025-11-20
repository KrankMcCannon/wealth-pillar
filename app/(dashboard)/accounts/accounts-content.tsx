"use client";

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { useMemo } from "react";
import { AccountHeader, TotalBalanceCard, AccountsList, accountStyles } from "@/features/accounts";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Account } from "@/lib/types";

interface AccountsContentProps extends DashboardDataProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
}

/**
 * Accounts Content Component
 * Receives user data, accounts, and balances from Server Component parent
 */
export default function AccountsContent({ accounts, accountBalances }: AccountsContentProps) {
  // Sort accounts by balance (descending - highest first)
  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const balanceA = accountBalances[a.id] || 0;
      const balanceB = accountBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [accounts, accountBalances]);

  // Calculate account statistics from balances
  const accountStats = useMemo(() => {
    const totalBalance = Object.values(accountBalances).reduce((sum, balance) => sum + balance, 0);
    const positiveAccounts = Object.values(accountBalances).filter((balance) => balance > 0).length;
    const negativeAccounts = Object.values(accountBalances).filter((balance) => balance < 0).length;

    return {
      totalBalance,
      totalAccounts: accounts.length,
      positiveAccounts,
      negativeAccounts,
    };
  }, [accounts.length, accountBalances]);

  return (
    <div className={accountStyles.page.container}>
      {/* Header Section */}
      <AccountHeader
        totalAccounts={accountStats.totalAccounts}
        onAddAccount={() => {
          /* TODO: Open add account modal */
        }}
        isLoading={false}
      />

      {/* Total Balance Card Section */}
      <TotalBalanceCard
        totalBalance={accountStats.totalBalance}
        totalAccounts={accountStats.totalAccounts}
        positiveAccounts={accountStats.positiveAccounts}
        negativeAccounts={accountStats.negativeAccounts}
        isLoading={false}
      />

      {/* Accounts List Section */}
      <AccountsList
        accounts={sortedAccounts}
        accountBalances={accountBalances}
        onAccountClick={() => {
          /* TODO: Open account detail */
        }}
        isLoading={false}
      />
    </div>
  );
}
