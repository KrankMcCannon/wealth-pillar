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
import { deleteAccountAction } from "@/features/accounts/actions/account-actions";
import { useFilteredAccounts, usePermissions, useUserFilter } from "@/hooks";
import UserSelector from "@/components/shared/user-selector";
import { UserSelectorSkeleton } from "@/features/dashboard";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Account, Category } from "@/lib/types";
import { Plus } from "lucide-react";
import { useModalState } from "@/lib/navigation/modal-params";

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
}: AccountsContentProps) {
  // User filtering state management (global context)
  const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const { isMember } = usePermissions({ currentUser, selectedUserId });

  // Modal state management (URL-based)
  const { openModal } = useModalState();

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

  // Action Handlers
  const handleCreateAccount = () => {
    openModal("account");
  };

  const handleEditAccount = (account: Account) => {
    openModal("account", account.id);
  };

  const handleDeleteAccount = async (account: Account) => {
    if (confirm(`Sei sicuro di voler eliminare l'account "${account.name}"? Questa azione non può essere annullata.`)) {
      try {
        const result = await deleteAccountAction(account.id);
        if (result.error) {
          alert(`Errore: ${result.error}`);
        }
        // Success is handled by revalidation
      } catch (error) {
        alert("Si è verificato un errore durante l'eliminazione dell'account.");
      }
    }
  };
  return (
    <PageContainer className={accountStyles.page.container}>
      <div className="flex-1">
        {/* Header Section */}
        <Header
          title="Bank Accounts"
          subtitle={`${accountStats.totalAccounts} account${accountStats.totalAccounts === 1 ? '' : 's'}`}
          showBack={true}
          className={accountStyles.header.container}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
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
          onAccountClick={handleEditAccount}
          onEditAccount={handleEditAccount}
          onDeleteAccount={handleDeleteAccount}
          isLoading={false}
        />
      </div>

      <BottomNavigation />
    </PageContainer>
  );
}
