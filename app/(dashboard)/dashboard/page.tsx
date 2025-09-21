"use client";

import { CreditCard, Settings, Bell, ChevronRight, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { SectionHeader } from "@/components/section-header";
import { GroupedTransactionCard } from "@/components/grouped-transaction-card";
import { BudgetCard } from "@/components/budget-card";
import { BankAccountCard } from "@/components/bank-account-card";
import ErrorBoundary, { QueryErrorFallback, FinancialLoadingSkeleton } from "@/components/error-boundary";
import { formatCurrency } from "@/lib/utils";
import type { Account, Budget } from "@/lib/types";
import { useDashboardData } from "@/hooks/useDashboard";
import { useUserSelection } from "@/hooks";

export default function DashboardPage() {
  const router = useRouter();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  // Use centralized user selection
  const {
    currentUser,
    selectedGroupFilter,
    users,
    updateGroupFilter,
    isLoading: userSelectionLoading
  } = useUserSelection();

  const {
    accounts: bankAccounts,
    budgets,
    upcomingTransactions,
    accountBalances,
    totalBalance,
    budgetData,
    budgetPeriodsMap,
    accountNames,
    isLoading,
    isError,
    errors,
  } = useDashboardData(selectedGroupFilter);

  const handleAccountClick = useCallback((id: string) => {
    setExpandedAccount(expandedAccount === id ? null : id);
  }, [expandedAccount]);


  // Enhanced loading state with skeleton
  if (isLoading || userSelectionLoading) {
    return (
      <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
        {/* Header skeleton */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm animate-pulse">
                <div className="h-4 w-4 sm:h-5 sm:w-5 bg-gray-300 rounded"></div>
              </div>
              <div className="flex flex-col space-y-2">
                <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-10 h-10 bg-gray-300 rounded-xl animate-pulse"></div>
              <div className="w-10 h-10 bg-gray-300 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* User selector skeleton */}
        <div className="p-4 bg-white border-b">
          <div className="h-12 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>

        {/* Content skeleton */}
        <main className="pb-16 p-4">
          <FinancialLoadingSkeleton type="dashboard" />
        </main>

        <BottomNavigation />
      </div>
    );
  }

  // Enhanced error handling
  if (isError && errors.length > 0) {
    return (
      <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 shadow-sm">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm sm:text-base font-bold tracking-tight text-red-600">
                  Errore di Connessione
                </p>
                <p className="text-xs sm:text-sm font-semibold text-red-500">Dati non disponibili</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <QueryErrorFallback
            error={errors[0]}
            reset={() => window.location.reload()}
            title="Errore nel caricamento della dashboard"
            description="Si è verificato un errore durante il caricamento dei dati finanziari. Verifica la connessione internet e riprova."
          />
        </main>

        <BottomNavigation />
      </div>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Dashboard Error:', error, errorInfo);
        // Here you could send to error reporting service
      }}
    >
      <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
        <div>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left - User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-[#7578EC]" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  {currentUser?.name || 'Utente'}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-[#7578EC]">Premium Plan</p>
              </div>
            </div>

            {/* Right - Settings and Notifications */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-[#7578EC]/10 text-[#7578EC] hover:text-[#7578EC] rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105 hover:shadow-md shadow-[#7578EC]/20">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 group-hover:animate-pulse" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-[#7578EC]/10 text-[#7578EC] hover:text-[#7578EC] rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center group hover:scale-105 hover:shadow-md shadow-[#7578EC]/20"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </header>

        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={updateGroupFilter}
        />

        <main className="pb-16">
          {/* Total Balance Section - Different Background */}
          <section className="bg-white p-3 shadow-sm">
            {/* Total Balance and Bank Accounts Count */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Saldo Totale</p>
                <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalBalance >= 0 ? '' : '-'}{formatCurrency(Math.abs(totalBalance))}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#7578EC]" />
                <p className="text-sm text-gray-600">{bankAccounts.length}</p>
              </div>
            </div>

            {/* Horizontal Bank Accounts Slider */}
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2">
                {bankAccounts.map((account: Account) => {
                  const accountBalance = accountBalances[account.id] || 0;

                  return (
                    <BankAccountCard
                      key={account.id}
                      account={account}
                      accountBalance={accountBalance}
                      onClick={() => handleAccountClick(account.id)}
                    />
                  );
                })}
              </div>
            </div>
          </section>

          {/* Divider Line */}
          <div className="h-px bg-gray-200 mx-4"></div>

          {/* Lower Sections with Different Background */}
          <div className="bg-[#F8FAFC] px-3 pt-3">
            {/* Budget Section */}
            <section className="mb-3">
              <SectionHeader
                title="Budget"
                className="mb-3"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs font-medium text-primary hover:text-white hover:bg-primary rounded-xl transition-all duration-300 px-3 py-2 group shadow-sm hover:shadow-md hover:shadow-primary/25 hover:scale-105"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedGroupFilter !== 'all') {
                      params.set('member', selectedGroupFilter);
                    }
                    const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
                    router.push(url);
                  }}
                >
                  <span className="budget-button-text">Vai a</span>
                  <ChevronRight className="ml-1.5 h-3 w-3 budget-icon group-hover:translate-x-1 transition-all duration-300" />
                </Button>
              </SectionHeader>

              {budgets.length > 0 ? (
                <Card className="bg-white shadow-sm border border-gray-200 py-0">
                  <div className="divide-y divide-gray-100">
                    {budgets.map((budget: Budget) => {
                      const budgetInfo = budgetData.find(b => b.id === budget.id);
                      const mappedBudgetInfo = budgetInfo ? {
                        id: budgetInfo.id,
                        spent: budgetInfo.spent,
                        remaining: budgetInfo.remaining,
                        progress: budgetInfo.percentage
                      } : undefined;

                      return (
                        <BudgetCard
                          key={budget.id}
                          budget={budget}
                          budgetInfo={mappedBudgetInfo}
                          currentPeriod={budgetPeriodsMap[budget.id] || null}
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('budget', budget.id);
                            if (selectedGroupFilter !== 'all') {
                              params.set('member', selectedGroupFilter);
                            }
                            router.push(`/budgets?${params.toString()}`);
                          }}
                        />
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessun budget trovato</p>
                </div>
              )}
            </section>
          </div>

          {/* Upcoming Transactions Section */}
          <section className="bg-white/80 backdrop-blur-sm p-3 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-white/50">
            <SectionHeader
              title="Transazioni Programmate"
              className="mb-3"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-medium text-primary hover:text-white hover:bg-primary rounded-xl transition-all duration-300 px-3 py-2 group shadow-sm hover:shadow-md hover:shadow-primary/25 hover:scale-105"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('from', 'dashboard');
                  params.set('tab', 'recurrent');
                  if (selectedGroupFilter !== 'all') {
                    params.set('member', selectedGroupFilter);
                  }
                  router.push(`/transactions?${params.toString()}`);
                }}
              >
                <span>Vai a</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-all duration-300" />
              </Button>
            </SectionHeader>

            {upcomingTransactions.length > 0 ? (
              <GroupedTransactionCard
                transactions={upcomingTransactions}
                accountNames={accountNames}
                variant="recurrent"
                context="informative"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-primary/70">Nessuna transazione ricorrente</p>
              </div>
            )}
          </section>
        </main>

        <BottomNavigation />
        </div>
      </div>
    </ErrorBoundary>
  );
}
