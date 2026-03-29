'use client';

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { Suspense, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { BottomNavigation, PageContainer, Header, SectionHeader } from '@/components/layout';
import { PageSection } from '@/components/ui/layout';
import { AccountsList, accountStyles, useAccountsContent } from '@/features/accounts';
import { MetricCard } from '@/components/ui/layout';
import UserSelector from '@/components/shared/user-selector';
import { UserSelectorSkeleton } from '@/features/dashboard';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/services/page-data.service';
import { reportsStyles } from '@/styles/system';

interface AccountsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageData: AccountsPageData;
}

/**
 * Accounts Content Component
 * Receives user data, accounts, and balances from Server Component parent
 */
export default function AccountsContent({
  currentUser,
  groupUsers,
  pageData,
}: AccountsContentProps) {
  const { accounts, accountBalances } = pageData;
  const t = useTranslations('Accounts.Content');
  const {
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleDeleteAccount,
    deleteConfirm,
    handleDeleteConfirm,
    handleCancelDelete,
  } = useAccountsContent({
    accountBalances,
    currentUser,
    accounts,
  });

  const metricStats = useMemo(
    () => [
      { label: t('stats.total'), value: accountStats.totalAccounts, variant: 'primary' as const },
      {
        label: t('stats.positive'),
        value: accountStats.positiveAccounts,
        variant: 'success' as const,
      },
      {
        label: t('stats.negative'),
        value: accountStats.negativeAccounts,
        variant: 'destructive' as const,
      },
    ],
    [t, accountStats.totalAccounts, accountStats.positiveAccounts, accountStats.negativeAccounts]
  );

  const sectionSurface =
    'rounded-2xl border border-primary/15 bg-card/90 shadow-sm ring-1 ring-black/4 dark:ring-white/6 p-3 sm:p-4 md:p-5';

  return (
    <PageContainer>
      <Header
        title={t('headerTitle')}
        subtitle={t('headerSubtitle', { count: accountStats.totalAccounts })}
        showBack
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
      />

      <main className={reportsStyles.main.container}>
        <section aria-labelledby="accounts-section-context" className={sectionSurface}>
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="accounts-section-context"
              title={t('sectionContextTitle')}
              subtitle={t('sectionContextSubtitle')}
            />
            <Suspense fallback={<UserSelectorSkeleton />}>
              <UserSelector currentUser={currentUser} users={groupUsers} />
            </Suspense>
          </PageSection>
        </section>

        <section
          aria-labelledby="accounts-section-balance"
          className={`mt-5 sm:mt-6 ${sectionSurface}`}
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="accounts-section-balance"
              title={t('sectionBalanceTitle')}
              subtitle={t('sectionBalanceSubtitle')}
            />
            <div className={accountStyles.balanceCard.container}>
              <MetricCard
                label={t('totalBalanceLabel')}
                value={accountStats.totalBalance}
                valueType={accountStats.totalBalance >= 0 ? 'income' : 'expense'}
                valueSize="lg"
                size="sm"
                stats={metricStats}
                variant="default"
                isLoading={false}
              />
            </div>
          </PageSection>
        </section>

        <section
          aria-labelledby="accounts-section-list"
          className={`mt-5 sm:mt-6 ${sectionSurface}`}
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="accounts-section-list"
              title={t('sectionListTitle')}
              subtitle={t('sectionListSubtitle')}
            />
            <AccountsList
              accounts={sortedAccounts}
              accountBalances={filteredBalances}
              onAccountClick={handleEditAccount}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              isLoading={false}
            />
          </PageSection>
        </section>
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
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
