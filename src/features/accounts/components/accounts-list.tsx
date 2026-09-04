/**
 * AccountsList — Home-density rows grouped by account type.
 */

'use client';

import { useTranslations } from 'next-intl';
import type { Account } from '@/lib';
import { AccountCard } from './account-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  stitchHome,
  stitchRecurring,
  stitchSurface,
  stitchTransactions,
} from '@/styles/home-design-foundation';
import { groupAccountsByType } from '../utils/group-accounts-by-type';

function AccountCardSkeletonRow() {
  return (
    <div className={stitchHome.plainRow}>
      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-[55%]" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

interface AccountsListProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick?: (account: Account) => void;
  onAddAccount?: () => void;
  isLoading?: boolean;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
  onAddAccount,
  isLoading = false,
}: Readonly<AccountsListProps>) => {
  const t = useTranslations('Accounts.List');
  const tContent = useTranslations('Accounts.Content');
  const tCard = useTranslations('Accounts.Card');
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <ul className={stitchHome.plainList}>
        {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
          <li key={id}>
            <AccountCardSkeletonRow />
          </li>
        ))}
      </ul>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={stitchRecurring.emptyState} role="status" aria-live="polite">
        <p className={stitchRecurring.emptyTitle}>{t('empty.title')}</p>
        <p className={stitchRecurring.emptyDescription}>{t('empty.description')}</p>
        {onAddAccount ? (
          <div className={stitchRecurring.emptyActions}>
            <button type="button" onClick={onAddAccount} className={stitchSurface.primaryCta}>
              {tContent('addAccountCta')}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  const groups = groupAccountsByType(accounts);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => {
        const headingId = `accounts-type-${group.type}`;
        return (
          <section key={group.type} className="flex flex-col gap-1.5" aria-labelledby={headingId}>
            <h2 id={headingId} className={stitchTransactions.dayHeaderTitle}>
              {tCard(`accountTypes.${group.type}`)}
            </h2>
            <ul className={stitchHome.plainList}>
              {group.accounts.map((account) => {
                const accountBalance = accountBalances[account.id] || 0;
                return (
                  <li key={account.id}>
                    <AccountCard
                      account={account}
                      accountBalance={accountBalance}
                      onClick={onAccountClick ? () => onAccountClick(account) : undefined}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
};

export default AccountsList;
