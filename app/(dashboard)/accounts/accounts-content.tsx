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
import { useFilteredAccounts, usePermissions, useUserFilter, useDeleteConfirmation } from "@/hooks";
import UserSelector from "@/components/shared/user-selector";
import { UserSelectorSkeleton } from "@/features/dashboard";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import type { Account, Category } from "@/lib/types";
import { useModalState } from "@/lib/navigation/url-state";
import { useCurrentUser, useAccounts } from "@/stores/reference-data-store";
import { useReferenceDataStore } from "@/stores/reference-data-store";

interface AccountsContentProps {
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
  accounts,
  accountBalances,
}: AccountsContentProps) {
  // Read from stores instead of props
  const currentUser = useCurrentUser();
  const storeAccounts = useAccounts();

  // Reference data store actions for optimistic updates
  const removeAccount = useReferenceDataStore((state) => state.removeAccount);
  const addAccount = useReferenceDataStore((state) => state.addAccount);

  // Early return if store not initialized
  if (!currentUser) {
    return null;
  }
  // User filtering state management (global context)
  const { setSelectedGroupFilter, selectedUserId } = useUserFilter();
  const { isMember } = usePermissions({ currentUser, selectedUserId });

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Account>();

  useEffect(() => {
    if (isMember) {
      setSelectedGroupFilter(currentUser.id);
    }
  }, [isMember, currentUser.id, setSelectedGroupFilter]);

  const { filteredAccounts } = useFilteredAccounts({
    accounts: storeAccounts,
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
  const handleEditAccount = (account: Account) => {
    openModal("account", account.id);
  };

  const handleDeleteAccount = (account: Account) => {
    deleteConfirm.openDialog(account);
  };

  const handleDeleteConfirm = async () => {
    await deleteConfirm.executeDelete(async (account) => {
      // Optimistic UI update - remove immediately from store
      removeAccount(account.id);

      try {
        const result = await deleteAccountAction(account.id);

        if (result.error) {
          // Revert on error - add back to store
          addAccount(account);
          console.error("[AccountsContent] Delete error:", result.error);
          throw new Error(result.error);
        }
        // Success - no page refresh needed, store already updated!
      } catch (error) {
        // Revert on error
        addAccount(account);
        console.error("[AccountsContent] Error deleting account:", error);
        throw error;
      }
    });
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
          <UserSelector />
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={deleteConfirm.closeDialog}
        title="Elimina Account"
        message={
          deleteConfirm.itemToDelete
            ? `Sei sicuro di voler eliminare l'account "${deleteConfirm.itemToDelete.name}"? Questa azione non può essere annullata.`
            : ""
        }
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
