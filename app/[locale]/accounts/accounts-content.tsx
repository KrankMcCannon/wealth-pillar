'use client';

/**
 * Accounts Content - Client Component
 *
 * Handles interactive accounts UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { BottomNavigation, PageContainer, Header, SectionHeader } from '@/components/layout';
import { PageSection } from '@/components/ui/layout';
import { AccountsList, accountStyles, useAccountsContent } from '@/features/accounts';
import { MetricCard } from '@/components/ui/layout';
import UserSelector from '@/components/shared/user-selector';
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog';
import { Button } from '@/components/ui';
import { useModalState } from '@/lib/navigation/url-state';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
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
  const { openModal } = useModalState();
  const {
    isMember,
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

  const showBalanceBreakdown = accountStats.totalAccounts > 1;

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
        <section
          aria-labelledby="accounts-section-context"
          className={reportsStyles.section.surfaceQuiet}
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="accounts-section-context"
              title={t('sectionContextTitle')}
              subtitle={t('sectionContextSubtitle')}
            />
            {isMember ? (
              <p
                className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 text-sm leading-snug text-primary/90"
                role="status"
              >
                {t('memberViewBanner')}
              </p>
            ) : null}
            <UserSelector hideTitle currentUser={currentUser} users={groupUsers} />
          </PageSection>
        </section>

        <section
          aria-labelledby="accounts-section-balance"
          className={reportsStyles.section.surface}
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
                variant="default"
                {...(showBalanceBreakdown ? { stats: metricStats } : {})}
              />
            </div>
          </PageSection>
        </section>

        <section
          aria-labelledby="accounts-section-list"
          className={reportsStyles.section.surfaceEmphasis}
        >
          <PageSection className="space-y-3 sm:space-y-4">
            <SectionHeader
              titleId="accounts-section-list"
              title={t('sectionListTitle')}
              subtitle={t('sectionListSubtitle')}
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => openModal('account')}
                >
                  <Plus className="size-4 shrink-0" aria-hidden />
                  {t('addAccountCta')}
                </Button>
              }
            />
            <AccountsList
              accounts={sortedAccounts}
              accountBalances={filteredBalances}
              onAccountClick={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              hideListHeading
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
            : t('dialogs.delete.messageFallback')
        }
        confirmText={t('dialogs.delete.confirm')}
        cancelText={t('dialogs.delete.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
