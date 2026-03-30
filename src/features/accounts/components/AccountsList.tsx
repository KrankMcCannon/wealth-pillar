/**
 * AccountsList Component
 * Displays list of accounts or empty state
 * Shows individual account card skeletons while loading
 */

'use client';

import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Account } from '@/lib';
import { AccountCard } from '@/components/cards';
import { EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { accountStyles } from '../theme/account-styles';
import { transactionStyles } from '@/styles/system';
import { SHIMMER_BASE } from '@/lib/utils/ui-constants';

/**
 * Skeleton for individual account card
 */
function AccountCardSkeleton() {
  const ms = transactionStyles.transactionTable.mobile;
  return (
    <div className={cn(ms.skeleton.row, SHIMMER_BASE)}>
      <div className={ms.skeleton.icon} />
      <div className={ms.skeleton.body}>
        <div className={ms.skeleton.line} />
        <div className={cn(ms.skeleton.lineSub, 'max-w-[40%]')} />
      </div>
      <div className={ms.skeleton.amount} />
    </div>
  );
}

interface AccountsListProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick?: (account: Account) => void;
  onDeleteAccount?: (account: Account) => void;
  isLoading?: boolean;
  /** Se true, non renderizza l’h2 del titolo lista (es. quando il padre usa già `SectionHeader`) */
  hideListHeading?: boolean;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
  onDeleteAccount,
  isLoading = false,
  hideListHeading = false,
}: Readonly<AccountsListProps>) => {
  const t = useTranslations('Accounts.List');
  const listCardGroup = cn(
    transactionStyles.transactionTable.mobile.cardGroup,
    'divide-y divide-primary/[0.06]'
  );
  const emptyListWrap = transactionStyles.transactionTable.mobile.emptyWrapper;
  // Show skeleton only if actively loading AND no data received yet
  // With placeholderData, empty array exists immediately, so check both conditions
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <div className={accountStyles.accountsList.container}>
        {!hideListHeading && <h2 className={accountStyles.accountsList.header}>{t('header')}</h2>}
        <div className={accountStyles.accountsList.items}>
          <div className={listCardGroup}>
            {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
              <AccountCardSkeleton key={id} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show empty state when no accounts and not loading
  if (accounts.length === 0) {
    return (
      <div className={accountStyles.accountsList.container}>
        {!hideListHeading && <h2 className={accountStyles.accountsList.header}>{t('header')}</h2>}
        <div className={emptyListWrap}>
          <EmptyState
            icon={CreditCard}
            title={t('empty.title')}
            description={t('empty.description')}
          />
        </div>
      </div>
    );
  }

  // Show actual accounts
  return (
    <div className={accountStyles.accountsList.container}>
      {!hideListHeading && <h2 className={accountStyles.accountsList.header}>{t('header')}</h2>}

      <div className={accountStyles.accountsList.items}>
        <div className={listCardGroup}>
          {accounts.map((account) => {
            const accountBalance = accountBalances[account.id] || 0;

            return (
              <AccountCard
                key={account.id}
                account={account}
                accountBalance={accountBalance}
                onClick={onAccountClick ? () => onAccountClick(account) : undefined}
                onDelete={onDeleteAccount ? () => onDeleteAccount(account) : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AccountsList;
