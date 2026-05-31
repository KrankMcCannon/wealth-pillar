'use client';

/**
 * Accounts Content — Stitch dark, aligned with home / transactions / recurring.
 */

import { useMemo, useEffect } from 'react';
import { CreditCard, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppPage, PageFab, SectionHeader } from '@/components/layout';
import { HomeSectionCard } from '@/components/home';
import { AccountsList, useAccountsContent } from '@/features/accounts';
import { Amount } from '@/components/ui/primitives';
import { UserFilterChipRow } from '@/features/transactions/components/user-filter-chip-row';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { stitchAccounts, stitchHome, stitchTransactions } from '@/styles/home-design-foundation';

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
  const storeAccounts = useAccounts();
  const refreshAccounts = useReferenceDataStore((state) => state.refreshAccounts);

  useEffect(() => {
    refreshAccounts(pageData.accounts);
  }, [pageData.accounts, refreshAccounts]);

  const accounts = storeAccounts.length > 0 ? storeAccounts : pageData.accounts;
  const t = useTranslations('Accounts.Content');
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

  const metricStats = useMemo(
    () => [
      {
        label: t('stats.positive'),
        value: accountStats.positiveAccounts,
        variant: 'success' as const,
        Icon: TrendingUp,
        itemClass: stitchAccounts.statMiniItemSuccess,
        iconWrap: stitchAccounts.statMiniIconWrapSuccess,
        iconClass: stitchAccounts.statMiniIconSuccess,
        valueClass: stitchAccounts.statMiniValueSuccess,
      },
      {
        label: t('stats.negative'),
        value: accountStats.negativeAccounts,
        variant: 'destructive' as const,
        Icon: TrendingDown,
        itemClass: stitchAccounts.statMiniItemDestructive,
        iconWrap: stitchAccounts.statMiniIconWrapDestructive,
        iconClass: stitchAccounts.statMiniIconDestructive,
        valueClass: stitchAccounts.statMiniValueDestructive,
      },
      {
        label: t('stats.total'),
        value: accountStats.totalAccounts,
        variant: 'primary' as const,
        Icon: Landmark,
        itemClass: stitchAccounts.statMiniItemPrimary,
        iconWrap: stitchAccounts.statMiniIconWrap,
        iconClass: stitchAccounts.statMiniIcon,
        valueClass: stitchAccounts.statMiniValue,
      },
    ],
    [t, accountStats.totalAccounts, accountStats.positiveAccounts, accountStats.negativeAccounts]
  );

  const showBalanceBreakdown = accountStats.totalAccounts > 1;
  const balancePositive = accountStats.totalBalance >= 0;

  return (
    <AppPage
      currentUser={currentUser}
      title={t('headerTitle')}
      showBack
      skipToMainHref="#main-accounts"
      skipToMainLabel={t('headerTitle')}
      dashboardMain
      mainId="main-accounts"
      afterMain={
        <PageFab
          onClick={() => openModal('account')}
          ariaLabel={t('addAccountCta')}
          testId="accounts-fab-add"
        />
      }
    >
      <div className={stitchTransactions.mainStack}>
        {showUserPicker ? (
          <UserFilterChipRow
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

        <HomeSectionCard aria-labelledby="accounts-section-balance" className="space-y-2">
          <div className={stitchAccounts.summaryHeaderLeft}>
            <div className={stitchAccounts.summaryIconWrap}>
              <CreditCard className={stitchAccounts.summaryIcon} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="accounts-section-balance" className={stitchAccounts.summaryTitle}>
                {t('sectionBalanceTitle')}
              </h2>
              <p className={stitchAccounts.summarySubtitle}>
                {t('headerSubtitle', { count: accountStats.totalAccounts })}
              </p>
            </div>
          </div>

          <div className={stitchAccounts.balanceMetaRow}>
            <span className={stitchAccounts.balanceMetaLine}>
              <span>{t('spendableBalanceLabel')}</span>
              <Amount
                type={accountStats.spendableBalance >= 0 ? 'income' : 'expense'}
                size="sm"
                emphasis="strong"
                className="inline"
              >
                {Math.abs(accountStats.spendableBalance)}
              </Amount>
            </span>
            <span className={stitchAccounts.balanceMetaLine}>
              <span>{t('reserveBalanceLabel')}</span>
              <Amount type="balance" size="sm" className="inline">
                {accountStats.reserveBalance}
              </Amount>
            </span>
            <span className={stitchAccounts.balanceMetaLine}>
              <span>{t('totalBalanceLabel')}</span>
              <Amount type={balancePositive ? 'income' : 'expense'} size="sm" className="inline">
                {Math.abs(accountStats.totalBalance)}
              </Amount>
            </span>
          </div>

          {showBalanceBreakdown ? (
            <div className={stitchAccounts.statMiniGrid}>
              {metricStats.map((stat) => (
                <div key={stat.label} className={cn(stitchAccounts.statMiniItem, stat.itemClass)}>
                  <div className={stitchAccounts.statMiniHeader}>
                    <div className={stat.iconWrap}>
                      <stat.Icon className={stat.iconClass} aria-hidden />
                    </div>
                    <p className={stitchAccounts.statMiniLabel}>{stat.label}</p>
                  </div>
                  <p className={stat.valueClass}>
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </HomeSectionCard>

        <HomeSectionCard aria-labelledby="accounts-section-list">
          <SectionHeader
            titleId="accounts-section-list"
            title={t('sectionListTitle')}
            subtitle={t('sectionListSubtitle')}
            className="pb-1"
            titleClassName={stitchHome.sectionHeaderTitle}
            subtitleClassName={stitchHome.sectionHeaderSubtitle}
          />
          <AccountsList
            accounts={sortedAccounts}
            accountBalances={filteredBalances}
            onAccountClick={handleEditAccount}
            onAddAccount={() => openModal('account')}
          />
        </HomeSectionCard>
      </div>
    </AppPage>
  );
}
