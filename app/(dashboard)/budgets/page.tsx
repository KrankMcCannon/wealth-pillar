"use client";

import {
  CategoryIcon,
  iconSizes
} from '@/lib/icons';
import { ArrowLeft, MoreVertical, TrendingUp, ShoppingCart } from "lucide-react";
import { useState, Suspense, useMemo, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BottomNavigation from "@/components/bottom-navigation";
import UserSelector from "@/components/user-selector";
import {
  budgetService,
  transactionService,
  userService,
  categoryService,
  apiHelpers
} from "@/lib/api";
import {
  formatCurrency
} from "@/lib/utils";
import { Budget, Transaction, Category, User } from "@/lib/types";
import {
  saveSelectedUser,
  getInitialSelectedUser
} from "@/lib/persistent-user-selection";

// Helper functions following DRY principles
const createAggregatedBudget = (budgets: Budget[], userId: string): Budget => {
  const targetBudgets = userId === 'all' ? budgets : budgets.filter(b => b.user_id === userId);
  return {
    id: `all_budgets_${userId}`,
    description: 'Tutti i Budget',
    amount: targetBudgets.reduce((sum, budget) => sum + budget.amount, 0),
    type: 'monthly' as const,
    categories: [...new Set(targetBudgets.flatMap(budget => budget.categories))],
    user_id: userId,
    created_at: new Date(),
    updated_at: new Date()
  };
};

const getBudgetsForUser = (budgets: Budget[], userId: string): Budget[] => {
  if (userId === 'all') {
    return budgets.length > 1 
      ? [createAggregatedBudget(budgets, 'all'), ...budgets]
      : budgets;
  }
  
  const userBudgets = budgets.filter(budget => budget.user_id === userId);
  return userBudgets.length > 1
    ? [createAggregatedBudget(budgets, userId), ...userBudgets]
    : userBudgets;
};

const filterTransactionsByBudget = (transactions: Transaction[], budget: Budget, selectedUser: string): Transaction[] => {
  let filtered = transactions.filter(transaction =>
    transaction.type === 'expense' &&
    budget.categories.includes(transaction.category)
  );

  if (selectedUser !== 'all' && !budget.id.startsWith('all_budgets_')) {
    filtered = filtered.filter(t => t.user_id === selectedUser);
  } else if (budget.id.startsWith('all_budgets_')) {
    const userId = budget.id.replace('all_budgets_', '');
    if (userId !== 'all') {
      filtered = filtered.filter(t => t.user_id === userId);
    }
  }

  return filtered;
};

function BudgetsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userMap, setUserMap] = useState<{ [key: string]: string }>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const user = await apiHelpers.getCurrentUser();
        setCurrentUser(user);

        // Get initial user selection with persistence and validation
        const urlSelectedUser = searchParams.get('selectedUser');
        const initialUser = getInitialSelectedUser(user, urlSelectedUser);
        setSelectedUser(initialUser);

        // Fetch all data
        const [budgetsData, transactionsData, usersData, categoriesData] = await Promise.all([
          budgetService.getAll(),
          transactionService.getAll(),
          userService.getAll(),
          categoryService.getAll()
        ]);

        setBudgets(budgetsData);
        setAllTransactions(transactionsData);
        setCategories(categoriesData);
        setUsers(usersData);

        // Create user lookup map for backward compatibility
        const userLookupMap: { [key: string]: string } = {};
        usersData.forEach(user => {
          userLookupMap[user.id] = user.name;
        });
        setUserMap(userLookupMap);

        // Set initial selected budget using DRY helper
        const initialBudgets = getBudgetsForUser(budgetsData, initialUser);
        if (initialBudgets.length > 0) {
          setSelectedBudget(initialBudgets[0]);
        }
      } catch (error) {
        console.error('Error fetching budget data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  // Calculate budget spent amount
  const getBudgetSpent = useCallback((budget: Budget): number => {
    if (!budget) return 0;
    const relevantTransactions = filterTransactionsByBudget(allTransactions, budget, selectedUser);
    return relevantTransactions.reduce((total, transaction) => total + transaction.amount, 0);
  }, [allTransactions, selectedUser]);

  const budgetBalance = useMemo(() => {
    if (!selectedBudget) return 0;
    return selectedBudget.amount - getBudgetSpent(selectedBudget);
  }, [selectedBudget, getBudgetSpent]);

  const budgetProgress = useMemo(() => {
    if (!selectedBudget) return 0;
    const spent = getBudgetSpent(selectedBudget);
    return Math.round((spent / selectedBudget.amount) * 100);
  }, [selectedBudget, getBudgetSpent]);

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
    if (selectedUser !== 'all' && !selectedBudget.id.startsWith('all_budgets_')) {
      relevantTransactions = relevantTransactions.filter(t => t.user_id === selectedUser);
    } else if (selectedBudget.id.startsWith('all_budgets_')) {
      // For aggregated budgets, filter by the specific user (unless it's all_budgets_all)
      const userId = selectedBudget.id.replace('all_budgets_', '');
      if (userId !== 'all') {
        relevantTransactions = relevantTransactions.filter(t => t.user_id === userId);
      }
      // If userId === 'all', include all transactions (no additional filtering)
    }

    // Get transactions from the last 7 days
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 6);

    const recentTransactions = relevantTransactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= weekAgo && transactionDate <= today;
    });

    // Create daily data structure
    const dailyExpenses: { [key: string]: number | string }[] = [];
    const dailyIncome: { [key: string]: number | string }[] = [];
    const categories = new Set<string>();
    const incomeTypes = new Set<string>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dayStr = date.toLocaleDateString('it-IT', { weekday: 'short' });

      const dayTransactions = recentTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.toDateString() === date.toDateString();
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

    const expenseAmounts = dailyExpenses.map(day => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { day: _, ...amounts } = day;
      return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
    });

    const incomeAmounts = dailyIncome.map(day => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { day: _, ...amounts } = day;
      return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
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
  }, [selectedBudget, allTransactions, selectedUser]);

  // Helper functions to get category data from database
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
    // Usa CategoryIcon component per icone line-art
    return (
      <CategoryIcon
        categoryKey={categoryKey}
        size={iconSizes.sm}
                className="text-emerald-600"
      />
    );
  }, []);

  // Unified chart configuration based on active tab
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
    return filterTransactionsByBudget(allTransactions, selectedBudget, selectedUser)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [selectedBudget, selectedUser, allTransactions]);

  const availableBudgets = useMemo(() => 
    getBudgetsForUser(budgets, selectedUser), 
    [selectedUser, budgets]
  );

  const handleBudgetChange = useCallback((value: string) => {
    const budget = availableBudgets.find((b) => b.id === value);
    if (budget) {
      setSelectedBudget(budget);
    }
  }, [availableBudgets]);

  const handleUserChange = useCallback((userId: string) => {
    setSelectedUser(userId);

    // Save to localStorage for persistence across pages
    saveSelectedUser(userId);

    // Also update URL for immediate feedback and browser history
    const params = new URLSearchParams(window.location.search);
    if (userId === 'all') {
      params.delete('selectedUser');
    } else {
      params.set('selectedUser', userId);
    }

    // Update URL without page reload
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
    // Update budget selection using DRY helper
    const newAvailableBudgets = getBudgetsForUser(budgets, userId);
    if (newAvailableBudgets.length > 0) {
      setSelectedBudget(newAvailableBudgets[0]);
    } else {
      setSelectedBudget(null);
    }
  }, [budgets]);

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
            onClick={() => {
              const params = new URLSearchParams();
              if (selectedUser !== 'all') {
                params.set('selectedUser', selectedUser);
              }
              const dashboardUrl = `/dashboard${params.toString() ? '?' + params.toString() : ''}`;
              router.push(dashboardUrl);
            }}
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
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">💰</span>
                Aggiungi Nuovo Budget
              </DropdownMenuItem>
              <DropdownMenuItem className="text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
                <span className="mr-2">🏷️</span>
                Aggiungi Nuova Categoria
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Only show UserSelector for admin and superadmin users */}
      {currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'admin') && (
        <>
          <UserSelector
            users={users}
            currentUser={currentUser}
            selectedGroupFilter={selectedUser}
            onGroupFilterChange={handleUserChange}
          />
          {/* Divider Line */}
          <div className="h-px bg-gray-200 mx-4"></div>
        </>
      )}

      <main className="flex-1 p-3 sm:p-4 space-y-6 sm:space-y-8 pb-20 sm:pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !selectedBudget ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nessun budget disponibile</p>
          </div>
        ) : (
          <>
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
                  <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200/60 shadow-xl rounded-xl min-w-52">
                    {availableBudgets.map((budget) => (
                      <SelectItem
                        key={budget.id}
                        value={budget.id}
                        className="hover:bg-primary/10 hover:text-primary rounded-lg p-3 cursor-pointer transition-colors font-medium relative"
                      >
                        <div className="flex items-center gap-3 w-full px-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-secondary/20 flex-shrink-0">
                            <CategoryIcon
                              categoryKey={budget.categories[0] || 'altro'}
                              size={iconSizes.sm}
                            />
                          </div>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="group-hover:font-semibold transition-all duration-200 truncate">
                              {budget.description}
                            </span>
                            {selectedUser === 'all' && userMap[budget.user_id] && (
                              <span className="text-xs text-gray-500 flex-shrink-0">({userMap[budget.user_id]})</span>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Budget Display */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl shadow-lg bg-slate-100">
                    <CategoryIcon
                      categoryKey={selectedBudget.categories[0] || 'altro'}
                      size={iconSizes.xl}
                                                                />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{selectedBudget.description}</h3>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div className="inline-block px-3 sm:px-4 py-2 bg-slate-50 rounded-2xl">
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Importo Disponibile</p>
                    <p className={`text-2xl sm:text-4xl font-bold tracking-tight ${budgetBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(budgetBalance)}
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
                    <div className={`w-2 h-2 rounded-full ${
                      budgetProgress >= 100 ? 'bg-red-500' :
                      budgetProgress >= 80 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-sm font-semibold text-slate-700">Spesi: {formatCurrency(getBudgetSpent(selectedBudget))}</span>
                  </div>
                  <div className="px-3 py-1 bg-slate-100 rounded-full">
                    <span className={`text-xs font-bold ${
                      budgetProgress >= 100 ? 'text-red-600' :
                      budgetProgress >= 80 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>{budgetProgress}% utilizzati</span>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full h-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200 shadow-inner">
                    <div
                      className={`h-4 rounded-2xl transition-all duration-1000 ease-out shadow-lg ${
                        budgetProgress >= 100 ? 'bg-red-500' :
                        budgetProgress >= 80 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                    />
                  </div>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-white/20 to-transparent pointer-events-none"></div>
                </div>
              </div>
            </section>

            {/* Charts with Tabs */}
            <section>
              <Card className="p-4 sm:p-6 bg-white/80 backdrop-blur-sm shadow-xl shadow-slate-200/50 rounded-2xl sm:rounded-3xl border border-white/50">
                <Tabs defaultValue="expenses" onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100/80 backdrop-blur-sm border border-slate-200/50 shadow-sm rounded-2xl p-1">
                    <TabsTrigger value="expenses" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-rose-200/50 rounded-xl transition-all duration-200">
                      <ShoppingCart className="h-4 w-4 text-white" />
                      Uscite
                    </TabsTrigger>
                    <TabsTrigger value="income" className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-emerald-200/50 rounded-xl transition-all duration-200">
                      <TrendingUp className="h-4 w-4 text-white" />
                      Entrate
                    </TabsTrigger>
                  </TabsList>

                  {/* Unified Chart Content */}
                  <TabsContent value="expenses" className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-2 sm:p-3 bg-gradient-to-br ${unifiedChartData.iconBg} rounded-xl sm:rounded-2xl shadow-lg ${unifiedChartData.iconShadow}`}>
                          {unifiedChartData.icon}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{unifiedChartData.title}</h3>
                      </div>
                      <div className="text-left sm:text-right space-y-1">
                        <p className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${unifiedChartData.gradientColors} bg-clip-text text-transparent`}>
                          {formatCurrency(unifiedChartData.total)}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Questo periodo</p>
                      </div>
                    </div>

                    {/* Unified Bar Chart */}
                    <div className="flex items-end justify-between gap-1 px-1 h-28 sm:h-36 bg-gray-50 rounded-xl" style={{ paddingTop: '8px' }}>
                      {unifiedChartData.data.map((dayData: { [key: string]: number | string }, index: number) => {
                        const { day, ...amounts } = dayData;
                        const total = Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                        const maxTotal = Math.max(...unifiedChartData.data.map((d: { [key: string]: number | string }) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { day: _, ...amounts } = d;
                          return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                        }), 1);
                        const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 70, 16) : 16;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                            <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                              <div
                                className="w-full flex flex-col rounded-t overflow-hidden shadow-sm min-h-[16px] bg-gray-100"
                                style={{ height: `${barHeight}px` }}
                              >
                                {total > 0 ? (
                                  unifiedChartData.dataKeys.map((key: string) => {
                                    const amount = amounts[key] as number || 0;
                                    if (amount === 0) return null;
                                    return (
                                      <div
                                        key={key}
                                        style={{
                                          height: `${(amount / total) * 100}%`,
                                          backgroundColor: (unifiedChartData.colors as { [key: string]: string })[key] || '#6b7280'
                                        }}
                                        title={`${key}: ${formatCurrency(amount)}`}
                                      />
                                    );
                                  })
                                ) : (
                                  <div
                                    className="w-full bg-gray-300 rounded-t"
                                    style={{ height: '16px' }}
                                    title={unifiedChartData.emptyMessage}
                                  />
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 mt-2">{day as string}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Unified Legend */}
                    <div className={`flex flex-wrap gap-3 justify-start pt-4 border-t ${unifiedChartData.legendBorder}`}>
                      {unifiedChartData.dataKeys.slice(0, activeTab === 'income' ? 6 : 8).map((key: string) => {
                        const icon = activeTab === 'income'
                          ? getIncomeIcon(key)
                          : getCategoryIcon(key);
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: activeTab === 'income' ? '#10b981' : (unifiedChartData.colors as { [key: string]: string })[key] || '#6b7280' }}
                            />
                            <div className="flex items-center gap-1">
                              {icon}
                              <span className="text-xs font-medium text-gray-700">{label}</span>
                            </div>
                          </div>
                        );
                      })}
                      {unifiedChartData.dataKeys.length > (activeTab === 'income' ? 6 : 8) && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full shadow-sm bg-gray-400" />
                          <span className="text-xs font-medium text-gray-700">+{unifiedChartData.dataKeys.length - (activeTab === 'income' ? 6 : 8)} {activeTab === 'income' ? 'altri' : 'altre'}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="income" className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`p-2 sm:p-3 bg-gradient-to-br ${unifiedChartData.iconBg} rounded-xl sm:rounded-2xl shadow-lg ${unifiedChartData.iconShadow}`}>
                          {unifiedChartData.icon}
                        </div>
                        <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">{unifiedChartData.title}</h3>
                      </div>
                      <div className="text-left sm:text-right space-y-1">
                        <p className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${unifiedChartData.gradientColors} bg-clip-text text-transparent`}>
                          {formatCurrency(unifiedChartData.total)}
                        </p>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Questo periodo</p>
                      </div>
                    </div>

                    {/* Unified Bar Chart */}
                    <div className="flex items-end justify-between gap-1 px-1 h-28 sm:h-36 bg-gray-50 rounded-xl" style={{ paddingTop: '8px' }}>
                      {unifiedChartData.data.map((dayData: { [key: string]: number | string }, index: number) => {
                        const { day, ...amounts } = dayData;
                        const total = Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                        const maxTotal = Math.max(...unifiedChartData.data.map((d: { [key: string]: number | string }) => {
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          const { day: _, ...amounts } = d;
                          return Object.values(amounts).reduce((sum: number, val) => sum + (val as number), 0);
                        }), 1);
                        const barHeight = maxTotal > 0 ? Math.max((total / maxTotal) * 70, 16) : 16;

                        return (
                          <div key={index} className="flex flex-col items-center flex-1 min-w-0">
                            <div className="w-full flex flex-col justify-end" style={{ height: '88px' }}>
                              <div
                                className="w-full flex flex-col rounded-t overflow-hidden shadow-sm min-h-[16px] bg-gray-100"
                                style={{ height: `${barHeight}px` }}
                              >
                                {total > 0 ? (
                                  unifiedChartData.dataKeys.map((key: string) => {
                                    const amount = amounts[key] as number || 0;
                                    if (amount === 0) return null;
                                    return (
                                      <div
                                        key={key}
                                        style={{
                                          height: `${(amount / total) * 100}%`,
                                          backgroundColor: (unifiedChartData.colors as { [key: string]: string })[key] || '#6b7280'
                                        }}
                                        title={`${key}: ${formatCurrency(amount)}`}
                                      />
                                    );
                                  })
                                ) : (
                                  <div
                                    className="w-full bg-gray-300 rounded-t"
                                    style={{ height: '16px' }}
                                    title={unifiedChartData.emptyMessage}
                                  />
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 mt-2">{day as string}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Unified Legend */}
                    <div className={`flex flex-wrap gap-3 justify-start pt-4 border-t ${unifiedChartData.legendBorder}`}>
                      {unifiedChartData.dataKeys.slice(0, activeTab === 'income' ? 6 : 8).map((key: string) => {
                        const icon = activeTab === 'income'
                          ? getIncomeIcon(key)
                          : getCategoryIcon(key);
                        const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                        return (
                          <div key={key} className="flex items-center gap-1.5">
                            <div
                              className="w-3 h-3 rounded-full shadow-sm"
                              style={{ backgroundColor: activeTab === 'income' ? '#10b981' : (unifiedChartData.colors as { [key: string]: string })[key] || '#6b7280' }}
                            />
                            <div className="flex items-center gap-1">
                              {icon}
                              <span className="text-xs font-medium text-gray-700">{label}</span>
                            </div>
                          </div>
                        );
                      })}
                      {unifiedChartData.dataKeys.length > (activeTab === 'income' ? 6 : 8) && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full shadow-sm bg-gray-400" />
                          <span className="text-xs font-medium text-gray-700">+{unifiedChartData.dataKeys.length - (activeTab === 'income' ? 6 : 8)} {activeTab === 'income' ? 'altri' : 'altre'}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                </Tabs>
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
                    return (
                      <Card key={transaction.id} className="px-4 sm:px-6 py-3 sm:py-4 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 border border-white/50 hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 rounded-xl sm:rounded-2xl group active:scale-[0.98] cursor-pointer">
                        <div className="flex items-center justify-between group-hover:transform group-hover:scale-[1.01] transition-transform duration-200">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex size-10 sm:size-12 items-center justify-center rounded-xl sm:rounded-2xl bg-slate-100 border border-slate-200 shadow-md shadow-slate-200/30 group-hover:shadow-lg transition-all duration-200 shrink-0">
                              <CategoryIcon
                                categoryKey={transaction.category}
                                size={iconSizes.sm}
                                                                className="text-slate-600"
                              />
                            </div>
                            <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-2">
                              <h4 className="font-bold text-sm sm:text-base text-slate-800 group-hover:text-slate-900 transition-colors truncate max-w-[140px] sm:max-w-[200px]">
                                {transaction.description.length > 18 ? `${transaction.description.substring(0, 18)}...` : transaction.description}
                              </h4>
                              <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">{new Date(transaction.date).toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-2">
                            <p className={`text-sm sm:text-xl font-bold whitespace-nowrap ${
                              transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
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
                      if (selectedBudget && selectedBudget.id) {
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
          </>
        )}
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