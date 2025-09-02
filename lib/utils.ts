import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { dummyTransactions } from "./dummy-data"
import { BudgetData, BudgetPeriodData, BudgetWithSpent, DailyExpenseData, ExpenseData, FilterState, IncomeData, InvestmentHolding, MemberData, Plan, PlanType, TransactionPageTransaction, TransactionWithAccount } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number): string => {
  try {
    if (isNaN(amount) || !isFinite(amount)) {
      return '€ 0,00';
    }
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `€ ${amount.toFixed(2).replace('.', ',')}`;
  }
}

export const formatPercentage = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }
  return `${Math.round(value * 10) / 10}%`;
}

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Data non valida';
    }
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'Data non valida';
  }
}

export const getPlanBadgeColor = (planType: PlanType): string => {
  const colors = {
    superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-blue-100 text-blue-800 border-blue-200',
    member: 'bg-green-100 text-green-800 border-green-200',
    free: 'bg-gray-100 text-gray-800 border-gray-200',
  }
  return colors[planType]
}

export const getPlanDescription = (plan: Plan): string => {
  return `${plan.features.join(' • ')}`
}

export const canManageGroup = (planType: PlanType): boolean => {
  return planType === 'superadmin' || planType === 'admin'
}

export const getMaxMembers = (plan: Plan): number => {
  return plan.maxMembers || 1
}

export const getMemberDataById = (membersData: MemberData[], memberId: string): MemberData | undefined => {
  if (memberId === 'all') {
    const individualMembers = membersData.filter(member => member.id !== 'all');
    
    if (individualMembers.length === 0) {
      return membersData.find(member => member.id === 'all');
    }

    const aggregatedAccounts = individualMembers.reduce((acc, member) => {
      acc.stipendio = (acc.stipendio || 0) + member.accounts.stipendio;
      acc.risparmio = (acc.risparmio || 0) + member.accounts.risparmio;
      acc.contanti = (acc.contanti || 0) + member.accounts.contanti;
      acc.investimenti = (acc.investimenti || 0) + member.accounts.investimenti;
      return acc;
    }, {
      stipendio: 0,
      risparmio: 0,
      contanti: 0,
      investimenti: 0
    });

    const budgetMap = new Map<string, { budget: number; spent: number; }>();
    individualMembers.forEach(member => {
      member.budgets.forEach(budget => {
        const existing = budgetMap.get(budget.category);
        if (existing) {
          existing.budget += budget.budget;
          existing.spent += budget.spent;
        } else {
          budgetMap.set(budget.category, { budget: budget.budget, spent: budget.spent });
        }
      });
    });

    const aggregatedBudgets = Array.from(budgetMap.entries()).map(([category, data]) => ({
      category,
      budget: data.budget,
      spent: data.spent,
      remaining: data.budget - data.spent,
      percentage: data.budget > 0 ? (data.spent / data.budget) * 100 : 0
    }));

    let transactionIdCounter = 1;
    const aggregatedTransactions = individualMembers.flatMap(member => 
      member.transactions.map(transaction => ({
        ...transaction,
        id: transactionIdCounter++
      }))
    );

    return {
      id: 'all',
      name: 'Tutti i Membri',
      avatar: '👥',
      color: '#6366f1',
      accounts: aggregatedAccounts,
      budgets: aggregatedBudgets,
      transactions: aggregatedTransactions
    };
  }
  
  return membersData.find(member => member.id === memberId);
}

export const getMemberBudgetsByCategory = (memberData: MemberData, category: string): BudgetData[] => {
  if (category === 'all') return memberData.budgets
  return memberData.budgets.filter(budget => budget.category.toLowerCase() === category.toLowerCase())
}

export const getMemberTransactionsByCategory = (memberData: MemberData, category: string): TransactionPageTransaction[] => {
  if (category === 'all') return memberData.transactions
  return memberData.transactions.filter(transaction =>
    transaction.category.toLowerCase() === category.toLowerCase()
  )
}

