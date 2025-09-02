"use client";

import { ArrowLeft, MoreVertical, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useState, useEffect, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavigation from "@/components/bottom-navigation";
import {
  currentUserPlan,
  membersData
} from "@/lib/dummy-data";
import {
  formatCurrency,
  formatDate,
  getMemberDataById,
  getMemberTransactionsByCategory,
  canManageGroup,
  getCurrentBudgetData,
  generateChartData
} from "@/lib/utils";
import { CategoryIcons } from "@/lib/types";

function BudgetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>(() => {
    return searchParams.get('member') || 'all';
  });
  const [isEditingBudgets, setIsEditingBudgets] = useState(false);
  const [editedBudgets, setEditedBudgets] = useState<{[key: string]: number}>({});

  useEffect(() => {
    const memberParam = searchParams.get('member');
    if (memberParam && memberParam !== selectedGroupFilter) {
      setSelectedGroupFilter(memberParam);
    }
    // Reset edit mode when member changes
    setIsEditingBudgets(false);
    setEditedBudgets({});
  }, [searchParams, selectedGroupFilter]);

  const currentMemberData = useMemo(() => {
    return getMemberDataById(membersData, selectedGroupFilter);
  }, [selectedGroupFilter]);

  // Initialize edited budgets when entering edit mode
  useEffect(() => {
    if (isEditingBudgets && currentMemberData?.budgets) {
      const initialBudgets: {[key: string]: number} = {};
      currentMemberData.budgets.forEach((budget, index) => {
        initialBudgets[`${selectedGroupFilter}-${index}`] = budget.budget;
      });
      setEditedBudgets(initialBudgets);
    }
  }, [isEditingBudgets, currentMemberData, selectedGroupFilter]);

    const handleSaveBudgets = () => {
    // In a real app, this would update the backend
    // For now, we'll update the local data
    if (currentMemberData?.budgets) {
      currentMemberData.budgets.forEach((budget, index) => {
        const budgetId = `${selectedGroupFilter}-${index}`;
        if (editedBudgets[budgetId] !== undefined) {
          budget.budget = editedBudgets[budgetId];
          // Recalculate remaining and percentage
          budget.remaining = budget.budget - budget.spent;
          budget.percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
        }
      });
    }
    setIsEditingBudgets(false);
    setEditedBudgets({});
    // Force re-render by updating a dependency
    setSelectedBudget(prev => prev);
  };

  const handleCancelEdit = () => {
    setIsEditingBudgets(false);
    setEditedBudgets({});
  };

  const handleBudgetChange = (budgetId: string, value: number) => {
    if (value < 0) return; // Prevent negative values
    setEditedBudgets(prev => ({
      ...prev,
      [budgetId]: value
    }));
  };

  const budgets = useMemo(() => {
    if (!currentMemberData) return [];
    return currentMemberData.budgets.map((budget, index) => ({
      id: `${selectedGroupFilter}-${index}`,
      name: budget.category,
      amount: budget.budget,
      spent: budget.spent,
      color: "bg-green-500",
      icon: CategoryIcons[budget.category] || "💰"
    }));
  }, [currentMemberData, selectedGroupFilter]);

  useEffect(() => {
    const budgetParam = searchParams.get('budget');
    if (budgetParam) {
      const budgetExists = budgets.some(budget => budget.id.toString() === budgetParam);
      if (budgetExists) {
        setSelectedBudget(budgetParam);
      }
    }
  }, [searchParams, budgets]);

  const currentBudget = getCurrentBudgetData(budgets, selectedBudget);
  const progressPercentage = currentBudget.amount > 0 ? (currentBudget.spent / currentBudget.amount) * 100 : 0;

  const dynamicChartData = useMemo(() => {
    if (!currentMemberData) return { expense: [], income: [], dailyExpenses: [] };
    return generateChartData(currentMemberData);
  }, [currentMemberData]);

  const maxExpense = Math.max(...dynamicChartData.expense);
  const maxIncome = Math.max(...dynamicChartData.income);

  const transactions = useMemo(() => {
    if (!currentMemberData) return [];
    
    if (selectedBudget === "all") {
      return currentMemberData.transactions.map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        amount: t.amount,
        date: t.date
      })).slice(0, 10); // Limit to recent 10 transactions
    } else {
      const selectedBudgetData = budgets.find(b => b.id === selectedBudget);
      if (selectedBudgetData) {
        return getMemberTransactionsByCategory(currentMemberData, selectedBudgetData.name)
          .map(t => ({
            id: t.id,
            title: t.title,
            category: t.category,
            amount: t.amount,
            date: t.date
          }))
          .slice(0, 10); // Limit to recent 10 transactions
      }
    }
    return [];
  }, [currentMemberData, selectedBudget, budgets]);

  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif', backgroundColor: '#F8FAFC' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 p-4 pb-2 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-[#7578EC]/10 text-[#7578EC]"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Budget</h1>

          {/* Right - Three dots menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-[#7578EC]/10 text-[#7578EC]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl p-2"
              sideOffset={8}
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
      {canManageGroup(currentUserPlan.type) && (
        <section className="bg-[#F8FAFC] px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-4 w-4 text-[#7578EC]" />
            <h3 className="text-sm font-medium text-gray-700">Visualizza Budget per:</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {[{ id: 'all', name: 'Tutti i Membri', avatar: '👥' }, ...membersData].map((member) => (
              <button
                key={member.id}
                onClick={() => setSelectedGroupFilter(member.id)}
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

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-4 space-y-6 pb-20">
        {/* Budget Selector */}
        <section className="bg-white px-4 py-4 shadow-sm rounded-xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Panoramica Budget</h2>
              <p className="text-sm text-gray-500">Seleziona un budget per visualizzare i dettagli</p>
            </div>
            <Select value={selectedBudget} onValueChange={setSelectedBudget}>
              <SelectTrigger className="w-52 h-11 bg-white/95 backdrop-blur-md border border-gray-200/80 shadow-sm rounded-xl px-4 hover:border-[#7578EC]/40 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all">
                <SelectValue placeholder="Seleziona budget" className="font-medium text-gray-700" />
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
                {budgets.map((budget) => (
                  <SelectItem
                    key={budget.id}
                    value={budget.id.toString()}
                    className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors font-medium"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{budget.icon}</span>
                      <span>{budget.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Current Budget Display */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">{currentBudget.icon}</span>
              <h3 className="text-lg font-medium text-gray-700">{currentBudget.name}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-1">Importo Disponibile</p>
            <p className={`text-3xl font-bold ${currentBudget.available >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(Math.abs(currentBudget.available))}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              di {formatCurrency(currentBudget.amount)} pianificati
            </p>
            
            {/* Edit Budget Button */}
            {selectedBudget !== "all" && (
              <div className="mt-4">
                {!isEditingBudgets ? (
                  <Button
                    onClick={() => setIsEditingBudgets(true)}
                    variant="outline"
                    size="sm"
                    className="text-[#7578EC] border-[#7578EC] hover:bg-[#7578EC] hover:text-white"
                  >
                    Modifica Budget
                  </Button>
                ) : (
                  <div className="flex gap-2 justify-center">
                    <Button
                      onClick={handleSaveBudgets}
                      size="sm"
                      className="bg-[#7578EC] hover:bg-[#7578EC]/90 text-white"
                    >
                      Salva
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300"
                    >
                      Annulla
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spesi: {formatCurrency(currentBudget.spent)}</span>
              <span className="text-gray-600">{progressPercentage.toFixed(1)}% utilizzati</span>
            </div>
            <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-700 ${progressPercentage >= 100 ? 'bg-red-500' :
                    progressPercentage >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                  }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </section>

        {/* Edit Budgets Section */}
        {isEditingBudgets && currentMemberData?.budgets && (
          <section className="bg-white px-4 py-4 shadow-sm rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modifica Budget per {currentMemberData.name}</h3>
            <div className="space-y-4">
              {currentMemberData.budgets.map((budget, index) => {
                const budgetId = `${selectedGroupFilter}-${index}`;
                const currentValue = editedBudgets[budgetId] ?? budget.budget;
                
                return (
                  <div key={budgetId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{CategoryIcons[budget.category] || "💰"}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{budget.category}</h4>
                        <p className="text-sm text-gray-500">
                          Spesi: {formatCurrency(budget.spent)} • Rimanenti: {formatCurrency(budget.remaining)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">€</span>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleBudgetChange(budgetId, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2 py-1 text-right border border-gray-300 rounded-md focus:border-[#7578EC] focus:ring-1 focus:ring-[#7578EC] outline-none"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Expense and Income Cards */}
        <section className="grid grid-cols-2 gap-4">
          {/* Expense Card */}
          <Card className="gap-0 p-4 bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Uscite</h3>
            </div>

            {/* Simple line graph visualization */}
            <div className="h-20 flex items-end justify-between mb-4 px-1">
              {dynamicChartData.expense.map((value: number, index: number) => (
                <div
                  key={index}
                  className="w-3 bg-gradient-to-t from-red-500 to-red-400 rounded-t shadow-sm"
                  style={{ height: `${maxExpense > 0 ? (value / maxExpense) * 100 : 0}%` }}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(currentBudget.spent)}
              </p>
              <p className="text-xs text-gray-500 font-medium">Questo periodo</p>
            </div>
          </Card>

          {/* Income Card */}
          <Card className="gap-0 p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Entrate</h3>
            </div>

            {/* Simple line graph visualization */}
            <div className="h-20 flex items-end justify-between mb-4 px-1">
              {dynamicChartData.income.map((value: number, index: number) => (
                <div
                  key={index}
                  className="w-3 bg-gradient-to-t from-green-500 to-green-400 rounded-t shadow-sm"
                  style={{ height: value > 0 && maxIncome > 0 ? `${(value / maxIncome) * 100}%` : '3px' }}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(dynamicChartData.income.reduce((sum: number, val: number) => sum + val, 0))}
              </p>
              <p className="text-xs text-gray-500 font-medium">Questo periodo</p>
            </div>
          </Card>
        </section>

        {/* Daily Expense Bar Graph */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Spese Giornaliere per Categoria</h3>
          </div>

          <Card className="p-3 bg-white shadow-sm border border-gray-200">
            {/* Bar Graph */}
            <div className="flex items-end justify-between gap-3 px-3">
              {dynamicChartData.dailyExpenses.map((day: { day: string; alimentari: number; intrattenimento: number; shopping: number }, index: number) => {
                const total = day.alimentari + day.intrattenimento + day.shopping;
                const maxTotal = Math.max(...dynamicChartData.dailyExpenses.map((d: { alimentari: number; intrattenimento: number; shopping: number }) => d.alimentari + d.intrattenimento + d.shopping));
                const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 120, 8) : 8;

                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div className="flex-1 flex flex-col justify-end">
                      <div
                        className="w-10 flex flex-col rounded-t overflow-hidden shadow-sm"
                        style={{ height: `${barHeight}px` }}
                      >
                        <div
                          className="bg-gradient-to-t from-green-500 to-green-400"
                          style={{ height: `${(day.alimentari / total) * 100}%` }}
                        />
                        <div
                          className="bg-gradient-to-t from-yellow-500 to-yellow-400"
                          style={{ height: `${(day.intrattenimento / total) * 100}%` }}
                        />
                        <div
                          className="bg-gradient-to-t from-blue-500 to-blue-400"
                          style={{ height: `${(day.shopping / total) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 mt-3">{day.day}</span>
                    <span className="text-xs text-gray-400">{formatCurrency(total)}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-6 justify-center pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shadow-sm bg-green-500" />
                <span className="text-sm font-medium text-gray-700">Alimentari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shadow-sm bg-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Intrattenimento</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full shadow-sm bg-blue-500" />
                <span className="text-sm font-medium text-gray-700">Shopping</span>
              </div>
            </div>
          </Card>
        </section>

        {/* Total Transactions Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">Transazioni Recenti</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-medium text-[#7578EC] hover:text-[#7578EC] hover:bg-[#7578EC]/10"
              onClick={() => {
                const params = new URLSearchParams();
                params.set('from', 'budgets');
                if (selectedGroupFilter !== 'all') {
                  params.set('member', selectedGroupFilter);
                }
                if (selectedBudget !== 'all') {
                  params.set('budget', selectedBudget);
                  const selectedBudgetData = budgets.find(b => b.id.toString() === selectedBudget);
                  if (selectedBudgetData) {
                    params.set('category', selectedBudgetData.name);
                  }
                }
                router.push(`/transactions?${params.toString()}`);
              }}
            >
              Visualizza Tutte →
            </Button>
          </div>

          <div className="space-y-3">
            {transactions.length > 0 ? (
              transactions.map((transaction) => {
                const categoryIcon = CategoryIcons[transaction.category] || '💳';

                return (
                  <Card key={transaction.id} className="px-4 py-3 bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                          <span className="text-sm">{categoryIcon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{transaction.title}</h4>
                          <p className="text-sm text-gray-500">{transaction.category} • {formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        -{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Nessuna transazione trovata</p>
              </div>
            )}
          </div>
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