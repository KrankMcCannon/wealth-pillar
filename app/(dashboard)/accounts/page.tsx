"use client";

import { PageLoader } from "@/components/shared";
import { AccountCard } from "@/features/accounts";
import { useDashboardController } from "@/features/dashboard";
import { Account, formatCurrency } from "@/lib";
import { ArrowLeft, Plus, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Bank Accounts Detail Page
 * 
 * Shows all bank accounts with detailed information
 * Following ARCHITECTURE.md patterns for page structure
 */
export default function AccountsPage() {
  const router = useRouter();
  const {
    accounts,
    accountBalances,
    totalBalance,
    showInitialLoading,
  } = useDashboardController();

  if (showInitialLoading) {
    return <PageLoader />;
  }

  // Calculate statistics
  const totalAccounts = accounts?.length || 0;
  const positiveAccounts = accounts?.filter((acc: Account) => (accountBalances[acc.id] || 0) > 0).length || 0;
  const negativeAccounts = accounts?.filter((acc: Account) => (accountBalances[acc.id] || 0) < 0).length || 0;

  // Sort accounts by balance
  const sortedAccounts = [...(accounts || [])].sort((a: Account, b: Account) => {
    const balanceA = accountBalances[a.id] || 0;
    const balanceB = accountBalances[b.id] || 0;
    return balanceB - balanceA;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Bank Accounts</h1>
              <p className="text-xs text-muted-foreground">{totalAccounts} account{totalAccounts !== 1 ? 's' : ''}</p>
            </div>
          </div>
          
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            onClick={() => {/* TODO: Open add account modal */}}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Total Balance Card */}
      <div className="px-4 py-6">
        <div className="bg-card rounded-2xl p-6 border border-primary/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Saldo Totale</p>
              <p className={`text-3xl font-bold ${
                totalBalance >= 0 ? 'text-success' : 'text-destructive'
              }`}>
                {formatCurrency(totalBalance)}
              </p>
            </div>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground">Totale</p>
              </div>
              <p className="text-lg font-bold text-primary">{totalAccounts}</p>
            </div>

            <div className="bg-success/5 rounded-lg p-3 border border-success/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-success" />
                <p className="text-xs text-muted-foreground">Positivi</p>
              </div>
              <p className="text-lg font-bold text-success">{positiveAccounts}</p>
            </div>

            <div className="bg-destructive/5 rounded-lg p-3 border border-destructive/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <p className="text-xs text-muted-foreground">Negativi</p>
              </div>
              <p className="text-lg font-bold text-destructive">{negativeAccounts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts List */}
      <div className="px-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Tutti gli Account</h2>
        
        <div className="space-y-3">
          {sortedAccounts.map((account: Account) => {
            const accountBalance = accountBalances[account.id] || 0;
            
            return (
              <div key={account.id} className="w-full">
                <AccountCard
                  account={account}
                  accountBalance={accountBalance}
                  onClick={() => {/* TODO: Open account detail */}}
                />
              </div>
            );
          })}

          {sortedAccounts.length === 0 && (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <p className="text-muted-foreground mb-2">Nessun account trovato</p>
              <p className="text-sm text-muted-foreground/70">Aggiungi il tuo primo bank account</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