export const filterTransactions = (transactions: TransactionPageTransaction[], filters: FilterState): TransactionPageTransaction[] => {
  return transactions.filter(transaction => {
    if (filters.category && filters.category !== 'all') {
      const normalizeCategory = (cat: string) => cat.toLowerCase().trim();
      if (normalizeCategory(transaction.category) !== normalizeCategory(filters.category)) {
        return false;
      }
    }

    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }

    const minAmount = filters.minAmount ? parseFloat(filters.minAmount) : null;
    const maxAmount = filters.maxAmount ? parseFloat(filters.maxAmount) : null;

    if (minAmount !== null && !isNaN(minAmount) && transaction.amount < minAmount) {
      return false;
    }

    if (maxAmount !== null && !isNaN(maxAmount) && transaction.amount > maxAmount) {
      return false;
    }

    if (filters.dateRange && filters.dateRange !== 'all') {
      const transactionDate = new Date(transaction.date);
      const now = new Date();

      transactionDate.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);

      switch (filters.dateRange) {
        case 'today':
          return transactionDate.getTime() === now.getTime();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return transactionDate >= weekAgo && transactionDate <= now;
        case 'month':
          return transactionDate.getMonth() === now.getMonth() &&
            transactionDate.getFullYear() === now.getFullYear();
        case 'year':
          return transactionDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    }

    return true;
  });
}

export const calculateBudgetProgress = (budget: number, spent: number): { remaining: number, percentage: number } => {
  const remaining = budget - spent
  const percentage = budget > 0 ? (spent / budget) * 100 : 0
  return { remaining, percentage }
}

export const getBudgetStatusColor = (percentage: number): string => {
  if (percentage >= 100) return 'text-red-600'
  if (percentage >= 80) return 'text-yellow-600'
  return 'text-green-600'
}

export const getBudgetProgressColor = (percentage: number): string => {
  if (percentage >= 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-yellow-500'
  return 'bg-green-500'
}

export const getExpenseChartData = (memberData: MemberData, selectedBudget: string = 'all') => {
  const budgets = selectedBudget === 'all'
    ? memberData.budgets
    : memberData.budgets.filter(b => b.category.toLowerCase() === selectedBudget.toLowerCase())

  return budgets
    .filter(budget => budget.spent > 0)
    .map(budget => ({
      name: budget.category,
      value: Math.round(budget.spent * 100) / 100,
      fill: getCategoryColor(budget.category)
    }))
    .sort((a, b) => b.value - a.value)
}

export const getIncomeExpenseChartData = (memberData: MemberData) => {
  const income = memberData.transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = memberData.transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return [
    { name: 'Entrate', value: Math.round(income * 100) / 100, fill: '#10b981' },
    { name: 'Spese', value: Math.round(expenses * 100) / 100, fill: '#ef4444' }
  ]
}

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    'alimentari': '#10b981',
    'intrattenimento': '#f59e0b',
    'shopping': '#3b82f6',
    'trasporti': '#8b5cf6',
    'bollette': '#ef4444',
    'salute': '#06b6d4',
    'educazione': '#84cc16',
    'casa & giardino': '#f97316',
    'viaggi': '#06b6d4',
    'stipendio': '#10b981',
    'groceries': '#10b981',
    'entertainment': '#f59e0b',
    'transportation': '#8b5cf6',
    'utilities': '#ef4444',
    'health': '#06b6d4',
    'education': '#84cc16',
    'housing': '#f97316',
    'salary': '#10b981',
    'freelance': '#06b6d4',
  }
  return colors[category.toLowerCase()] || '#6b7280'
}

export const createFilterUrl = (filters: Partial<FilterState>, basePath: string = ''): string => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all' && value !== '' && value !== '0') {
      params.set(key, encodeURIComponent(value));
    }
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export const parseFiltersFromUrl = (searchParams: URLSearchParams): FilterState => {
  const parseAmount = (value: string | null): string => {
    if (!value) return '';
    const parsed = parseFloat(value);
    return isNaN(parsed) || parsed < 0 ? '' : value;
  };

  return {
    member: searchParams.get('member') || 'all',
    budget: searchParams.get('budget') || 'all',
    category: decodeURIComponent(searchParams.get('category') || 'all'),
    dateRange: searchParams.get('dateRange') || 'all',
    type: searchParams.get('type') || 'all',
    minAmount: parseAmount(searchParams.get('minAmount')),
    maxAmount: parseAmount(searchParams.get('maxAmount')),
  };
}

export const getCurrentBudgetData = (budgets: { id: string | number; name: string; amount: number; spent: number; icon?: string }[], selectedBudget: string) => {
  if (selectedBudget === "all") {
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    return {
      name: "Tutti i Budget",
      amount: Math.round(totalBudgetAmount * 100) / 100,
      spent: Math.round(totalSpent * 100) / 100,
      available: Math.round((totalBudgetAmount - totalSpent) * 100) / 100,
      icon: "💰"
    };
  }

  const budget = budgets.find(b => b.id?.toString() === selectedBudget);
  if (budget) {
    return {
      name: budget.name,
      amount: Math.round(budget.amount * 100) / 100,
      spent: Math.round(budget.spent * 100) / 100,
      available: Math.round((budget.amount - budget.spent) * 100) / 100,
      icon: budget.icon || "💰"
    };
  }

  return { name: "Nessun Budget", amount: 0, spent: 0, available: 0, icon: "💰" };
}

