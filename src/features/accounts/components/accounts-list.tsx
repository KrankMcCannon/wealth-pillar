/**
 * AccountsList — lista conti (UI Stitch: righe in grouped list come home / transactions).
 */

'use client';

import { useTranslations } from 'next-intl';
import type { Account } from '@/lib';
import { AccountCard } from './account-card';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  stitchDashboardGroupedList,
  stitchHome,
  stitchRecurring,
  stitchSurface,
} from '@/styles/home-design-foundation';

function AccountCardSkeletonRow() {
  return (
    <div
      className={cn(
        stitchHome.listRowInteractive,
        'flex w-full items-center justify-between gap-3'
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Skeleton className="size-9 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          <Skeleton className="h-4 w-[55%]" />
          <Skeleton className="h-3 w-20" />
        </div>
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
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <div className={stitchDashboardGroupedList}>
        {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
          <AccountCardSkeletonRow key={id} />
        ))}
      </div>
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

  return (
    <div className={stitchDashboardGroupedList}>
      {accounts.map((account) => {
        const accountBalance = accountBalances[account.id] || 0;
        return (
          <AccountCard
            key={account.id}
            account={account}
            accountBalance={accountBalance}
            onClick={onAccountClick ? () => onAccountClick(account) : undefined}
          />
        );
      })}
    </div>
  );
};

export default AccountsList;
