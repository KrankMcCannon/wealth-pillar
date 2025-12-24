"use client";

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useEffect, useMemo } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { TotalBalanceCard, AccountsList, accountStyles } from "@/features/accounts";
import { useFilteredAccounts, usePermissions, useUserFilter } from "@/hooks";
import UserSelector from "@/components/shared/user-selector";
import { UserSelectorSkeleton } from "@/features/dashboard";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Account, Category } from "@/lib/types";

interface AccountsContentProps extends DashboardDataProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  initialUserId?: string;
  categories: Category[];
}

/**
 * Accounts Content Component
 * Receives user data, accounts, and balances from Server Component parent
 */
export default function AccountsContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  initialUserId,
  categories,
}: AccountsContentProps) {
  const initialFilter = initialUserId || "all";
  const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter(initialFilter);
  const { isMember } = usePermissions({ currentUser, selectedUserId });

  useEffect(() => {
    if (isMember) {
      setSelectedGroupFilter(currentUser.id);
    }
  }, [isMember, currentUser.id, setSelectedGroupFilter]);

  const { filteredAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId: isMember ? currentUser.id : selectedUserId,
  });

  const filteredBalances = useMemo(() => {
    const accountIds = new Set(filteredAccounts.map((account) => account.id));
    return Object.fromEntries(Object.entries(accountBalances).filter(([accountId]) => accountIds.has(accountId)));
  }, [filteredAccounts, accountBalances]);

  // Sort accounts by balance (descending - highest first)
  const sortedAccounts = useMemo(() => {
    return [...filteredAccounts].sort((a, b) => {
      const balanceA = filteredBalances[a.id] || 0;
      const balanceB = filteredBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [filteredAccounts, filteredBalances]);

  // Calculate account statistics from balances
  const accountStats = useMemo(() => {
    const totalBalance = Object.values(filteredBalances).reduce((sum, balance) => sum + balance, 0);
    const positiveAccounts = Object.values(filteredBalances).filter((balance) => balance > 0).length;
    const negativeAccounts = Object.values(filteredBalances).filter((balance) => balance < 0).length;

    return {
      totalBalance,
      totalAccounts: filteredAccounts.length,
      positiveAccounts,
      negativeAccounts,
    };
  }, [filteredAccounts.length, filteredBalances]);

  return (
    <PageContainer className={accountStyles.page.container}>
      <div className="flex-1">
        {/* Header Section */}
        <Header
          title="Bank Accounts"
          subtitle={`${accountStats.totalAccounts} account${accountStats.totalAccounts === 1 ? '' : 's'}`}
          showBack={true}
          className={accountStyles.header.container}
          data={{
            currentUser: { ...currentUser, role: currentUser.role || 'member' },
            groupUsers,
            accounts,
            categories,
            groupId: currentUser.group_id
          }}
        />

        {/* User Selector */}
        <Suspense fallback={<UserSelectorSkeleton />}>
          <UserSelector
            users={groupUsers}
            currentUser={currentUser}
            selectedGroupFilter={selectedGroupFilter}
            onGroupFilterChange={setSelectedGroupFilter}
          />
        </Suspense>

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
          accountBalances={filteredBalances}
          onAccountClick={() => {
            /* TODO: Open account detail */
          }}
          isLoading={false}
        />
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
