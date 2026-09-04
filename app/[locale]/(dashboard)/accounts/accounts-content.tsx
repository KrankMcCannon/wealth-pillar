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
import { PeopleChips } from '@/features/transactions/components/filter-dock';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { stitchAccounts, stitchHome } from '@/styles/home-design-foundation';

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
  const { accountBalances } = pageData;
  const refreshAccounts = useReferenceDataStore((state) => state.refreshAccounts);

  useEffect(() => {
    refreshAccounts(pageData.accounts);
  }, [pageData.accounts, refreshAccounts]);

  const accounts = pageData.accounts;
  const t = useTranslations('Accounts.Content');
  const tLedger = useTranslations('TransactionsContent.Ledger');
  const tUsers = useTranslations('UserSelector');
  const {
    isMember,
    selectedUserId,
    accountStats,
    sortedAccounts,
    filteredBalances,
    handleEditAccount,
    handleUserFilterChange,
    openModal,
  } = useAccountsContent({
    accountBalances,
    currentUser,
    accounts,
    statsAll: pageData.statsAll,
    statsByUserId: pageData.statsByUserId,
  });

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  usePageHeader({
    title: t('headerTitle'),
    showBack: true,
    isDashboard: false,
  });

  const negative = accountStats.spendableBalance < 0;
  const onAddAccount = () => openModal('account');

  return (
    <HomeDashboardMain id="main-accounts" className="gap-5 pt-3">
      {showUserPicker ? (
        <PeopleChips
          label={tLedger('filterWho')}
          ariaLabel={tLedger('usersAria')}
          allLabel={tUsers('all')}
          peopleAria={(name) => tUsers('selectUserAria', { name })}
          groupUsers={groupUsers}
          selectedUserId={selectedUserId}
          onUserFilterChange={handleUserFilterChange}
        />
      ) : null}

      {isMember ? (
        <p className={stitchAccounts.memberBanner} role="status">
          {t('memberViewBanner')}
        </p>
      ) : null}

      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t('spendableBalanceLabel')}
          </p>
          <button
            type="button"
            onClick={onAddAccount}
            className={cn(stitchHome.viewAllLink, 'min-h-8 min-w-0 py-0')}
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
        {accountStats.reserveBalance !== 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('reserveBalanceLabel')}:{' '}
            <Amount type="balance" size="sm" className="inline text-foreground">
              {accountStats.reserveBalance}
            </Amount>
          </p>
        ) : null}
      </header>

      <AccountsList
        accounts={sortedAccounts}
        accountBalances={filteredBalances}
        onAccountClick={handleEditAccount}
        onAddAccount={onAddAccount}
      />
    </HomeDashboardMain>
  );
}
