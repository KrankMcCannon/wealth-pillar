"use client";

import { Suspense } from 'react';
import { CreditCard, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';
import { Account, formatCurrency, User } from '@/lib';
import { BalanceSectionSkeleton } from '@/features/dashboard';
import { AccountCard } from './account-card';

interface BalanceSectionProps {
  accounts: Account[];
  users: User[];
  accountBalances: Record<string, number>;
  totalBalance: number;
  onAccountClick: (id: string) => void;
  isLoading?: boolean;
}

/**
 * Balance section component - handles account balances display
 * Follows Single Responsibility Principle - only handles balance UI
 */
export const BalanceSection = ({
  accounts,
  users,
  accountBalances,
  totalBalance,
  onAccountClick,
  isLoading
}: BalanceSectionProps) => {
  const router = useRouter();

  if (isLoading) {
    return <BalanceSectionSkeleton />;
  }

  // Filter to show only default accounts (payment methods)
  // An account is default if it matches any user's default_account_id
  const defaultAccountIds = new Set(
    users
      .map(user => user.default_account_id)
      .filter((id): id is string => id !== undefined && id !== null)
  );

  const defaultAccounts = accounts.filter(account => 
    defaultAccountIds.has(account.id)
  );

  // Sort accounts by balance for better UX
  const sortedAccounts = [...defaultAccounts].sort((a: Account, b: Account) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });

  return (
    <section className="bg-card p-4 shadow-sm">
      {/* Enhanced Horizontal Bank Accounts Slider */}
      <div className="overflow-x-auto scrollbar-hide mb-4">
        <div className="flex gap-3 pb-2" style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {sortedAccounts.map((account: Account, index) => {
            const accountBalance = accountBalances[account.id] || 0;

            return (
              <div
                key={account.id}
                className="transform transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:shadow-muted/30"
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <Suspense fallback={
            <div className="flex-shrink-0 w-60 h-24 bg-primary/10 rounded-lg animate-pulse border border-primary/20" />
                }>
                  <AccountCard
                    account={account}
                    accountBalance={accountBalance}
                    onClick={() => onAccountClick(account.id)}
                  />
                </Suspense>
              </div>
            );
          })}

          {/* Add Account Placeholder (for future enhancement) */}
          {sortedAccounts.length === 0 && (
            <div className="flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center bg-primary/5 hover:border-primary/40 hover:bg-primary/10 transition-all duration-300 cursor-pointer group">
              <div className="text-center">
                <CreditCard className="h-6 w-6 text-primary/70 group-hover:text-primary mx-auto mb-1 transition-colors" />
                <p className="text-xs text-primary/70 group-hover:text-primary font-medium transition-colors">
                  Aggiungi Account
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Total Balance - Now below cards */}
      <div 
        className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20 cursor-pointer hover:bg-primary/10 transition-all duration-300 group"
        onClick={() => router.push('/accounts')}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs mb-1 font-medium text-muted-foreground">Saldo Totale</p>
            <p className={`text-xl font-bold transition-colors duration-300 ${
              totalBalance >= 0
                ? 'text-success'
                : 'text-destructive'
            }`}>
              {formatCurrency(totalBalance)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-xs font-bold text-primary">
              {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
            </span>
          </div>
          <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </div>

    </section>
  );
};

export default BalanceSection;