export const convertMemberDataToBankAccounts = (memberData: MemberData | undefined) => {
  if (!memberData?.accounts) return [];

  const accounts = [
    {
      id: "1",
      name: "Conto Stipendio",
      type: "Conto Corrente",
      owner: memberData.name,
      balance: memberData.accounts.stipendio || 0,
      icon: "Building2",
      color: "bg-blue-500"
    },
    {
      id: "2",
      name: "Conto Risparmio",
      type: "Conto Risparmio",
      owner: memberData.name,
      balance: memberData.accounts.risparmio || 0,
      icon: "PiggyBank",
      color: "bg-green-500"
    },
    {
      id: "3",
      name: "Conto Contanti",
      type: "Conto Corrente",
      owner: memberData.name,
      balance: memberData.accounts.contanti || 0,
      icon: "CreditCard",
      color: memberData.accounts.contanti < 0 ? "bg-red-500" : "bg-yellow-500"
    },
    {
      id: "4",
      name: "Portafoglio Investimenti",
      type: "Conto Investimenti",
      owner: memberData.name,
      balance: memberData.accounts.investimenti || 0,
      icon: "TrendingUp",
      color: "bg-purple-500"
    }
  ];

  return accounts.filter(account => account.balance !== 0);
}

export const convertMemberDataToBudgets = (memberData: MemberData | undefined, selectedGroupFilter: string = 'all') => {
  if (!memberData?.budgets) return [];

  return memberData.budgets.map((budget, index) => {
    const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;

    return {
      id: `${selectedGroupFilter}-${index}`,
      name: budget.category,
      amount: budget.budget,
      spent: budget.spent,
      color: getBudgetProgressColor(percentage),
      icon: getBudgetIcon(budget.category)
    };
  });
};

export const generateChartData = (memberData: MemberData | undefined, selectedBudget: string = 'all') => {
  if (!memberData) {
    return {
      expense: [65.25, 45.80, 52.15, 78.90, 89.45, 125.20, 95.65],
      income: [0, 0, 0, 0, 2375.00, 0, 0],
      dailyExpenses: [
        { day: "Lun", alimentari: 35.40, intrattenimento: 12.75, shopping: 8.20 },
        { day: "Mar", alimentari: 25.15, intrattenimento: 18.30, shopping: 15.85 },
        { day: "Mer", alimentari: 28.90, intrattenimento: 15.45, shopping: 12.60 },
        { day: "Gio", alimentari: 40.20, intrattenimento: 22.80, shopping: 18.45 },
        { day: "Ven", alimentari: 32.75, intrattenimento: 38.90, shopping: 25.35 },
        { day: "Sab", alimentari: 55.30, intrattenimento: 65.80, shopping: 42.75 },
        { day: "Dom", alimentari: 45.60, intrattenimento: 28.25, shopping: 22.90 }
      ]
    };
  }

  const expenseTransactions = memberData.transactions.filter(t => t.type === 'expense');
  const incomeTransactions = memberData.transactions.filter(t => t.type === 'income');

  const filteredTransactions = selectedBudget === 'all' ? expenseTransactions :
    expenseTransactions.filter(t => {
      const budget = memberData.budgets.find(b => b.category.toLowerCase().includes(t.category.toLowerCase()));
      return budget !== undefined;
    });

  const weeklyExpenses = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayTransactions = filteredTransactions.filter((_, index) => index % 7 === dayIndex);
    const dayTotal = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return Math.round((dayTotal || 20 + Math.random() * 30) * 100) / 100;
  });

  const weeklyIncome = Array.from({ length: 7 }, (_, dayIndex) => {
    if (dayIndex === 4 && incomeTransactions.length > 0) {
      return Math.round(incomeTransactions[0].amount * 100) / 100;
    }
    return 0;
  });

  const dailyExpensesByCategory = [
    { day: "Lun", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Mar", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Mer", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Gio", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Ven", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Sab", alimentari: 0, intrattenimento: 0, shopping: 0 },
    { day: "Dom", alimentari: 0, intrattenimento: 0, shopping: 0 }
  ];

  filteredTransactions.forEach((transaction, index) => {
    const dayIndex = index % 7;
    const dayData = dailyExpensesByCategory[dayIndex];

    if (transaction.category.toLowerCase().includes('alimentari')) {
      dayData.alimentari += transaction.amount;
    } else if (transaction.category.toLowerCase().includes('intrattenimento')) {
      dayData.intrattenimento += transaction.amount;
    } else if (transaction.category.toLowerCase().includes('shopping')) {
      dayData.shopping += transaction.amount;
    }
  });

  dailyExpensesByCategory.forEach(day => {
    day.alimentari = Math.round(day.alimentari * 100) / 100;
    day.intrattenimento = Math.round(day.intrattenimento * 100) / 100;
    day.shopping = Math.round(day.shopping * 100) / 100;
  });

  return {
    expense: weeklyExpenses,
    income: weeklyIncome,
    dailyExpenses: dailyExpensesByCategory
  };
}

