'use client';

/**
 * Accounts — Statement layout: spendable hero, rows grouped by account type.
 */

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { HomeDashboardMain } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
import { AccountsList, useAccountsContent } from '@/features/accounts';
import { Amount } from '@/components/ui/primitives';
import UserSelector from '@/components/shared/user-selector';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { stitchHome } from '@/styles/home-design-foundation';

interface AccountsContentProps {
  currentUser: User;
  groupUsers: User[];
  pageData: AccountsPageData;
}

export default function AccountsContent({
  currentUser,
  groupUsers,
  pageData,
}: AccountsContentProps) {
  const accounts = useReferenceDataStore((state) => state.accounts);
  const refreshAccounts = useReferenceDataStore((state) => state.refreshAccounts);

  useEffect(() => {
    refreshAccounts(pageData.accounts);
  }, [pageData.accounts, refreshAccounts]);

  const t = useTranslations('Accounts.Content');
  const {
    selectedUserId,
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleOpenAccount,
    handleUserFilterChange,
    openModal,
  } = useAccountsContent({
    currentUser,
    accounts,
  });

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  usePageHeader({
    title: t('headerTitle'),
    backHref: '/home',
  });

  const negative = accountStats.spendableBalance < 0;
  const onAddAccount = () => openModal('account');

  return (
    <HomeDashboardMain id="main-accounts" className="gap-5 pt-3">
      {showUserPicker ? (
        <UserSelector
          hideTitle
          currentUser={currentUser}
          users={groupUsers}
          value={selectedUserId ?? 'all'}
          onChange={handleUserFilterChange}
        />
      ) : null}

      {sortedAccounts.length > 0 ? (
        <header className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <p className={stitchHome.sectionEyebrow}>{t('spendableBalanceLabel')}</p>
            <button
              type="button"
              onClick={onAddAccount}
              className={cn(stitchHome.viewAllLink, 'min-w-0')}
              data-testid="accounts-add"
            >
              {t('addAccountCta')}
            </button>
          </div>
          <p aria-live="polite">
            <Amount
              type={negative ? 'expense' : 'balance'}
              size="2xl"
              emphasis="strong"
              className="text-[2.75rem] leading-none tracking-[-0.04em]"
            >
              {accountStats.spendableBalance}
            </Amount>
          </p>
          <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">{t('reserveBalanceLabel')}</dt>
            <dd className="text-right">
              <Amount type={accountStats.reserveBalance < 0 ? 'expense' : 'balance'} size="sm">
                {accountStats.reserveBalance}
              </Amount>
            </dd>
            <dt className="text-muted-foreground">{t('totalBalanceLabel')}</dt>
            <dd className="text-right">
              <Amount type={accountStats.totalBalance < 0 ? 'expense' : 'balance'} size="sm">
                {accountStats.totalBalance}
              </Amount>
            </dd>
          </dl>
          <details className="mt-1 text-sm text-muted-foreground">
            <summary className="min-h-11 cursor-pointer content-center focus-visible:outline-2 focus-visible:outline-ring">
              {t('balanceCompositionLabel')}
            </summary>
            <p>{t('balanceCompositionDescription')}</p>
          </details>
        </header>
      ) : null}

      <AccountsList
        accounts={sortedAccounts}
        accountBalances={filteredBalances}
        onAccountClick={handleOpenAccount}
        onAddAccount={onAddAccount}
      />
    </HomeDashboardMain>
  );
}
