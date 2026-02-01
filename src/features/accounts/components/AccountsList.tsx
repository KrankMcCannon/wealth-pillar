/**
 * AccountsList Component
 * Displays list of accounts or empty state
 * Shows individual account card skeletons while loading
 */

'use client';

import { CreditCard } from 'lucide-react';
import type { Account } from '@/lib';
import { AccountCard } from '@/components/cards';
import { EmptyState } from '@/components/shared';
import { accountStyles } from '../theme/account-styles';
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

/**
 * Skeleton for individual account card
 */
function AccountCardSkeleton() {
  return (
    <div className={`${accountStyles.skeleton.list.item} ${SHIMMER_BASE}`}>
      <div className={accountStyles.skeleton.list.row}>
        <div className={accountStyles.skeleton.list.left}>
          <div className={accountStyles.skeleton.list.icon} />
          <div className={accountStyles.skeleton.list.body}>
            <div className={accountStyles.skeleton.list.line} />
            <div className={accountStyles.skeleton.list.subline} />
          </div>
        </div>
        <div className={accountStyles.skeleton.list.right}>
          <div className={accountStyles.skeleton.list.amount} />
          <div className={accountStyles.skeleton.list.amountSub} />
        </div>
      </div>
    </div>
  );
}

interface AccountsListProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick?: (account: Account) => void;
  onEditAccount?: (account: Account) => void;
  onDeleteAccount?: (account: Account) => void;
  isLoading?: boolean;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
  onEditAccount,
  onDeleteAccount,
  isLoading = false,
}: Readonly<AccountsListProps>) => {
  // Show skeleton only if actively loading AND no data received yet
  // With placeholderData, empty array exists immediately, so check both conditions
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <div className={accountStyles.accountsList.container}>
        <h2 className={accountStyles.accountsList.header}>Tutti gli Account</h2>
        <div className={accountStyles.accountsList.items}>
          {['skeleton-1', 'skeleton-2', 'skeleton-3'].map((id) => (
            <div key={id} className={accountStyles.list.cardWrapper}>
              <AccountCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state when no accounts and not loading
  if (accounts.length === 0) {
    return (
      <div className={accountStyles.accountsList.container}>
        <h2 className={accountStyles.accountsList.header}>Tutti gli Account</h2>
        <EmptyState
          icon={CreditCard}
          title="Nessun account trovato"
          description="Aggiungi il tuo primo bank account"
        />
      </div>
    );
  }

  // Show actual accounts
  return (
    <div className={accountStyles.accountsList.container}>
      <h2 className={accountStyles.accountsList.header}>Tutti gli Account</h2>

      <div className={accountStyles.accountsList.items}>
        <div className={accountStyles.accountsList.groupCard}>
          <div className={accountStyles.accountsList.groupItems}>
            {accounts.map((account) => {
              const accountBalance = accountBalances[account.id] || 0;

              return (
                <div key={account.id} className={accountStyles.list.cardWrapper}>
                  <AccountCard
                    account={account}
                    accountBalance={accountBalance}
                    onClick={onAccountClick ? () => onAccountClick(account) : undefined}
                    onEdit={onEditAccount ? () => onEditAccount(account) : undefined}
                    onDelete={onDeleteAccount ? () => onDeleteAccount(account) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsList;
