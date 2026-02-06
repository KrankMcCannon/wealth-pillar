'use client';

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('Accounts.Content');
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
        title={t('headerTitle')}
        subtitle={t('headerSubtitle', { count: accountStats.totalAccounts })}
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
          label={t('totalBalanceLabel')}
          value={accountStats.totalBalance}
          valueType={accountStats.totalBalance >= 0 ? 'income' : 'expense'}
          valueSize="lg"
          size="sm"
          stats={[
            { label: t('stats.total'), value: accountStats.totalAccounts, variant: 'primary' },
            { label: t('stats.positive'), value: accountStats.positiveAccounts, variant: 'success' },
            {
              label: t('stats.negative'),
              value: accountStats.negativeAccounts,
              variant: 'destructive',
            },
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
        title={t('dialogs.delete.title')}
        message={
          deleteConfirm.itemToDelete
            ? t('dialogs.delete.message', { name: deleteConfirm.itemToDelete.name })
            : ''
        }
        confirmText={t('dialogs.delete.confirm')}
        cancelText={t('dialogs.delete.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
