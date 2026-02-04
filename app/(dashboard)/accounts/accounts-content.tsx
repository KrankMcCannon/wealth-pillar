'use client';

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense } from 'react';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import { AccountsList, accountStyles, useAccountsContent } from '@/features/accounts';
import { MetricCard } from '@/components/ui/layout';
import UserSelector from '@/components/shared/user-selector';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import type { Account, User } from '@/lib/types';

interface AccountsContentProps {
  accountBalances: Record<string, number>;
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
}

/**
 * Accounts Content Component
 * Receives user data, accounts, and balances from Server Component parent
 */
export default function AccountsContent({
  accountBalances,
  currentUser,
  groupUsers,
  accounts,
}: AccountsContentProps) {
  const {
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleDeleteAccount,
    deleteConfirm,
    handleDeleteConfirm,
  } = useAccountsContent({
    accountBalances,
    currentUser,
    accounts,
  });

  return (
    <PageContainer className={accountStyles.page.container}>
      {/* Header Section */}
      <Header
        title="Bank Accounts"
        subtitle={`${accountStats.totalAccounts} account${accountStats.totalAccounts === 1 ? '' : 's'}`}
        showBack={true}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions={true}
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector currentUser={currentUser} users={groupUsers} />
      </Suspense>

      {/* Total Balance Card Section */}
      <div className={accountStyles.balanceCard.container}>
        <MetricCard
          label="Saldo Totale"
          value={accountStats.totalBalance}
          valueType={accountStats.totalBalance >= 0 ? 'income' : 'expense'}
          valueSize="lg"
          size="sm"
          stats={[
            { label: 'Totale', value: accountStats.totalAccounts, variant: 'primary' },
            { label: 'Positivi', value: accountStats.positiveAccounts, variant: 'success' },
            { label: 'Negativi', value: accountStats.negativeAccounts, variant: 'destructive' },
          ]}
          variant="highlighted"
          isLoading={false}
        />
      </div>

      {/* Accounts List Section */}
      <AccountsList
        accounts={sortedAccounts}
        accountBalances={filteredBalances}
        onAccountClick={handleEditAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
        isLoading={false}
      />

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
            : ''
        }
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
