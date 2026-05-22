/**
 * AccountsList — lista conti (UI Stitch: righe flush dentro la card padre).
 */

'use client';

import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Account } from '@/lib';
import { AccountCard } from './account-card';
import { EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { stitchAccounts, stitchHome } from '@/styles/home-design-foundation';

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
  isLoading?: boolean;
  hideListHeading?: boolean;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
  isLoading = false,
  hideListHeading = false,
}: Readonly<AccountsListProps>) => {
  const t = useTranslations('Accounts.List');
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <div className="divide-y divide-border/25">
        {!hideListHeading ? (
          <h2 className={cn(stitchAccounts.sectionTitle, 'pb-3')}>{t('header')}</h2>
        ) : null}
        {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
          <AccountCardSkeletonRow key={id} />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className={stitchHome.emptyWell}>
        <EmptyState
          icon={CreditCard}
          title={t('empty.title')}
          description={t('empty.description')}
        />
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/25">
      {!hideListHeading ? (
        <h2 className={cn(stitchAccounts.sectionTitle, 'pb-3')}>{t('header')}</h2>
      ) : null}
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
