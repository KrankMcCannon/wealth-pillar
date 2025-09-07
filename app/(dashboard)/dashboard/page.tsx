"use client";

import { CreditCard, Building2, Settings, Bell, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { CategoryIcon, iconSizes } from '@/lib/icons';
import {
  userService,
  budgetService,
  categoryService,
  apiHelpers
} from "@/lib/api";
import {
  formatCurrency,
  getAccountBalance,
  getFilteredAccounts,
  getBudgetBalance,
  getBudgetProgress,
  getRecurringTransactions,
  formatFrequency as formatFreq
} from "@/lib/utils";
import { AccountTypeMap, Account, Budget, Transaction, User, Category } from "@/lib/types";
import {
  saveSelectedUser,
  getInitialSelectedUser
} from "@/lib/persistent-user-selection";

export default function DashboardPage() {
  const router = useRouter();
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>("all");
  const [bankAccounts, setBankAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [upcomingTransactions, setUpcomingTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountBalances, setAccountBalances] = useState<{ [key: string]: number }>({});
  const [budgetData, setBudgetData] = useState<{ id: string; spent: number; remaining: number; progress: number }[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize user selection on first load
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await apiHelpers.getCurrentUser();
        setCurrentUser(user);
        const initialUser = getInitialSelectedUser(user, null);
        setSelectedGroupFilter(initialUser);
        setUsers([user]); // Set initial users
      } catch (err) {
        console.error('Error initializing user:', err);
      }
    };

    initializeUser();
  }, []);

  // Load data when selectedGroupFilter changes
  useEffect(() => {
    // Skip if we don't have a current user yet
    if (!currentUser) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use the current selectedGroupFilter from the dependency
        const userFilterForAPI = selectedGroupFilter === 'all' ? undefined : selectedGroupFilter;

        // Load all data in parallel using real API services
        const [budgetsData, usersData, categoriesData, filteredAccounts, recurringTransactions] = await Promise.all([
          budgetService.getAll(),
          userService.getAll(),
          categoryService.getAll(),
          getFilteredAccounts(userFilterForAPI),
          getRecurringTransactions(userFilterForAPI)
        ]);

        if (!isMounted) return;

        // Filter budgets by user
        const userBudgets = selectedGroupFilter === 'all' 
          ? budgetsData 
          : budgetsData.filter(b => b.user_id === selectedGroupFilter);

        setBankAccounts(filteredAccounts);
        setBudgets(userBudgets);
        setUpcomingTransactions(recurringTransactions);
        setUsers(usersData);
        setCategories(categoriesData);

        // Calculate account balances in parallel
        const balancePromises = filteredAccounts.map(async (account) => ({
          id: account.id,
          balance: await getAccountBalance(account.id)
        }));
        
        const balanceResults = await Promise.all(balancePromises);
        if (!isMounted) return;
        
        const balances = balanceResults.reduce((acc, { id, balance }) => {
          acc[id] = balance;
          return acc;
        }, {} as { [key: string]: number });
        
        setAccountBalances(balances);
        setTotalBalance(Object.values(balances).reduce((sum, balance) => sum + balance, 0));

        // Calculate budget data efficiently
        const budgetPromises = userBudgets.map(async (budget) => {
          const [remaining, progress] = await Promise.all([
            getBudgetBalance(budget),
            getBudgetProgress(budget)
          ]);
          const spent = budget.amount - remaining;
          return { id: budget.id, spent, remaining, progress };
        });
        
        const budgetResults = await Promise.all(budgetPromises);
        if (!isMounted) return;
        setBudgetData(budgetResults);

      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedGroupFilter, currentUser]);

  const handleAccountClick = useCallback((id: string) => {
    setExpandedAccount(expandedAccount === id ? null : id);
  }, [expandedAccount]);

  const handleGroupFilterChange = useCallback((groupId: string) => {
    setSelectedGroupFilter(groupId);
    saveSelectedUser(groupId);
  }, []);

  // Memoized helper functions for performance
  const getBudgetStatus = useCallback((progress: number) => {
    if (progress >= 100) return { color: 'rose', label: 'Superato', textColor: 'text-rose-600' };
    if (progress >= 80) return { color: 'amber', label: 'Attenzione', textColor: 'text-amber-600' };
    return { color: 'emerald', label: 'In regola', textColor: 'text-emerald-600' };
  }, []);

  const getBudgetProgressColor = useCallback((progress: number) => {
    if (progress >= 100) return 'bg-gradient-to-r from-rose-500 to-rose-600';
    if (progress >= 80) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
  }, []);

  const getStatusDotColor = useCallback((progress: number) => {
    if (progress >= 100) return 'bg-rose-500';
    if (progress >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  }, []);

  // Memoized category lookup for performance
  const categoryMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat;
      acc[cat.key] = cat;
      return acc;
    }, {} as { [key: string]: Category });
  }, [categories]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7578EC] mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Riprova</Button>
        </div>
      </div>
    );
  }

  return (
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
          onGroupFilterChange={handleGroupFilterChange}
        />

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
                  const accountBalance = accountBalances[account.id] || 0;

                  return (
                    <Card
                      key={account.id}
                      className="px-3 py-2 min-w-[180px] flex-shrink-0 bg-gradient-to-br from-gray-50 to-white border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                      onClick={() => handleAccountClick(account.id)}
                    >
                      <div className="flex items-center justify-between">
                        {/* Left - Icon */}
                        <div className="flex size-10 items-center justify-center rounded-full bg-blue-100">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>

                        {/* Center - Title and Type */}
                        <div className="flex flex-col flex-1 mx-3">
                          <h3 className="font-semibold text-gray-900 text-sm truncate">
                            {account.name.length > 17 ? `${account.name.substring(0, 17)}...` : account.name}
                          </h3>
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
                  className="text-sm font-semibold text-[#7578EC] hover:text-white hover:bg-[#7578EC] rounded-xl transition-all duration-300 px-4 py-2.5 group shadow-sm hover:shadow-md hover:shadow-[#7578EC]/25 border border-[#7578EC]/20 hover:border-[#7578EC] hover:scale-105"
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (selectedGroupFilter !== 'all') {
                      params.set('member', selectedGroupFilter);
                    }
                    const url = params.toString() ? `/budgets?${params.toString()}` : '/budgets';
                    router.push(url);
                  }}
                >
                  <span>Vai a</span>
                  <ChevronRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-all duration-300" />
                </Button>
              </div>

              {budgets.length > 0 ? (
                <Card className="bg-white shadow-sm border border-gray-200 py-0">
                  <div className="divide-y divide-gray-100">
                    {budgets.map((budget: Budget) => {
                      const budgetInfo = budgetData.find(b => b.id === budget.id);
                      const remaining = budgetInfo?.remaining || budget.amount;

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
                                <CategoryIcon
                                  categoryKey={budget.categories?.[0] || 'altro'}
                                  size={iconSizes.lg}
                                  className="text-purple-600"
                                />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-slate-900 text-base truncate max-w-[100px] sm:max-w-[120px] mb-1">
                                  {budget.description.length > 15 ? `${budget.description.substring(0, 15)}...` : budget.description}
                                </h3>
                                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100/80 w-fit">
                                  <div className={`w-2 h-2 rounded-full ${getStatusDotColor(budgetInfo?.progress || 0)}`} />
                                  <span className={`text-xs font-bold ${getBudgetStatus(budgetInfo?.progress || 0).textColor}`}>
                                    {Math.round(100 - (budgetInfo?.progress || 0))}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right flex-shrink-0 ml-2">
                              <p className={`text-sm font-bold ${getBudgetStatus(budgetInfo?.progress || 0).textColor}`}>
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
                                className={`h-3 rounded-full transition-all duration-1000 ease-out shadow-sm relative ${getBudgetProgressColor(budgetInfo?.progress || 0)}`}
                                style={{ width: `${Math.min(budgetInfo?.progress || 0, 100)}%` }}
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
                className="text-sm font-semibold text-[#7578EC] hover:text-white hover:bg-[#7578EC] rounded-xl transition-all duration-300 px-4 py-2.5 min-h-[44px] group shadow-sm hover:shadow-md hover:shadow-[#7578EC]/25 border border-[#7578EC]/20 hover:border-[#7578EC] hover:scale-105"
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
                <span className="mr-1.5">Vai a</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-all duration-300" />
              </Button>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {upcomingTransactions.length > 0 ? upcomingTransactions.map((transaction: Transaction) => {
                return (
                  <Card key={transaction.id} className="p-3 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 rounded-xl sm:rounded-2xl group active:scale-[0.98] cursor-pointer">
                    <div className="flex items-center justify-between group-hover:transform group-hover:scale-[1.01] transition-transform duration-200">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="flex size-10 sm:size-12 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm group-hover:shadow-md transition-all duration-200">
                          <CategoryIcon
                            categoryKey={categoryMap[transaction.category]?.key || transaction.category || 'altro'}
                            size={iconSizes.md}
                          />
                        </div>
                        <div className="flex-1 min-w-0 pr-2">
                          <h3 className="font-bold text-sm text-slate-800 group-hover:text-slate-900 transition-colors truncate mb-1">
                            {transaction.description.length > 18 ? `${transaction.description.substring(0, 18)}...` : transaction.description}
                          </h3>
                          <p className="text-xs text-slate-600 font-medium">
                            {transaction.type === 'income' ? 'Entrata' : 'Spesa'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`text-sm font-bold mb-1 ${transaction.type === 'income'
                          ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent'
                          : 'bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent'
                          } whitespace-nowrap`}>
                          {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {formatFreq(transaction.frequency)}
                        </Badge>
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
