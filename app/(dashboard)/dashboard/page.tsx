"use client";

import { CreditCard, Building2, User, Settings, Bell, ChevronRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import {
  currentUser,
  dummyUsers,
  dummyCategoryIcons
} from "@/lib/dummy-data";
import {
  formatCurrency,
  isAdmin,
  getUserAccountBalance,
  getAllAccountsBalance,
  getFilteredBudgets,
  getRecurringTransactions,
  getAccountsWithBalance,
  getBalanceSpent
} from "@/lib/utils";
import { AccountTypeMap, Account, Budget, Transaction } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");

  const bankAccounts = useMemo((): Account[] => {
    return getAccountsWithBalance(selectedGroupFilter);
  }, [selectedGroupFilter]);

  const budgets = useMemo((): Budget[] => {
    return getFilteredBudgets(selectedGroupFilter);
  }, [selectedGroupFilter]);

  const upcomingTransactions = useMemo((): Transaction[] => {
    return getRecurringTransactions(selectedGroupFilter);
  }, [selectedGroupFilter]);

  const totalBalance = useMemo(() => {
    if (selectedGroupFilter === "all") {
      return getAllAccountsBalance();
    }
    return getUserAccountBalance(selectedGroupFilter);
  }, [selectedGroupFilter]);

  const handleAccountClick = useCallback((id: string) => {
    setExpandedAccount(expandedAccount === id ? null : id);
  }, [expandedAccount]);

  const handleGroupFilterChange = useCallback((groupId: string) => {
    setSelectedGroupFilter(groupId);
  }, []);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      <div>
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
          <div className="flex items-center justify-between">
            {/* Left - User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-[#7578EC]" />
              </div>
              <div className="flex flex-col">
                <p className="text-sm sm:text-base font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">{currentUser.name}</p>
                <p className="text-xs sm:text-sm font-semibold text-[#7578EC]">Premium Plan</p>
              </div>
            </div>

            {/* Right - Settings and Notifications */}
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Group Selector - Only for superadmin and admin */}
        {isAdmin(currentUser) && (
          <section className="bg-white/60 backdrop-blur-sm px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-200/50">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...dummyUsers].map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleGroupFilterChange(member.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedGroupFilter === member.id
                      ? "bg-[#7578EC] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                >
                  <span className="text-sm">{member.avatar}</span>
                  {member.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <main className="pb-16">
          {/* Total Balance Section - Different Background */}
          <section className="bg-white p-3 shadow-sm">
            {/* Total Balance and Bank Accounts Count */}
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Saldo Totale</p>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
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
                  const IconComponent = Building2;
                  const accountBalance = selectedGroupFilter === 'all'
                    ? getAllAccountsBalance() / bankAccounts.length
                    : getUserAccountBalance(selectedGroupFilter);

                  return (
                    <Card
                      key={account.id}
                      className="px-3 py-2 min-w-[180px] flex-shrink-0 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleAccountClick(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left - Icon */}
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>

                        {/* Center - Title and Type */}
                        <div className="flex flex-col flex-1 mx-3">
                          <h3 className="font-semibold text-gray-900 text-sm">{account.name}</h3>
                          <p className="text-xs text-gray-500">{AccountTypeMap[account.type] || account.type}</p>
                        </div>

                        {/* Right - Amount */}
                        <div className="flex flex-col text-right">
                          <p className={`text-base font-bold ${accountBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {accountBalance < 0 ? '-' : ''}{formatCurrency(Math.abs(accountBalance))}
                          </p>
                          {accountBalance < 0 && (
                            <p className="text-xs text-red-500 font-medium">DEBITO</p>
                          )}
                        </div>
                      </div>
                    </Card>
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
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold tracking-tight text-gray-900">Budget</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedGroupFilter !== 'all') {
                      params.set('member', selectedGroupFilter);
                    }
                    const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
                    router.push(url);
                  }}
                >
                  Vai a
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {budgets.length > 0 ? (
                <Card className="bg-white shadow-sm border border-gray-200 py-0">
                  <div className="divide-y divide-gray-100">
                    {budgets.map((budget: Budget) => {
                      const spent = getBalanceSpent(budget);
                      const remaining = budget.amount - spent;

                      return (
                        <div
                          key={budget.id}
                          className="p-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                          onClick={() => {
                            const params = new URLSearchParams();
                            params.set('budget', budget.id);
                            if (selectedGroupFilter !== 'all') {
                              params.set('member', selectedGroupFilter);
                            }
                            router.push(`/budgets?${params.toString()}`);
                          }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 shadow-lg border border-purple-100/50">
                                <span className="text-xl">{budget.icon}</span>
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-base truncate max-w-[100px] sm:max-w-[120px] mb-1">
                                  {budget.description.length > 15 ? `${budget.description.substring(0, 15)}...` : budget.description}
                                </h3>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/80 w-fit">
                                  <div 
                                    className={`w-2 h-2 rounded-full ${
                                      (remaining / budget.amount) * 100 <= 0 
                                        ? 'bg-rose-500' :
                                      (remaining / budget.amount) * 100 <= 20 
                                        ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                    }`}
                                  />
                                  <span className={`text-xs font-bold ${
                                    (remaining / budget.amount) * 100 <= 0 
                                      ? 'text-rose-700' :
                                    (remaining / budget.amount) * 100 <= 20 
                                      ? 'text-amber-700' :
                                      'text-emerald-700'
                                  }`}>
                                    {Math.round((remaining / budget.amount) * 100)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right flex-shrink-0 ml-2">
                              <p className={`text-sm font-bold ${
                                (remaining / budget.amount) * 100 <= 0 
                                  ? 'text-rose-600' :
                                (remaining / budget.amount) * 100 <= 20 
                                  ? 'text-amber-600' :
                                  'text-emerald-600'
                              }`}>
                                {formatCurrency(remaining)}
                              </p>
                              <p className="text-xs text-slate-500 font-medium">
                                di {formatCurrency(budget.amount)}
                              </p>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="relative">
                            <div className="w-full h-3 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner overflow-hidden">
                              <div
                                className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-sm relative ${
                                  (remaining / budget.amount) * 100 <= 0 
                                    ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                                  (remaining / budget.amount) * 100 <= 20 
                                    ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                                    'bg-gradient-to-r from-emerald-400 to-emerald-500'
                                }`}
                                style={{ width: `${Math.min((spent / budget.amount) * 100, 100)}%` }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent rounded-full"></div>
                              </div>
                            </div>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
                          </div>
                        </div>
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
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Transazioni Programmate</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all duration-200 px-4 py-2 min-h-[44px] border border-slate-200 hover:border-slate-300 hover:shadow-md group"
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
                <span className="mr-2">Vai a</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {upcomingTransactions.length > 0 ? upcomingTransactions.map((transaction: Transaction) => {
                const categoryIcon = dummyCategoryIcons[transaction.category] || '💳';

                return (
                  <Card key={transaction.id} className="p-3 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 rounded-xl sm:rounded-2xl group active:scale-[0.98] cursor-pointer">
                    <div className="flex items-center justify-between group-hover:transform group-hover:scale-[1.01] transition-transform duration-200">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm group-hover:shadow-md transition-all duration-200">
                          <span className="text-base sm:text-lg">{categoryIcon}</span>
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-slate-900 transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                            {transaction.description.length > 18 ? `${transaction.description.substring(0, 18)}...` : transaction.description}
                          </h3>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium">Ricorrente • {transaction.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-sm sm:text-lg font-bold ${transaction.type === 'income'
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent'
                            : 'bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent'
                          } whitespace-nowrap`}>
                          {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              }) : (
                <div className="text-center py-8">
                  <p className="text-slate-500">Nessuna transazione ricorrente</p>
                </div>
              )}
            </div>
          </section>
        </main>

        <BottomNavigation />
      </div>
    </div>
  );
}