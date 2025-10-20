"use client";

import { Suspense } from 'react';
import { CreditCard } from "lucide-react";
import { BankAccountCard } from "@/components/bank-account-card";
import { formatCurrency } from "@/lib/utils";
import { BalanceSectionSkeleton } from './dashboard-skeleton';
import type { Account } from "@/lib/types";

interface BalanceSectionProps {
  accounts: Account[];
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
  accountBalances,
  totalBalance,
  onAccountClick,
  isLoading
}: BalanceSectionProps) => {
  if (isLoading) {
    return <BalanceSectionSkeleton />;
  }

  // Sort accounts by balance for better UX
  const sortedAccounts = [...accounts].sort((a: Account, b: Account) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });

  return (
    <section className="bg-card p-4 shadow-sm">
      {/* Mobile-First Total Balance Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs mb-1 font-medium">Saldo Totale</p>
          <p className={`text-xl font-bold transition-colors duration-300 ${
            totalBalance >= 0
              ? 'text-accent'
              : 'text-destructive'
          }`}>
            {totalBalance >= 0 ? '' : '-'}
            {formatCurrency(Math.abs(totalBalance))}
          </p>
        </div>

        {/* Compact Account Count */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-full border border-primary/20">
          <CreditCard className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-primary">
            {accounts.length}
          </span>
        </div>
      </div>

      {/* Enhanced Horizontal Bank Accounts Slider */}
      <div className="overflow-x-auto scrollbar-hide">
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
            <div className="flex-shrink-0 w-60 h-24 bg-gradient-to-br from-primary/10 to-card rounded-lg animate-pulse border border-primary/20" />
                }>
                  <BankAccountCard
                    account={account}
                    accountBalance={accountBalance}
                    onClick={() => onAccountClick(account.id)}
                  />
                </Suspense>
              </div>
            );
          })}

          {/* Add Account Placeholder (for future enhancement) */}
          {accounts.length === 0 && (
            <div className="flex-shrink-0 w-60 h-24 border-2 border-dashed border-primary/30 rounded-lg flex items-center justify-center bg-gradient-to-br from-card to-primary/10 hover:border-primary/40 hover:bg-gradient-to-br hover:from-primary/5 hover:to-primary/10 transition-all duration-300 cursor-pointer group">
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

    </section>
  );
};

export default BalanceSection;
