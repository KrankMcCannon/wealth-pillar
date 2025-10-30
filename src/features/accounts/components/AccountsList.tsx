/**
 * AccountsList Component
 * Displays list of accounts or empty state
 */

'use client';

import { CreditCard } from 'lucide-react';
import { Account } from '@/lib';
import { AccountCard } from '@/components/cards';
import { accountStyles } from '../theme/account-styles';

interface AccountsListProps {
  accounts: Account[];
  accountBalances: Record<string, number>;
  onAccountClick: (accountId: string) => void;
}

export const AccountsList = ({
  accounts,
  accountBalances,
  onAccountClick,
}: AccountsListProps) => {
  if (accounts.length === 0) {
    return (
      <div className={accountStyles.accountsList.container}>
        <h2 className={accountStyles.accountsList.header}>Tutti gli Account</h2>
        <div className={accountStyles.emptyState.container}>
          <div className={accountStyles.emptyState.icon}>
            <CreditCard className={accountStyles.emptyState.iconContent} />
          </div>
          <p className={accountStyles.emptyState.title}>Nessun account trovato</p>
          <p className={accountStyles.emptyState.subtitle}>Aggiungi il tuo primo bank account</p>
        </div>
      </div>
    );
  }

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
