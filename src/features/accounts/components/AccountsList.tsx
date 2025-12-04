/**
 * AccountsList Component
 * Displays list of accounts or empty state
 * Shows individual account card skeletons while loading
 */

'use client';

import { CreditCard } from 'lucide-react';
import { Account } from '@/lib';
import { AccountCard } from '@/components/cards';
import { EmptyState } from '@/components/shared';
import { accountStyles } from '../theme/account-styles';
import { SHIMMER_BASE } from "@/lib/utils/ui-constants";

/**
 * Skeleton for individual account card
 */
function AccountCardSkeleton() {
  return (
    <div className={`p-4 rounded-lg border border-primary/20 bg-card ${SHIMMER_BASE}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-muted rounded-lg" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded mb-2" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="text-right">
          <div className="h-4 w-20 bg-muted rounded mb-1" />
          <div className="h-3 w-16 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}

interface AccountsListProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick: (accountId: string) => void;
  isLoading?: boolean;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
  isLoading = false,
}: AccountsListProps) => {
  // Show skeleton only if actively loading AND no data received yet
  // With placeholderData, empty array exists immediately, so check both conditions
  const isInitialLoading = isLoading && (!accounts || accounts.length === 0);

  if (isInitialLoading) {
    return (
      <div className={accountStyles.accountsList.container}>
        <h2 className={accountStyles.accountsList.header}>Tutti gli Account</h2>
        <div className={accountStyles.accountsList.items}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-full">
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
        {accounts.map((account) => {
          const accountBalance = accountBalances[account.id] || 0;

          return (
            <div key={account.id} className="w-full">
              <AccountCard
                account={account}
                accountBalance={accountBalance}
                onClick={() => onAccountClick(account.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AccountsList;
