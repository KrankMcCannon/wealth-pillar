"use client";

import {
  CategoryIcon,
  iconSizes
} from '@/lib/icons';
import { ArrowLeft, MoreVertical, TrendingUp, ShoppingCart } from "lucide-react";
import { useState, Suspense, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import { SectionHeader } from "@/components/section-header";
import { GroupedTransactionCard } from "@/components/grouped-transaction-card";
import { TransactionForm } from "@/components/transaction-form";
import { formatCurrency, getTotalForSection, formatDateLabel, pluralize } from "@/lib/utils";
import {
  useBudgets,
  useTransactions,
  useCategories,
  useAccounts,
  useBudgetPeriods,
  useUserSelection
} from "@/hooks";
import type { Budget, Transaction } from "@/lib/types";
import { BudgetPeriodManager } from "@/components/budget-period-manager";
import {
  getBudgetTransactions,
  getActivePeriodDates,
  calculateUserFinancialTotals
} from "@/lib/utils";

const getBudgetsForUser = (budgets: Budget[], userId: string, currentUser: { id: string; role: string; group_id: string } | null, users: { id: string; group_id: string }[]): Budget[] => {
  if (userId === 'all' && (currentUser?.role === 'admin' || currentUser?.role === 'superadmin')) {
    // Admin sees all budgets from users in their group
    return budgets.filter(budget => {
      const budgetUser = users?.find(u => u.id === budget.user_id);
      return budgetUser?.group_id === currentUser?.group_id;
    });
  }

  if (userId === 'all') {
    // Fallback for non-admin users - show their own budgets
    return budgets.filter(budget => budget.user_id === currentUser?.id);
  }

  // Specific user selected
  return budgets.filter(budget => budget.user_id === userId);
};


function BudgetsContent() {
  const router = useRouter();

  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [transactionFormMode, setTransactionFormMode] = useState<'create' | 'edit'>('edit');
  const { data: budgets = [], isLoading: budgetsLoading } = useBudgets();
  const { data: allTransactions = [], isLoading: txLoading } = useTransactions();
  const { data: accounts = [] } = useAccounts();

  const {
    currentUser,
    selectedViewUserId,
    users,
    updateViewUserId,
    isLoading: userSelectionLoading
  } = useUserSelection();
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});
  const { data: categories = [] } = useCategories();
  const [activeTab, setActiveTab] = useState('expenses');

  const { data: allBudgetPeriods = [], isLoading: periodLoading } = useBudgetPeriods();

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setTransactionFormMode('edit');
    setIsTransactionFormOpen(true);
  };

  useEffect(() => {
    // Update user map only if changed (avoid re-renders loop)
    const nextMap: { [key: string]: string } = {};
    users?.forEach(user => { nextMap[user.id] = user.name; });
    const sameSize = Object.keys(nextMap).length === Object.keys(userMap).length;
    const sameEntries = sameSize && Object.keys(nextMap).every(k => userMap[k] === nextMap[k]);
    if (!sameEntries) {
      setUserMap(nextMap);
    }
  }, [users, userMap]);

  // Separate effect for budget initialization to avoid dependency loops
  useEffect(() => {
    // Only run if we have the necessary data
    if (!budgets || !users || !currentUser) return;

    const availableBudgets = getBudgetsForUser(budgets, selectedViewUserId, currentUser, users);
    const first = availableBudgets[0];

    // Only update if we don't have a selected budget or it's not in the available budgets
    if (!selectedBudget || !availableBudgets.some(b => b.id === selectedBudget.id)) {
      setSelectedBudget(first || null);
    }
  }, [budgets, selectedViewUserId, currentUser, users, selectedBudget]);

  const getCurrentPeriodForUser = useCallback((userId: string) => {
    return allBudgetPeriods.find(period => period.user_id === userId && period.is_active);
  }, [allBudgetPeriods]);

  const budgetTotals = useMemo(() => {
    if (!selectedBudget) return null;
    const owner = users?.find(u => u.id === selectedBudget.user_id);
    if (!owner) return null;
    return calculateUserFinancialTotals(owner, [selectedBudget], allTransactions);
  }, [selectedBudget, users, allTransactions]);

  const budgetBalance = useMemo(() => {
    if (!selectedBudget || !budgetTotals) return 0;
    return Math.round((selectedBudget.amount - budgetTotals.totalSpent) * 100) / 100;
  }, [selectedBudget, budgetTotals]);

  const budgetProgress = useMemo(() => {
    if (!selectedBudget || !budgetTotals) return 0;
    const spent = budgetTotals.totalSpent;
    return Math.round(((spent / selectedBudget.amount) * 100));
  }, [selectedBudget, budgetTotals]);

  const chartData = useMemo(() => {
    if (!selectedBudget) {
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

    // Filter transactions based on selected user and budget categories
    let relevantTransactions = allTransactions;

    // Always scope to the budget owner
    relevantTransactions = relevantTransactions.filter(t => t.user_id === selectedBudget.user_id);

    // If a specific user is selected, filter by that user
    if (selectedViewUserId !== 'all') {
      relevantTransactions = relevantTransactions.filter(t => t.user_id === selectedViewUserId);
    }

    // Get budget period start date or use 30 days ago
    const currentPeriod = getCurrentPeriodForUser(selectedBudget.user_id);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    const startDate = currentPeriod?.start_date
      ? (() => {
          const d = new Date(currentPeriod.start_date);
          d.setHours(0, 0, 0, 0); // Normalize to midnight
          return d;
        })()
      : (() => {
          const d = new Date(today);
          d.setDate(today.getDate() - 29);
          d.setHours(0, 0, 0, 0); // Normalize to midnight
          return d;
        })();

    // Calculate 30 days from start date
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 29);
    endDate.setHours(23, 59, 59, 999); // End of day
    const displayEndDate = endDate > today ? today : endDate;

    const safeParse = (d: string | Date) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const recentTransactions = relevantTransactions.filter(t => {
      const transactionDate = safeParse(t.date);
      return transactionDate && transactionDate >= startDate && transactionDate <= displayEndDate;
    });

    // Create daily data structure
    const dailyExpenses: { [key: string]: number | string }[] = [];
    const dailyIncome: { [key: string]: number | string }[] = [];
    const categories = new Set<string>();
    const incomeTypes = new Set<string>();

    // Calculate number of days to display (always 30 days from budget start)
    const todayNormalized = new Date();
    todayNormalized.setHours(0, 0, 0, 0);
    const daysToShow = 30;

    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate.getTime());
      date.setDate(date.getDate() + i);

      // Show month only on first day or when month changes
      const prevDate = i > 0 ? new Date(startDate.getTime()) : null;
      if (prevDate) {
        prevDate.setDate(prevDate.getDate() + (i - 1));
      }

      const showMonth = i === 0 || !prevDate || date.getMonth() !== prevDate.getMonth();
      const dayStr = showMonth
        ? date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        : date.toLocaleDateString('it-IT', { day: 'numeric' });

      const dayTransactions = recentTransactions.filter(t => {
        const tDate = safeParse(t.date);
        return !!tDate && tDate.toDateString() === date.toDateString();
      });

      // Process expenses
      const expenseData: { [key: string]: number | string } = { day: dayStr };
      const incomeData: { [key: string]: number | string } = { day: dayStr };

      dayTransactions.forEach(t => {
        if (t.type === 'expense' && selectedBudget.categories.includes(t.category)) {
          expenseData[t.category] = (expenseData[t.category] as number || 0) + t.amount;
          categories.add(t.category);
        } else if (t.type === 'income') {
          incomeData[t.category] = (incomeData[t.category] as number || 0) + t.amount;
          incomeTypes.add(t.category);
        }
      });

      dailyExpenses.push(expenseData);
      dailyIncome.push(incomeData);
    }

    const expenseAmounts = dailyExpenses.map((day) => {
      return Object.entries(day)
        .filter(([key]) => key !== 'day')
        .reduce((sum: number, [, val]) => sum + (val as number), 0);
    });

    const incomeAmounts = dailyIncome.map((day) => {
      return Object.entries(day)
        .filter(([key]) => key !== 'day')
        .reduce((sum: number, [, val]) => sum + (val as number), 0);
    });

    return {
      expense: expenseAmounts,
      income: incomeAmounts,
      maxExpense: Math.max(...expenseAmounts, 1),
      maxIncome: Math.max(...incomeAmounts, 1),
      dailyExpenses,
      dailyIncome,
      categories: Array.from(categories),
      incomeTypes: Array.from(incomeTypes)
    };
  }, [selectedBudget, allTransactions, selectedViewUserId, getCurrentPeriodForUser]);

  const getCategoryColor = useCallback((categoryKey: string): string => {
    const category = categories.find(cat => cat.key === categoryKey);
    return category?.color || '#6b7280';
  }, [categories]);

  const getCategoryIcon = useCallback((categoryKey: string): React.ReactElement => {
    return (
      <CategoryIcon
        categoryKey={categoryKey}
        size={iconSizes.xs}
        className="text-slate-600"
      />
    );
  }, []);

  const getIncomeIcon = useCallback((categoryKey: string): React.ReactElement => {
    return (
      <CategoryIcon
        categoryKey={categoryKey}
        size={iconSizes.sm}
        className="text-emerald-600"
      />
    );
  }, []);

  const unifiedChartData = useMemo(() => {
    if (!selectedBudget) {
      return {
        data: [],
        dataKeys: [],
        total: 0,
        title: '',
        icon: null,
        colors: {},
        emptyMessage: '',
        legendBorder: '',
        gradientColors: ''
      };
    }

    switch (activeTab) {
      case 'expenses':
        const expenseColors: { [key: string]: string } = {};
        chartData.categories.forEach(category => {
          expenseColors[category] = getCategoryColor(category);
        });
        return {
          data: chartData.dailyExpenses,
          dataKeys: chartData.categories,
          total: chartData.expense.reduce((sum: number, val: number) => sum + val, 0),
          title: 'Uscite per Categoria',
          icon: <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-white drop-shadow-sm" />,
          colors: expenseColors,
          emptyMessage: 'Nessuna spesa per questo giorno',
          legendBorder: 'border-red-100',
          gradientColors: 'from-rose-500 to-rose-600',
          iconBg: 'from-rose-500 to-rose-600',
          iconShadow: 'shadow-rose-200/50'
        };
      case 'income':
        const incomeColors: { [key: string]: string } = {};
        chartData.incomeTypes.forEach((type, index) => {
          const colors = ['#16a34a', '#22c55e', '#4ade80'];
          incomeColors[type] = colors[index % colors.length] || '#16a34a';
        });
        return {
          data: chartData.dailyIncome,
          dataKeys: chartData.incomeTypes,
          total: chartData.income.reduce((sum: number, val: number) => sum + val, 0),
          title: 'Entrate per Tipo',
          icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
          colors: incomeColors,
          emptyMessage: 'Nessuna entrata per questo giorno',
          legendBorder: 'border-green-100',
          gradientColors: 'from-emerald-500 to-emerald-600',
          iconBg: 'from-emerald-500 to-emerald-600',
          iconShadow: 'shadow-emerald-200/50'
        };
      default:
        const defaultIncomeColors: { [key: string]: string } = {};
        chartData.incomeTypes.forEach((type, index) => {
          const colors = ['#16a34a', '#22c55e', '#4ade80'];
          defaultIncomeColors[type] = colors[index % colors.length] || '#16a34a';
        });
        return {
          data: chartData.dailyIncome,
          dataKeys: chartData.incomeTypes,
          total: chartData.income.reduce((sum: number, val: number) => sum + val, 0),
          title: 'Entrate per Tipo',
          icon: <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />,
          colors: defaultIncomeColors,
          emptyMessage: 'Nessuna entrata per questo giorno',
          legendBorder: 'border-green-100',
          gradientColors: 'from-emerald-500 to-emerald-600',
          iconBg: 'from-emerald-500 to-emerald-600',
          iconShadow: 'shadow-emerald-200/50'
        };
    }
  }, [activeTab, chartData, selectedBudget, getCategoryColor]);

  const budgetTransactions = useMemo(() => {
    if (!selectedBudget) return [];

    // Find the user for period information
    const user = users?.find(u => u.id === selectedBudget.user_id);
    if (!user) return [];

    // Get period dates using centralized function
    const { start, end } = getActivePeriodDates(user);

    // Use centralized function to get all budget transactions for the period
    const periodTransactions = getBudgetTransactions(
      allTransactions,
      selectedBudget,
      start || undefined,
      end || undefined
    );

    // Filter by selected user if not 'all'
    const filteredTransactions = selectedViewUserId !== 'all'
      ? periodTransactions.filter(t => t.user_id === selectedViewUserId)
      : periodTransactions;

    // Sort by date (most recent first) and return ALL transactions (no slice limit)
    return filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedBudget, selectedViewUserId, allTransactions, users]);

  const processedBudgetTransactions = useMemo(() => {
    const safeParse = (d: string | Date) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? null : dt;
    };

    const sorted = [...budgetTransactions]
      .filter(t => !!safeParse(t.date))
      .sort((a, b) => {
        const da = safeParse(a.date)!;
        const db = safeParse(b.date)!;
        return db.getTime() - da.getTime();
      });

    const groupedByDay: Record<string, typeof sorted> = {};
    sorted.forEach(tx => {
      const d = safeParse(tx.date);
      if (!d) return;
      const key = d.toISOString().split('T')[0];
      if (!groupedByDay[key]) groupedByDay[key] = [];
      groupedByDay[key].push(tx);
    });

    const dayGroups = Object.entries(groupedByDay)
      .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
      .map(([date, transactions]) => ({
        date,
        transactions,
        total: getTotalForSection(transactions),
        dateLabel: formatDateLabel(date)
      }));

    return {
      dayGroups,
      allTotal: getTotalForSection(sorted)
    };
  }, [budgetTransactions]);

  const accountNames = useMemo(() => {
    const names: Record<string, string> = {};
    accounts.forEach(account => {
      names[account.id] = account.name;
    });
    return names;
  }, [accounts]);

  const availableBudgets = useMemo(() => {
    const filtered = getBudgetsForUser(budgets, selectedViewUserId, currentUser, users || []);

    // Sort budgets by owner first, then alphabetically by budget name
    return filtered.sort((a, b) => {
      const ownerA = userMap[a.user_id] || '';
      const ownerB = userMap[b.user_id] || '';

      // First sort by owner name
      if (ownerA !== ownerB) {
        return ownerA.localeCompare(ownerB, 'it');
      }

      // If same owner, sort by budget description alphabetically
      return a.description.localeCompare(b.description, 'it');
    });
  }, [selectedViewUserId, budgets, currentUser, users, userMap]);

  const handleBudgetChange = useCallback((value: string) => {
    const budget = availableBudgets.find((b) => b.id === value);
    if (budget) {
      setSelectedBudget(budget);
    }
  }, [availableBudgets]);


  return (
    <div className="relative flex size-full min-h-[100dvh] flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100" style={{ fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left - Back button */}
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedViewUserId !== 'all') {
                params.set('selectedViewUserId', selectedViewUserId);
              }
              const dashboardUrl = `/dashboard${params.toString() ? '?' + params.toString() : ''}`;
              router.push(dashboardUrl);
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          {/* Center - Title */}
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Budget</h1>

          {/* Right - Three dots menu */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-xl transition-all duration-200 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-xl rounded-xl p-2 animate-in slide-in-from-top-2 duration-200"
              sideOffset={8}
            >
              <DropdownMenuItem className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">💰</span>
                Nuovo Budget
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">🏷️</span>
                Nuova Categoria
              </DropdownMenuItem>
              {selectedBudget && (
                <BudgetPeriodManager
                  budget={selectedBudget}
                  currentPeriod={getCurrentPeriodForUser(selectedBudget.user_id) || null}
                  onSuccess={() => setIsDropdownOpen(false)}
                  trigger={
                    <DropdownMenuItem
                      className="text-sm font-medium text-slate-700 hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-3 py-2.5 cursor-pointer transition-colors"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <span className="mr-2">📅</span>
                      Gestisci Periodi
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Only show UserSelector when data is available */}
      {!userSelectionLoading && (
        <UserSelector
          users={users}
          currentUser={currentUser}
          selectedGroupFilter={selectedViewUserId}
          onGroupFilterChange={updateViewUserId}
        />
      )}

      {/* Divider Line */}
      <div className="h-px bg-gray-200 mx-4"></div>

      <main className="flex-1 p-3 sm:p-4 space-y-4 sm:space-y-6 pb-20 sm:pb-24">
        {/* Progressive loading - show content as soon as we have essential data */}
        {userSelectionLoading || budgetsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7578EC]"></div>
          </div>
        ) : !selectedBudget ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[#7578EC]/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <ShoppingCart className="w-8 h-8 text-[#7578EC]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Nessun budget disponibile</h3>
            <p className="text-slate-600 text-sm">Crea il tuo primo budget per iniziare</p>
          </div>
        ) : (
          <>
            {/* Budget Selector */}
            <section className="bg-white/90 backdrop-blur-sm px-4 py-4 sm:px-6 sm:py-6 shadow-lg shadow-slate-200/40 rounded-xl sm:rounded-2xl border border-slate-200/50">
              {/* Section Header */}
              <div className="mb-4">
                <SectionHeader
                  title="Budget"
                  subtitle="Seleziona per visualizzare i dettagli"
                  className="space-y-1"
                />
              </div>

              {/* Budget Selector */}
              <div className="mb-4">
                <Select value={selectedBudget?.id} onValueChange={handleBudgetChange}>
                  <SelectTrigger className="w-full h-12 bg-white border border-slate-200 shadow-sm rounded-xl px-4 hover:border-[#7578EC]/40 focus:border-[#7578EC] focus:ring-2 focus:ring-[#7578EC]/20 transition-all text-sm font-medium">
                    <SelectValue placeholder="Seleziona budget" className="font-medium text-slate-700" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-md border border-slate-200/60 shadow-xl rounded-xl min-w-[320px]">
                    {availableBudgets.map((budget) => (
                      <SelectItem
                        key={budget.id}
                        value={budget.id}
                        className="hover:bg-[#7578EC]/10 hover:text-[#7578EC] rounded-lg px-7 cursor-pointer transition-colors font-medium"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#7578EC]/10 flex-shrink-0">
                            <CategoryIcon
                              categoryKey={budget.categories[0] || 'altro'}
                              size={iconSizes.sm}
                              className="text-[#7578EC]"
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="font-semibold truncate text-slate-800">
                              {budget.description}
                            </span>
                            {selectedViewUserId === 'all' && userMap[budget.user_id] && (
                              <span className="text-xs text-slate-500 flex-shrink-0">({userMap[budget.user_id]})</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Budget Display - Horizontal Layout */}
              <div className="mb-4">
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl p-4">
                  {/* Budget Icon, Name and Period */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#7578EC]/10 to-[#7578EC]/5 shadow-sm">
                        <CategoryIcon
                          categoryKey={selectedBudget.categories[0] || 'altro'}
                          size={iconSizes.lg}
                          className="text-[#7578EC]"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{selectedBudget.description}</h3>
                        <p className="text-xs text-slate-500 font-medium">Budget attivo</p>
                      </div>
                    </div>
                    {/* Budget Period Date */}
                    {!periodLoading && selectedBudget && getCurrentPeriodForUser(selectedBudget.user_id) && (
                      <div className="text-right">
                        {(() => {
                          const period = getCurrentPeriodForUser(selectedBudget.user_id)!;
                          return (
                            <>
                              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Periodo</p>
                              <p className="text-xs font-medium text-slate-700 whitespace-nowrap">
                                {new Date(period.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} - {period.end_date ? new Date(period.end_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) : 'In corso'}
                              </p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Financial Info - 3 Column Layout */}
                  {!periodLoading && selectedBudget && getCurrentPeriodForUser(selectedBudget.user_id) ? (
                    <div className="grid grid-cols-3 gap-3">
                      {/* Available Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Disponibile</p>
                        <p className={`text-lg sm:text-xl font-bold tracking-tight ${budgetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budgetBalance)}
                        </p>
                      </div>

                      {/* Spent Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        {(() => {
                          const owner = users?.find(u => u.id === selectedBudget.user_id) || null;
                          const totals = owner
                            ? calculateUserFinancialTotals(owner, [selectedBudget], allTransactions)
                            : { totalSpent: 0, totalSaved: 0, totalBudget: 0, totalFromPeriods: 0, totalFromBudgets: 0 };
                          return (
                            <>
                              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Speso</p>
                              <p className="text-lg sm:text-xl font-bold tracking-tight text-red-600">
                                {formatCurrency(totals.totalSpent)}
                              </p>
                            </>
                          );
                        })()}
                      </div>

                      {/* Total Budget */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Totale</p>
                        <p className="text-lg sm:text-xl font-bold tracking-tight text-slate-700">
                          {formatCurrency(selectedBudget.amount)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Available Amount */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Disponibile</p>
                        <p className={`text-xl sm:text-2xl font-bold tracking-tight ${budgetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(budgetBalance)}
                        </p>
                      </div>

                      {/* Total Budget */}
                      <div className="text-center p-3 bg-white/60 rounded-lg">
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Totale</p>
                        <p className="text-xl sm:text-2xl font-bold tracking-tight text-slate-700">
                          {formatCurrency(selectedBudget.amount)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Section - Integrated */}
              <div className="bg-white/60 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      budgetProgress >= 100 ? 'bg-red-500' :
                      budgetProgress >= 80 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-semibold text-slate-700">
                      Progresso Budget
                    </span>
                  </div>
                  <span className={`text-xl font-bold ${
                    budgetProgress >= 100 ? 'text-red-600' :
                    budgetProgress >= 80 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>{budgetProgress}%</span>
                </div>

                <div className="relative">
                  <div className="w-full h-3 rounded-full bg-slate-200">
                    <div
                      className={`h-3 rounded-full transition-all duration-700 ease-out ${
                        budgetProgress >= 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                        budgetProgress >= 80 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                        'bg-gradient-to-r from-green-400 to-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status Text */}
                <div className="text-center">
                  <p className="text-xs text-slate-600">
                    {budgetProgress >= 100 ? '⚠️ Budget superato' :
                     budgetProgress >= 80 ? '⚠️ Attenzione, quasi esaurito' :
                     '✅ Budget sotto controllo'}
                  </p>
                </div>
              </div>

            </section>

            {/* Expense Chart - Only show when transaction data is loaded */}
            {!txLoading && (
            <section>
              <Card className="p-4 sm:p-5 bg-white/90 backdrop-blur-sm shadow-lg shadow-slate-200/40 rounded-xl sm:rounded-2xl border border-slate-200/50">
                <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 bg-gradient-to-br ${unifiedChartData.iconBg} rounded-xl shadow-md ${unifiedChartData.iconShadow}`}>
                          {unifiedChartData.icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{unifiedChartData.title}</h3>
                          <p className="text-xs text-slate-500 font-medium">Ultimi 30 giorni</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${unifiedChartData.gradientColors} bg-clip-text text-transparent`}>
                          {formatCurrency(unifiedChartData.total)}
                        </p>
                        {selectedBudget && (
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {((unifiedChartData.total / selectedBudget.amount) * 100).toFixed(1)}% del budget
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Line Chart */}
                    <div className="relative h-48 sm:h-56 bg-gradient-to-b from-gray-50 to-white rounded-xl p-4 pl-12">
                      {/* Y-axis labels */}
                      <div className="absolute left-0 top-4 bottom-4 flex flex-col-reverse justify-between text-[10px] text-slate-500 font-medium pr-2">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <div key={percent} className="leading-none">
                            {percent}%
                          </div>
                        ))}
                      </div>
                      <svg className="w-full h-full" viewBox="0 0 350 200" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <line
                            key={percent}
                            x1="0"
                            y1={200 - (percent * 2)}
                            x2="350"
                            y2={200 - (percent * 2)}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            opacity="0.5"
                          />
                        ))}

                        {/* Line for cumulative amounts */}
                        {(() => {
                          const todayNormalized = new Date();
                          todayNormalized.setHours(0, 0, 0, 0);

                          // Calculate cumulative amounts for each day
                          let cumulativeTotal = 0;
                          const cumulativeData = unifiedChartData.data.map((dayData: { [key: string]: number | string }, index: number) => {
                            const { day, ...amounts } = dayData;
                            const dayTotal = Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                            cumulativeTotal += dayTotal;

                            // Calculate the date for this index
                            const currentPeriod = getCurrentPeriodForUser(selectedBudget.user_id);
                            const startDate = currentPeriod?.start_date
                              ? new Date(currentPeriod.start_date)
                              : new Date(todayNormalized.getTime() - 29 * 24 * 60 * 60 * 1000);
                            startDate.setHours(0, 0, 0, 0);

                            const dateForIndex = new Date(startDate);
                            dateForIndex.setDate(dateForIndex.getDate() + index);

                            return { day, cumulative: cumulativeTotal, date: dateForIndex, isFuture: dateForIndex > todayNormalized };
                          });

                          // Filter to only include days up to today for the line
                          const dataUpToToday = cumulativeData.filter(d => !d.isFuture);

                          // Use budget amount as the max (100%)
                          const maxAmount = selectedBudget?.amount || 1;

                          const points = dataUpToToday.map((data, index: number) => {
                            const percentage = (data.cumulative / maxAmount) * 100;
                            const cappedPercentage = Math.min(percentage, 100); // Cap at 100%
                            const originalIndex = cumulativeData.indexOf(data);
                            const x = (originalIndex / (cumulativeData.length - 1)) * 350;
                            const y = 200 - ((cappedPercentage / 100) * 180);
                            return `${x},${y}`;
                          }).join(' ');

                          const pathD = dataUpToToday.map((data, index: number) => {
                            const percentage = (data.cumulative / maxAmount) * 100;
                            const cappedPercentage = Math.min(percentage, 100);
                            const originalIndex = cumulativeData.indexOf(data);
                            const x = (originalIndex / (cumulativeData.length - 1)) * 350;
                            const y = 200 - ((cappedPercentage / 100) * 180);
                            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                          }).join(' ');

                          // Get the last point's X coordinate to close the gradient properly
                          const lastDataIndex = dataUpToToday.length > 0 ? cumulativeData.indexOf(dataUpToToday[dataUpToToday.length - 1]) : 0;
                          const lastX = (lastDataIndex / (cumulativeData.length - 1)) * 350;

                          return (
                            <>
                              {/* Gradient fill under line */}
                              <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                  <stop offset="0%" style={{ stopColor: '#7578EC', stopOpacity: 0.3 }} />
                                  <stop offset="100%" style={{ stopColor: '#7578EC', stopOpacity: 0 }} />
                                </linearGradient>
                              </defs>
                              <path
                                d={`${pathD} L ${lastX} 200 L 0 200 Z`}
                                fill="url(#lineGradient)"
                              />

                              {/* Main line with sharp angles */}
                              <polyline
                                points={points}
                                fill="none"
                                stroke="#7578EC"
                                strokeWidth="3"
                                strokeLinecap="butt"
                                strokeLinejoin="miter"
                              />
                            </>
                          );
                        })()}
                      </svg>

                      {/* X-axis labels - Show only every 3rd day */}
                      <div className="flex justify-between mt-2 px-1">
                        {unifiedChartData.data.map((dayData: { [key: string]: number | string }, index: number) => {
                          const showLabel = index === 0 || index === unifiedChartData.data.length - 1 || index % 3 === 0;
                          return (
                            <span key={index} className={`text-xs font-semibold ${showLabel ? 'text-slate-600' : 'text-transparent'}`}>
                              {showLabel ? dayData.day as string : '·'}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                </div>
              </Card>
            </section>
            )}

            {/* Budget Period Transactions Section - Only show when data is loaded */}
            {!txLoading && (
            <section>
              <SectionHeader
                title="Transazioni Budget"
                subtitle={selectedBudget && getCurrentPeriodForUser(selectedBudget.user_id) ?
                  `${new Date(getCurrentPeriodForUser(selectedBudget.user_id)!.start_date).toLocaleDateString('it-IT')} - ${getCurrentPeriodForUser(selectedBudget.user_id)!.end_date ? new Date(getCurrentPeriodForUser(selectedBudget.user_id)!.end_date!).toLocaleDateString('it-IT') : 'Oggi'}` :
                  `${budgetTransactions.length} ${budgetTransactions.length === 1 ? 'transazione' : 'transazioni'}`
                }
                className="mb-4"
              />

              <div className="space-y-6">
                {processedBudgetTransactions.dayGroups.length > 0 ? (
                  processedBudgetTransactions.dayGroups.map((dayGroup) => (
                    <section key={dayGroup.date}>
                      <div className="flex items-center justify-between mb-2 px-1">
                        <h2 className="text-lg font-bold tracking-tight text-gray-900">{dayGroup.dateLabel}</h2>
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-gray-500">Totale:</span>
                            <span className={`text-sm font-bold ${dayGroup.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(dayGroup.total)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {pluralize(dayGroup.transactions.length, 'transazione', 'transazioni')}
                          </div>
                        </div>
                      </div>
                      <GroupedTransactionCard
                        transactions={dayGroup.transactions}
                        accountNames={accountNames}
                        variant="regular"
                        onEditTransaction={handleEditTransaction}
                      />
                    </section>
                  ))
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
                    className="text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all duration-200 px-5 py-2.5 min-h-[40px] border border-slate-200 hover:border-slate-300 hover:shadow-sm group"
                    onClick={() => {
                      const params = new URLSearchParams();
                      params.set('from', 'budgets');
                      if (selectedViewUserId !== 'all') {
                        params.set('member', selectedViewUserId);
                      }
                      if (selectedBudget && selectedBudget.id) {
                        params.set('budget', selectedBudget.id);
                        params.set('category', selectedBudget.description);
                      }
                      router.push(`/transactions?${params.toString()}`);
                    }}
                  >
                    <span className="mr-2">Vedi tutte</span>
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
                  </Button>
                </div>
              )}
            </section>
            )}
          </>
        )}
      </main>

      <BottomNavigation />

      {/* Transaction Form */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        selectedUserId={selectedViewUserId !== 'all' ? selectedViewUserId : ''}
        transaction={editingTransaction || undefined}
        mode={transactionFormMode}
      />
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
