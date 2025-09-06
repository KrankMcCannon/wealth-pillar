"use client";

import { ArrowLeft, MoreVertical, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useState, Suspense, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavigation from "@/components/bottom-navigation";
import {
  formatCurrency,
  formatDate,
  getBalanceSpent,
  getBudgetBalance,
  getBudgetProgress,
  getDynamicChartData,
  getUserTransactions,
  isAdmin,
} from "@/lib/utils";
import { currentUser, dummyBudgets, dummyUsers, dummyCategoryIcons, dummyCategoryColors } from "@/lib/dummy-data";
import { Budget } from "@/lib/types";

function BudgetsContent() {
  const router = useRouter();

  const [selectedUser, setSelectedUser] = useState<string>(currentUser.role === 'superadmin' ? 'all' : currentUser.id);
  const [selectedBudget, setSelectedBudget] = useState<Budget>(dummyBudgets.filter((budget) => budget.user_id === currentUser.id)[0] || dummyBudgets[0]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const budgetBalance = useMemo(() => {
    if (!isHydrated) return 0; // Prevent hydration mismatch
    return getBudgetBalance(selectedBudget);
  }, [selectedBudget, isHydrated]);

  const chartData = useMemo(() => {
    if (!isHydrated) {
      return {
        expense: [0],
        income: [0],
        maxExpense: 1,
        maxIncome: 1,
        dailyExpenses: [],
        dailyIncome: [],
        categories: [],
        incomeTypes: []
      };
    }
    
    const data = getDynamicChartData(selectedBudget);
    const maxExpense = Math.max(...data.expense, 1);
    const maxIncome = Math.max(...data.income, 1);
    
    return {
      expense: data.expense,
      income: data.income,
      maxExpense,
      maxIncome,
      dailyExpenses: data.dailyExpenses,
      dailyIncome: data.dailyIncome,
      categories: data.categories,
      incomeTypes: data.incomeTypes
    };
  }, [selectedBudget, isHydrated]);

  const budgetTransactions = useMemo(() => {
    let userTransactions;
    
    if (selectedUser === 'all') {
      // Get all transactions from all users
      userTransactions = dummyUsers.flatMap(user => getUserTransactions(user));
    } else {
      // Get transactions from selected user
      const user = dummyUsers.find(u => u.id === selectedUser);
      userTransactions = user ? getUserTransactions(user) : [];
    }
    
    return userTransactions
      .filter(transaction => 
        transaction.type === 'expense' && 
        selectedBudget.categories.includes(transaction.category)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [selectedBudget, selectedUser]);

  const availableBudgets = useMemo(() => {
    if (selectedUser === 'all') {
      return dummyBudgets;
    }
    return dummyBudgets.filter(budget => budget.user_id === selectedUser);
  }, [selectedUser]);

  const handleBudgetChange = useCallback((value: string) => {
    const budget = availableBudgets.find((b) => b.id === value);
    if (budget) {
      setSelectedBudget(budget);
    }
  }, [availableBudgets]);

  const handleUserChange = useCallback((userId: string) => {
    setSelectedUser(userId);
    // Update budget selection based on user
    const availableBudgets = userId === 'all' 
      ? dummyBudgets 
      : dummyBudgets.filter(budget => budget.user_id === userId);
    if (availableBudgets.length > 0) {
      setSelectedBudget(availableBudgets[0]);
    }
  }, []);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Budget</h1>

          {/* Right - Three dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 sm:p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-60 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-3 animate-in slide-in-from-top-2 duration-200"
              sideOffset={12}
            >
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">💰</span>
                Aggiungi Nuovo Budget
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">🏷️</span>
                Aggiungi Nuova Categoria
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Group Selector - Only for superadmin and admin */}
      {isAdmin(currentUser) && (
        <section className="bg-white/60 backdrop-blur-sm px-3 sm:px-4 py-3 sm:py-4 border-b border-slate-200/50">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-[#7578EC]" />
            <h3 className="text-sm font-medium text-gray-700">Visualizza Budget per:</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...dummyUsers].map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserChange(user.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${selectedUser === user.id
                  ? "bg-[#7578EC] text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <span className="text-sm">{user.avatar}</span>
                {user.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-3 sm:p-4 space-y-6 sm:space-y-8 pb-20 sm:pb-24">
        {/* Budget Selector */}
        <section className="bg-white/80 backdrop-blur-sm px-4 sm:px-6 py-5 sm:py-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-white/50">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0 mb-6">
            <div className="space-y-1 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Panoramica Budget</h2>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">Seleziona un budget per visualizzare i dettagli</p>
            </div>
            <Select value={selectedBudget?.id} onValueChange={handleBudgetChange}>
              <SelectTrigger className="w-full sm:w-48 h-12 sm:h-11 bg-white border border-slate-200 shadow-lg shadow-slate-200/50 rounded-2xl px-4 hover:border-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all text-sm font-medium">
                <SelectValue placeholder="Seleziona budget" className="font-semibold text-slate-700" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2 min-w-52">
                <SelectItem
                  value="all"
                  className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors font-medium"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💰</span>
                    <span>Tutti i Budget</span>
                  </div>
                </SelectItem>
                {availableBudgets.map((budget) => (
                  <SelectItem
                    key={budget.id}
                    value={budget.id}
                    className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{budget.icon}</span>
                      <span>{budget.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Budget Display */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="text-3xl sm:text-4xl drop-shadow-sm">{selectedBudget.icon}</div>
              <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{selectedBudget.description}</h3>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <div className="inline-block px-3 sm:px-4 py-2 bg-slate-50 rounded-2xl">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Importo Disponibile</p>
                <p className={`text-2xl sm:text-4xl font-bold tracking-tight ${budgetBalance >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent' : 'bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent'}`}>
                  {isHydrated ? formatCurrency(budgetBalance) : '€ 0,00'}
                </p>
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500">
                di <span className="font-bold text-slate-700">{formatCurrency(selectedBudget.amount)}</span> pianificati
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                <span className="text-sm font-semibold text-slate-700">Spesi: {formatCurrency(getBalanceSpent(selectedBudget))}</span>
              </div>
              <div className="px-3 py-1 bg-slate-100 rounded-full">
                <span className="text-xs font-bold text-slate-700">{getBudgetProgress(selectedBudget)}% utilizzati</span>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner">
                <div
                  className={`h-4 rounded-2xl transition-all duration-1000 ease-out shadow-lg ${getBudgetProgress(selectedBudget) >= 100 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                    getBudgetProgress(selectedBudget) >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                      'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    }`}
                  style={{ width: `${Math.min(getBudgetProgress(selectedBudget), 100)}%` }}
                />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </section>

        {/* Expense and Income Charts */}
        <section className="space-y-4 sm:space-y-6">
          {/* Expense Chart */}
          <Card className="p-4 sm:p-6 gap-0 bg-gradient-to-br from-rose-50/50 via-white to-rose-50/30 border border-rose-100/50 hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-300 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl sm:rounded-2xl shadow-lg shadow-rose-200/50">
                  <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Uscite per Categoria</h3>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
                  {formatCurrency(chartData.expense.reduce((sum: number, val: number) => sum + val, 0))}
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Questo periodo</p>
              </div>
            </div>

            {/* Extended horizontal bar chart for expenses by category */}
            <div className="flex items-end justify-between gap-1 px-1 h-28 sm:h-36 bg-gray-50 rounded-xl" style={{paddingTop: '8px'}}>
              {chartData.dailyExpenses.map((dayData: { [key: string]: number | string }, index: number) => {
                const { day, ...categoryAmounts } = dayData;
                const total = Object.values(categoryAmounts).reduce((sum: number, val) => sum + (val as number), 0);
                const maxTotal = Math.max(...chartData.dailyExpenses.map((d: { [key: string]: number | string }) => {
                  const { day, ...amounts } = d;
                  return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                }), 1);
                const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 70, 16) : 16;

                return (
                  <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-full flex flex-col justify-end" style={{height: '88px'}}>
                      <div
                        className="w-full flex flex-col rounded-t overflow-hidden shadow-sm min-h-[16px] bg-gray-100"
                        style={{ height: `${barHeight}px` }}
                      >
                        {total > 0 ? (
                          chartData.categories.map((category: string) => {
                            const amount = categoryAmounts[category] as number || 0;
                            if (amount === 0) return null;
                            const color = dummyCategoryColors[category] || '#dc2626';
                            return (
                              <div
                                key={category}
                                style={{ 
                                  height: `${(amount / total) * 100}%`,
                                  backgroundColor: color
                                }}
                                title={`${category}: ${formatCurrency(amount)}`}
                              />
                            );
                          })
                        ) : (
                          <div 
                            className="w-full bg-gray-300 rounded-t"
                            style={{height: '16px'}}
                            title="Nessuna spesa per questo giorno"
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 mt-2">{day as string}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend for expenses */}
            <div className="flex flex-wrap gap-3 justify-start pt-4 border-t border-red-100">
              {chartData.categories.slice(0, 8).map((category: string) => {
                const color = dummyCategoryColors[category] || '#dc2626';
                const icon = dummyCategoryIcons[category] || '💳';
                const label = category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={category} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-gray-700">{icon} {label}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Income Chart */}
          <Card className="p-4 sm:p-6 gap-0 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/30 border border-emerald-100/50 hover:shadow-2xl hover:shadow-emerald-100/50 transition-all duration-300 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl shadow-lg shadow-emerald-200/50">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">Entrate per Tipo</h3>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <p className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                  {formatCurrency(chartData.income.reduce((sum: number, val: number) => sum + val, 0))}
                </p>
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Questo periodo</p>
              </div>
            </div>

            {/* Extended horizontal bar chart for income by type/day */}
            <div className="flex items-end justify-between gap-1 px-1 h-28 sm:h-36 bg-gray-50 rounded-xl" style={{paddingTop: '8px'}}>
              {chartData.dailyIncome.map((dayData: { [key: string]: number | string }, index: number) => {
                const { day, ...incomeAmounts } = dayData;
                const total = Object.values(incomeAmounts).reduce((sum: number, val) => sum + (val as number), 0);
                const maxTotal = Math.max(...chartData.dailyIncome.map((d: { [key: string]: number | string }) => {
                  const { day, ...amounts } = d;
                  return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                }), 1);
                const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 70, 16) : 16;

                return (
                  <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-full flex flex-col justify-end">
                      <div
                        className="w-full flex flex-col rounded-t overflow-hidden shadow-sm min-h-[16px] bg-gray-100"
                        style={{ height: `${barHeight}px` }}
                      >
                        {total > 0 ? (
                          chartData.incomeTypes.map((incomeType: string, typeIndex: number) => {
                            const amount = incomeAmounts[incomeType] as number || 0;
                            if (amount === 0) return null;
                            const colors = ['#16a34a', '#22c55e', '#4ade80']; // Different shades of green
                            const color = colors[typeIndex % colors.length] || '#16a34a';
                            return (
                              <div
                                key={incomeType}
                                style={{ 
                                  height: `${(amount / total) * 100}%`,
                                  backgroundColor: color
                                }}
                                title={`${incomeType}: ${formatCurrency(amount)}`}
                              />
                            );
                          })
                        ) : (
                          <div 
                            className="w-full bg-gray-300 rounded-t"
                            style={{height: '16px'}}
                            title="Nessuna entrata per questo giorno"
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 mt-2">{day as string}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend for income types */}
            <div className="flex flex-wrap gap-3 justify-start pt-4 border-t border-green-100">
              {chartData.incomeTypes.slice(0, 6).map((incomeType: string, index: number) => {
                const colors = ['#16a34a', '#22c55e', '#4ade80'];
                const color = colors[index % colors.length] || '#16a34a';
                const icons = ['💰', '💼', '🎁', '📈', '🏦', '💸'];
                const icon = icons[index % icons.length] || '💰';
                const label = incomeType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={incomeType} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-gray-700">{icon} {label}</span>
                  </div>
                );
              })}
              {chartData.incomeTypes.length > 6 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full shadow-sm bg-green-400" />
                  <span className="text-xs font-medium text-gray-700">+{chartData.incomeTypes.length - 6} altri</span>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Daily Expense Bar Graph */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Spese Giornaliere per Categoria</h3>
          </div>

          <Card className="p-4 sm:p-6 gap-0 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-white/50">
            {/* Bar Graph */}
            <div className="flex items-end justify-between gap-1 px-1 h-28 sm:h-36 bg-gray-50 rounded-xl" style={{paddingTop: '8px'}}>
              {chartData.dailyExpenses.map((dayData: { [key: string]: number | string }, index: number) => {
                const { day, ...categoryAmounts } = dayData;
                const total = Object.values(categoryAmounts).reduce((sum: number, val) => sum + (val as number), 0);
                const maxTotal = Math.max(...chartData.dailyExpenses.map((d: { [key: string]: number | string }) => {
                  const { day, ...amounts } = d;
                  return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                }));
                const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 70, 16) : 16;

                return (
                  <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                    <div className="w-full flex flex-col justify-end" style={{height: '88px'}}>
                      <div
                        className="w-full flex flex-col rounded-t overflow-hidden shadow-sm min-h-[16px] bg-gray-100"
                        style={{ height: `${barHeight}px` }}
                      >
                        {chartData.categories.map((category: string) => {
                          const amount = categoryAmounts[category] as number || 0;
                          if (amount === 0) return null;
                          const color = dummyCategoryColors[category] || '#6b7280';
                          return (
                            <div
                              key={category}
                              style={{ 
                                height: `${total > 0 ? (amount / total) * 100 : 0}%`,
                                backgroundColor: color
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 mt-3">{day as string}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 justify-start pt-4 border-t border-slate-100">
              {chartData.categories.slice(0, 6).map((category: string) => {
                const color = dummyCategoryColors[category] || '#6b7280';
                const icon = dummyCategoryIcons[category] || '📋';
                const label = category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return (
                  <div key={category} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium text-gray-700">{icon} {label}</span>
                  </div>
                );
              })}
              {chartData.categories.length > 6 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full shadow-sm bg-gray-400" />
                  <span className="text-xs font-medium text-gray-700">+{chartData.categories.length - 6} altre</span>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Total Transactions Section */}
        <section>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Transazioni Recenti</h3>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {budgetTransactions.length > 0 ? (
              budgetTransactions.map((transaction) => {
                const categoryIcon = dummyCategoryIcons[transaction.category] || '💳';
                const categoryColor = dummyCategoryColors[transaction.category] || '#6b7280';

                return (
                  <Card key={transaction.id} className="px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 rounded-xl sm:rounded-2xl group active:scale-[0.98] cursor-pointer">
                    <div className="flex items-center justify-between group-hover:transform group-hover:scale-[1.01] transition-transform duration-200">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div 
                          className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-200"
                          style={{ 
                            backgroundColor: categoryColor + '20', // 20% opacity
                            border: `2px solid ${categoryColor}40` // 40% opacity border
                          }}
                        >
                          <span className="text-base sm:text-lg">{categoryIcon}</span>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-slate-900 transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                            {transaction.description.length > 18 ? `${transaction.description.substring(0, 18)}...` : transaction.description}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{formatDate(transaction.date.toISOString())}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm sm:text-xl font-bold bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent whitespace-nowrap">
                          -{formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nessuna transazione trovata per questo budget</p>
              </div>
            )}
          </div>

          {/* Visualizza Tutte Button */}
          {budgetTransactions.length > 0 && (
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-all duration-200 px-6 py-3 min-h-[44px] border border-slate-200 hover:border-slate-300 hover:shadow-md group"
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set('from', 'budgets');
                  if (selectedUser !== 'all') {
                    params.set('member', selectedUser);
                  }
                  if (selectedBudget.id !== 'all') {
                    params.set('budget', selectedBudget.id);
                    params.set('category', selectedBudget.description);
                  }
                  router.push(`/transactions?${params.toString()}`);
                }}
              >
                <span className="mr-2">Visualizza Tutte</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Button>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

export default function BudgetsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <BudgetsContent />
    </Suspense>
  );
}