export const applySearchFilter = (searchQuery: string, transactions: TransactionPageTransaction[]) => {
  if (!searchQuery?.trim()) return transactions;

  const query = searchQuery.toLowerCase().trim();
  return transactions.filter(transaction => {
    const searchableFields = [
      transaction.title,
      transaction.description,
      transaction.category,
      transaction.account
    ].filter(Boolean).map(field => field!.toLowerCase());

    return searchableFields.some(field => field.includes(query));
  });
};

export const getTotalForSection = (transactions: TransactionPageTransaction[]) => {
  const total = transactions.reduce((sum, tx) => {
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
  }, 0);
  return Math.round(total * 100) / 100;
};

export const calculateNetBalance = (transactions: TransactionPageTransaction[]) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    net: Math.round((income - expenses) * 100) / 100
  };
};

export const getTransactionTypeLabel = (type: 'income' | 'expense'): string => {
  return type === 'income' ? 'Entrata' : 'Spesa';
};

export const formatTransactionDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
};

export const getBudgetPeriod = (budget: BudgetWithSpent): BudgetPeriodData => {
  const now = new Date();
  let start_date: Date;
  let end_date: Date;

  if (budget.period === 'monthly') {
    // Monthly budget: from 1st of current month to last day of current month
    start_date = new Date(now.getFullYear(), now.getMonth(), 1);
    end_date = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    // Annually budget: from Jan 1st to Dec 31st of current year
    start_date = new Date(now.getFullYear(), 0, 1);
    end_date = new Date(now.getFullYear(), 11, 31);
  }

  return {
    start_date: start_date.toISOString().split('T')[0],
    end_date: end_date.toISOString().split('T')[0],
    is_current: true
  };
};

export const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
  
  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'Oggi';
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return 'Ieri';
  } else {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  }
};

export const getRandomDate = (start: Date, end: Date): string => {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString();
};

export const getRandomAmount = (min: number, max: number): number => {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
};

export const createTransaction = (
  id: string,
  description: string,
  amount: number,
  type: 'spesa' | 'entrata',
  category: string,
  accountId: string,
  daysAgo: number = 1
): TransactionWithAccount => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().slice(0, 10);
  const createdAt = getRandomDate(new Date(date.getTime() - 3600000), date);

  return {
    id,
    description,
    amount: Math.round(amount * 100) / 100,
    type,
    category,
    date: dateStr,
    account_id: accountId,
    to_account_id: null,
    is_reconciled: Math.random() > 0.1,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: createdAt,
    updated_at: createdAt
  };
};

export const createInvestment = (
  id: string,
  personId: string,
  name: string,
  symbol: string,
  quantity: number,
  purchasePrice: number,
  currentPrice: number,
  purchaseDate: string
): InvestmentHolding => ({
  id,
  person_id: personId,
  name,
  symbol,
  quantity,
  purchase_price: Math.round(purchasePrice * 100) / 100,
  current_price: Math.round(currentPrice * 100) / 100,
  purchase_date: purchaseDate,
  group_id: 'group_1',
  created_at: getRandomDate(new Date(purchaseDate), new Date()),
  updated_at: getRandomDate(new Date(), new Date())
});

export const totalInvestmentValue = (investmentHoldings: InvestmentHolding[]) => {
  return investmentHoldings.reduce((total, inv) => {
    return total + (inv.quantity * inv.current_price);
  }, 0);
};

export const calculateBudgetSpent = (transactions: TransactionWithAccount[], categories: string[]): number => {
  return transactions
    .filter(t => t.type === 'spesa' && categories.includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);
};

