"use client";

import { CreditCard, Settings, Bell, AlertTriangle } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { SectionHeader } from "@/components/section-header";
import { BudgetCard } from "@/components/budget-card";
import { BankAccountCard } from "@/components/bank-account-card";
import { RecurringSeriesSection } from "@/components/recurring-series-section";
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
    accountBalances,
    totalBalance,
    budgetsByUser,
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
                {bankAccounts
                  .filter((account: Account) => {
                    // Show shared accounts only when 'all members' is selected
                    if (selectedGroupFilter === 'all') {
                      return true; // Show all accounts including shared ones
                    } else {
                      return account.user_ids.includes(selectedGroupFilter);
                    }
                  })
                  .sort((a: Account, b: Account) => {
                    // Sort by balance (highest to lowest)
                    const balanceA = accountBalances[a.id] || 0;
                    const balanceB = accountBalances[b.id] || 0;
                    return balanceB - balanceA;
                  })
                  .map((account: Account) => {
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
              />

              {Object.keys(budgetsByUser).length > 0 ? (
                <div className="space-y-4">
                  {Object.values(budgetsByUser)
                    .sort((a, b) => b.totalBudget - a.totalBudget)
                    .map((userBudgetGroup) => {
                    const { user, budgets: userBudgets, activePeriod, periodStart, periodEnd, totalBudget, totalSpent, overallPercentage } = userBudgetGroup;

                    return (
                      <div key={user.id} className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
                        {/* User Header with Period Info */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-4 py-3 border-b border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5">
                                <span className="text-sm font-bold text-[#7578EC]">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-slate-900">{user.name}</h3>
                                {activePeriod && periodStart && (
                                  <p className="text-xs text-slate-600">
                                    {new Date(periodStart).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })} -
                                    {periodEnd ? new Date(periodEnd).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : 'In corso'}
                                    {activePeriod.is_active && <span className="ml-2 text-green-600 font-medium">• Attivo</span>}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-slate-900">
                                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                              </div>
                              <div className={`text-xs font-medium ${overallPercentage > 100 ? 'text-red-600' : overallPercentage > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {overallPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* User's Budgets */}
                        <div className="divide-y divide-gray-100">
                          {userBudgets
                            .sort((a, b) => b.amount - a.amount)
                            .map((budgetInfo) => {
                            const budget = budgets.find((b: Budget) => b.id === budgetInfo.id);
                            if (!budget) return null;

                            const mappedBudgetInfo = {
                              id: budgetInfo.id,
                              spent: budgetInfo.spent,
                              remaining: budgetInfo.remaining,
                              progress: budgetInfo.percentage
                            };

                            return (
                              <BudgetCard
                                key={budget.id}
                                budget={budget}
                                budgetInfo={mappedBudgetInfo}
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
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nessun budget trovato</p>
                </div>
              )}
            </section>
          </div>

          {/* Recurring Series Section */}
          <RecurringSeriesSection
            selectedUserId={selectedGroupFilter}
            className="bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-white/50"
            showStats={false}
            maxItems={5}
            showActions={false}
          />
        </main>

        <BottomNavigation />
        </div>
      </div>
    </ErrorBoundary>
  );
}
