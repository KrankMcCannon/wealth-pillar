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
import {
  stitchAccounts,
  stitchHome,
  stitchRecurring,
  stitchTransactions,
} from '@/styles/home-design-foundation';

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
        label: t('stats.total'),
        value: accountStats.totalAccounts,
        variant: 'primary' as const,
        Icon: Landmark,
        iconWrap: stitchRecurring.statIconWrap,
        iconClass: stitchRecurring.statIcon,
        valueClass: stitchRecurring.statValue,
      },
      {
        label: t('stats.positive'),
        value: accountStats.positiveAccounts,
        variant: 'success' as const,
        Icon: TrendingUp,
        iconWrap: stitchRecurring.statIconWrapSuccess,
        iconClass: stitchRecurring.statIconSuccess,
        valueClass: stitchRecurring.statValueSuccess,
      },
      {
        label: t('stats.negative'),
        value: accountStats.negativeAccounts,
        variant: 'destructive' as const,
        Icon: TrendingDown,
        iconWrap: stitchRecurring.statIconWrapDestructive,
        iconClass: stitchRecurring.statIconDestructive,
        valueClass: stitchRecurring.statValueDestructive,
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

        <HomeSectionCard aria-labelledby="accounts-section-balance">
          <div className={stitchRecurring.summaryHeaderRow}>
            <div className={stitchRecurring.summaryIconWrap}>
              <CreditCard className={stitchRecurring.summaryIcon} aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 id="accounts-section-balance" className={stitchRecurring.summaryTitle}>
                {t('sectionBalanceTitle')}
              </h2>
              <p className={stitchRecurring.summarySubtitle}>
                {t('headerSubtitle', { count: accountStats.totalAccounts })}
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            <div>
              <p className={stitchHome.sectionEyebrow}>{t('spendableBalanceLabel')}</p>
              <Amount
                type={accountStats.spendableBalance >= 0 ? 'income' : 'expense'}
                emphasis="strong"
                currency
                className={cn(
                  accountStats.spendableBalance >= 0
                    ? stitchHome.balanceHero
                    : stitchHome.balanceHeroNegative,
                  'mt-1 block'
                )}
              >
                {Math.abs(accountStats.spendableBalance)}
              </Amount>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>
                {t('reserveBalanceLabel')}:{' '}
                <Amount type="balance" size="sm" className="inline">
                  {accountStats.reserveBalance}
                </Amount>
              </span>
              <span>
                {t('totalBalanceLabel')}:{' '}
                <Amount type={balancePositive ? 'income' : 'expense'} size="sm" className="inline">
                  {Math.abs(accountStats.totalBalance)}
                </Amount>
              </span>
            </div>
          </div>

          {showBalanceBreakdown ? (
            <div className={stitchRecurring.statsGrid}>
              {metricStats.map((stat) => (
                <div
                  key={stat.label}
                  className={cn(
                    stitchRecurring.statItem,
                    stat.variant === 'primary' && stitchRecurring.statItemPrimary,
                    stat.variant === 'success' && stitchRecurring.statItemSuccess,
                    stat.variant === 'destructive' && stitchRecurring.statItemDestructive
                  )}
                >
                  <div className={stat.iconWrap}>
                    <stat.Icon className={stat.iconClass} aria-hidden />
                  </div>
                  <p className={stitchRecurring.statLabel}>{stat.label}</p>
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
