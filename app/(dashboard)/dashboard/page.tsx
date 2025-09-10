"use client";

import { CreditCard, Settings, Bell, ChevronRight } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { SectionHeader } from "@/components/section-header";
import { GroupedTransactionCard } from "@/components/grouped-transaction-card";
import { BudgetCard } from "@/components/budget-card";
import { BankAccountCard } from "@/components/bank-account-card";
import {
  userService,
  budgetService,
  apiHelpers,
  accountService
} from "@/lib/api";
import {
  formatCurrency,
  getAccountBalance,
  getFilteredAccounts,
  getBudgetBalance,
  getBudgetProgress,
  getRecurringTransactions,
} from "@/lib/utils";
import { Account, Budget, Transaction, User } from "@/lib/types";
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
  const [error, setError] = useState<string | null>(null);
  const [accountNames, setAccountNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await apiHelpers.getCurrentUser();
        setCurrentUser(user);
        const initialUser = getInitialSelectedUser(user, null);
        setSelectedGroupFilter(initialUser);
        setUsers([user]);
      } catch (err) {
        console.error('Error initializing user:', err);
      }
    };

    initializeUser();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    let isMounted = true;
    const controller = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const userFilterForAPI = selectedGroupFilter === 'all' ? undefined : selectedGroupFilter;

        const [budgetsData, usersData, filteredAccounts, recurringTransactions] = await Promise.all([
          budgetService.getAll(),
          userService.getAll(),
          getFilteredAccounts(userFilterForAPI),
          getRecurringTransactions(userFilterForAPI)
        ]);

        if (!isMounted) return;

        const userBudgets = selectedGroupFilter === 'all' 
          ? budgetsData 
          : budgetsData.filter(b => b.user_id === selectedGroupFilter);

        setBankAccounts(filteredAccounts);
        setBudgets(userBudgets);
        setUpcomingTransactions(recurringTransactions);
        setUsers(usersData);

        const uniqueAccountIds = [...new Set(recurringTransactions.map(tx => tx.account_id))];
        const accountNamesMap: Record<string, string> = {};
        await Promise.all(
          uniqueAccountIds.map(async (accountId) => {
            try {
              const account = await accountService.getById(accountId);
              accountNamesMap[accountId] = account?.name || accountId;
            } catch (error) {
              console.error(`Error fetching account name for ${accountId}:`, error);
              accountNamesMap[accountId] = accountId;
            }
          })
        );
        setAccountNames(accountNamesMap);

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

                      return (
                        <BudgetCard
                          key={budget.id}
                          budget={budget}
                          budgetInfo={budgetInfo}
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
  );
}
