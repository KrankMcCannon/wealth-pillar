'use client';

import { useEffect, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { HomeDashboardMain } from '@/components/layout';
import { Amount } from '@/components/ui/primitives';
import { Button } from '@/components/ui';
import { usePageHeader } from '@/hooks/use-page-header';
import { Link } from '@/i18n/routing';
import { useModalState } from '@/lib/navigation/url-state';
import { withReturnTo } from '@/lib/navigation/return-to';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import { TransactionRow } from '@/features/transactions/components/transaction-row';
import { groupByDay } from '@/features/transactions/utils/group-by-day';
import { useTransactionEditStore } from '@/features/transactions/stores/transaction-edit-store';
import { getCategoryLabel } from '@/server/use-cases/categories/category.logic';
import type { AccountDetailPageData } from '@/server/use-cases/pages/accounts-page.use-case';
import { useReferenceDataStore } from '@/stores/reference-data-store';
import { stitchHome, stitchTransactions } from '@/styles/home-design-foundation';

export default function AccountDetailContent({
  pageData,
  selectedUserId,
}: Readonly<{ pageData: AccountDetailPageData; selectedUserId: string | undefined }>) {
  const t = useTranslations('Accounts.Detail');
  const tCard = useTranslations('Accounts.Card');
  const locale = useLocale();
  const { openModal } = useModalState();
  const setTransactionSeed = useTransactionEditStore((state) => state.setSeed);
  const storeAccount = useReferenceDataStore((state) =>
    state.accounts.find((account) => account.id === pageData.account.id)
  );
  const refreshAccounts = useReferenceDataStore((state) => state.refreshAccounts);
  useEffect(() => {
    refreshAccounts(pageData.accounts);
  }, [pageData.accounts, refreshAccounts]);
  const account = storeAccount ?? pageData.account;
  const context = new URLSearchParams();
  if (selectedUserId) context.set('user', selectedUserId);
  const contextQuery = context.toString();
  const accountsHref = `/accounts${contextQuery ? `?${contextQuery}` : ''}`;
  const detailHref = `/accounts/${encodeURIComponent(account.id)}${contextQuery ? `?${contextQuery}` : ''}`;
  context.set('account', account.id);
  const ledgerHref = withReturnTo(`/transactions?${context.toString()}`, detailHref);
  const accountNames = useMemo(
    () => Object.fromEntries(pageData.accounts.map((item) => [item.id, item.name])),
    [pageData.accounts]
  );
  const dayGroups = useMemo(
    () => groupByDay(pageData.transactions, locale, account.id),
    [pageData.transactions, locale, account.id]
  );
  usePageHeader({ title: account.name, showBack: true, backHref: accountsHref });

  return (
    <HomeDashboardMain id="main-account-detail" className="gap-6 pt-3">
      <header className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {tCard(`accountTypes.${account.type}`)} ·{' '}
          {tCard(`liquidity.${resolveAccountLiquidity(account)}`)}
        </p>
        <p className={stitchHome.sectionEyebrow}>{t('currentBalance')}</p>
        <p aria-live="polite">
          <Amount
            type={(account.balance ?? 0) < 0 ? 'expense' : 'balance'}
            size="2xl"
            emphasis="strong"
          >
            {account.balance ?? 0}
          </Amount>
        </p>
        <div>
          <Button variant="outline" onClick={() => openModal('account', account.id)}>
            {t('editAccount')}
          </Button>
        </div>
      </header>
      <section aria-labelledby="account-transactions-heading" className="flex flex-col gap-3">
        <div className={stitchHome.scanSectionHeader}>
          <h2 id="account-transactions-heading" className={stitchHome.scanSectionTitle}>
            {t('recentTransactions')}
          </h2>
          <Link href={ledgerHref} className={stitchHome.viewAllLink}>
            {t('viewAll')}
          </Link>
        </div>
        {dayGroups.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('emptyTransactions')}</p>
        ) : (
          dayGroups.map((group) => (
            <section key={group.isoDate} aria-label={group.formattedDate}>
              <h3 className={stitchTransactions.dayHeaderTitle}>{group.formattedDate}</h3>
              <ul className={stitchHome.plainList}>
                {group.transactions.map((transaction) => (
                  <li key={transaction.id}>
                    <TransactionRow
                      transaction={transaction}
                      selectedAccountId={account.id}
                      accountNames={accountNames}
                      getCategoryLabel={(key) => getCategoryLabel(pageData.categories, key)}
                      onEditTransaction={(item) => {
                        setTransactionSeed(item);
                        openModal('transaction', item.id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </section>
    </HomeDashboardMain>
  );
}
