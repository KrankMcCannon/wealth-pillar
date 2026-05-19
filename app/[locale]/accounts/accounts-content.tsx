'use client';

/**
 * Accounts Content — client UI (Stitch dark, una sola shell “card” per sezione).
 */

import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AppPage, SectionHeader } from '@/components/layout';
import { AccountsList, useAccountsContent } from '@/features/accounts';
import { Amount } from '@/components/ui/primitives';
import UserSelector from '@/components/shared/user-selector';
import { Button } from '@/components/ui';
import { useModalState } from '@/lib/navigation/url-state';
import { cn } from '@/lib/utils';
import type { User } from '@/lib/types';
import type { AccountsPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import { stitchAccounts } from '@/styles/home-design-foundation';

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
  const { accounts, accountBalances } = pageData;
  const t = useTranslations('Accounts.Content');
  const { openModal } = useModalState();
  const { isMember, accountStats, sortedAccounts, filteredBalances, handleEditAccount } =
    useAccountsContent({
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
  const balancePositive = accountStats.totalBalance >= 0;

  return (
    <AppPage currentUser={currentUser} title={t('headerTitle')} showBack showActions>
      <main className={stitchAccounts.mainStack}>
        <section aria-labelledby="accounts-section-context" className={stitchAccounts.surfaceQuiet}>
          <div className="space-y-3">
            <SectionHeader
              titleId="accounts-section-context"
              title={t('sectionContextTitle')}
              subtitle={t('sectionContextSubtitle')}
              titleClassName={stitchAccounts.sectionTitle}
              subtitleClassName={stitchAccounts.sectionSubtitle}
            />
            {isMember ? (
              <p className={stitchAccounts.memberBanner} role="status">
                {t('memberViewBanner')}
              </p>
            ) : null}
            <UserSelector hideTitle currentUser={currentUser} users={groupUsers} />
          </div>
        </section>

        <section
          aria-labelledby="accounts-section-balance"
          className={cn('relative', stitchAccounts.heroNetWorthCard)}
        >
          <div className={stitchAccounts.heroNetWorthDecor} aria-hidden />
          <div className="relative z-1 space-y-3">
            <SectionHeader
              titleId="accounts-section-balance"
              title={t('sectionBalanceTitle')}
              subtitle={t('sectionBalanceSubtitle')}
              titleClassName={stitchAccounts.sectionTitle}
              subtitleClassName={stitchAccounts.sectionSubtitle}
            />
            <div>
              <p className={stitchAccounts.sectionEyebrow}>{t('totalBalanceLabel')}</p>
              <Amount
                type={balancePositive ? 'income' : 'expense'}
                emphasis="strong"
                currency
                className={cn(
                  balancePositive
                    ? stitchAccounts.balanceAmount
                    : stitchAccounts.balanceAmountNegative,
                  'mt-1 block'
                )}
              >
                {Math.abs(accountStats.totalBalance)}
              </Amount>
            </div>
            {showBalanceBreakdown ? (
              <div className={stitchAccounts.statsGrid}>
                {metricStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      stitchAccounts.statItem,
                      stat.variant === 'primary' && stitchAccounts.statItemPrimary,
                      stat.variant === 'success' && stitchAccounts.statItemSuccess,
                      stat.variant === 'destructive' && stitchAccounts.statItemDestructive
                    )}
                  >
                    <span className={stitchAccounts.statLabel}>{stat.label}</span>
                    <span
                      className={cn(
                        stat.variant === 'success' && stitchAccounts.statValueSuccess,
                        stat.variant === 'destructive' && stitchAccounts.statValueDestructive,
                        stat.variant === 'primary' && stitchAccounts.statValue
                      )}
                    >
                      {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section aria-labelledby="accounts-section-list" className={stitchAccounts.surfaceEmphasis}>
          <div className="space-y-3">
            <SectionHeader
              titleId="accounts-section-list"
              title={t('sectionListTitle')}
              subtitle={t('sectionListSubtitle')}
              titleClassName={stitchAccounts.sectionTitle}
              subtitleClassName={stitchAccounts.sectionSubtitle}
              actions={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn('shrink-0 gap-1.5', stitchAccounts.outlineAction)}
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
              hideListHeading
            />
          </div>
        </section>
      </main>
    </AppPage>
  );
}
