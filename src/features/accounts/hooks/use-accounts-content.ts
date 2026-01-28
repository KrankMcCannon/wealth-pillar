"use client";

import { useEffect, useMemo } from "react";
import { useFilteredAccounts, usePermissions, useUserFilter, useDeleteConfirmation } from "@/hooks";
import { deleteAccountAction } from "@/features/accounts/actions/account-actions";
import { useModalState } from "@/lib/navigation/url-state";
import { useReferenceDataStore } from "@/stores/reference-data-store";
import type { Account, User } from "@/lib/types";

export interface UseAccountsContentProps {
  accountBalances: Record<string, number>;
  currentUser: User;
  accounts: Account[];
}

export function useAccountsContent({
  accountBalances,
  currentUser,
  accounts,
}: UseAccountsContentProps) {
  // Reference data store actions for optimistic updates
  const removeAccount = useReferenceDataStore((state) => state.removeAccount);
  const addAccount = useReferenceDataStore((state) => state.addAccount);

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
    accounts,
    currentUser,
    selectedUserId: isMember ? currentUser.id : selectedUserId,
  });

  const filteredBalances = useMemo(() => {
    return filteredAccounts.reduce((acc, account) => {
      if (accountBalances[account.id] !== undefined) {
        acc[account.id] = accountBalances[account.id];
      }
      return acc;
    }, {} as Record<string, number>);
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
    return Object.values(filteredBalances).reduce(
      (stats, balance) => {
        stats.totalBalance += balance;
        if (balance > 0) {
          stats.positiveAccounts += 1;
        } else if (balance < 0) {
          stats.negativeAccounts += 1;
        }
        return stats;
      },
      {
        totalBalance: 0,
        totalAccounts: filteredAccounts.length,
        positiveAccounts: 0,
        negativeAccounts: 0,
      }
    );
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

  return {
    currentUser,
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleDeleteAccount,
    deleteConfirm,
    handleDeleteConfirm,
  };
}