export const createBudget = (
  id: string,
  description: string,
  amount: number,
  period: 'monthly' | 'annually',
  categories: string[],
  personId: string
): BudgetWithSpent => {
  const spent = Math.round(calculateBudgetSpent(dummyTransactions, categories) * 100) / 100;
  const remaining = Math.round((amount - spent) * 100) / 100;
  const percentage = Math.round((spent / amount) * 10000) / 100;

  return {
    id,
    description,
    amount,
    period,
    categories,
    person_id: personId,
    spent_amount: spent,
    remaining_amount: remaining,
    percentage_used: percentage,
    created_at: getRandomDate(new Date('2024-01-01'), new Date('2024-02-01')),
    updated_at: getRandomDate(new Date(), new Date())
  };
};

export const getCategoryStats = (category: string) => {
  const transactions = dummyTransactions.filter(t => t.category === category && t.type === 'spesa');
  return {
    name: category,
    transactions: transactions.length,
    amount: Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100
  };
};

export const getBudgetIcon = (description: string): string => {
  if (description.includes('Alimentari') || description.includes('Quotidiane')) return '🛒';
  if (description.includes('Intrattenimento')) return '🎬';
  if (description.includes('Salute')) return '🏥';
  if (description.includes('Casa') || description.includes('Bollette')) return '🏠';
  if (description.includes('Educazione')) return '📚';
  if (description.includes('Viaggi')) return '✈️';
  if (description.includes('Risparmio')) return '💰';
  return '📊';
};

export const getBudgetColor = (percentage: number): string => {
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 75) return 'bg-yellow-500';
  if (percentage < 90) return 'bg-orange-500';
  return 'bg-red-500';
};

export const generateWeeklyExpenses = (): number[] => {
  const baseExpenses = [65, 45, 52, 78, 89, 125, 95];
  return baseExpenses.map(base => Math.round((base + (Math.random() - 0.5) * 20) * 100) / 100);
};

export const generateWeeklyIncome = (): number[] => {
  const baseIncome = [0, 0, 0, 0, 2375, 0, 0];
  return baseIncome.map(base => Math.round((base + (Math.random() - 0.5) * 20) * 100) / 100);
};

export const generateDailyExpenses = (): DailyExpenseData[] => {
  const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  const basePatterns = {
    alimentari: [35, 25, 28, 40, 32, 55, 45],
    intrattenimento: [12, 18, 15, 22, 38, 65, 28],
    shopping: [8, 15, 12, 18, 25, 42, 22]
  };

  return days.map((day, index) => ({
    day,
    alimentari: Math.round((basePatterns.alimentari[index] + (Math.random() - 0.5) * 10) * 100) / 100,
    intrattenimento: Math.round((basePatterns.intrattenimento[index] + (Math.random() - 0.5) * 8) * 100) / 100,
    shopping: Math.round((basePatterns.shopping[index] + (Math.random() - 0.5) * 6) * 100) / 100
  }));
};

export const generateExpenseData = (categoryColors: Record<string, string>): ExpenseData[] => {
  const categoryTotals = dummyTransactions
    .filter(t => t.type === 'spesa')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount: Math.round(amount * 100) / 100,
      color: categoryColors[category] || '#6b7280'
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const generateIncomeData = (): IncomeData[] => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const baseIncome = 4750;
  const variations = [0.85, 0.90, 0.95, 1.0, 0.92, 1.05, 0.88, 0.85, 1.10, 1.15, 1.20, 1.25];

  return months.slice(0, 6).map((month, index) => ({
    month,
    amount: Math.round(baseIncome * variations[index] + (Math.random() - 0.5) * 300)
  }));
};

export const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    'Alimentari': '🍽️',
    'Trasporti': '🚗',
    'Intrattenimento': '🎬',
    'Shopping': '🛍️',
    'Salute': '💊',
    'Bollette': '⚡',
    'Casa': '🏠',
    'Risparmio': '💰',
  };
  return icons[category] || '📄';
};

export const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return 'bg-finance-negative';
  if (percentage >= 80) return 'bg-finance-warning';
  if (percentage >= 60) return 'bg-deep-ocean-blue';
  return 'bg-finance-positive';
};

export const getStatusColor = (percentage: number) => {
  if (percentage >= 100) return 'text-finance-negative bg-finance-negative-subtle';
  if (percentage >= 80) return 'text-finance-warning bg-finance-warning-subtle';
  return 'text-finance-positive bg-finance-positive-subtle';
};