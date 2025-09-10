import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  accountService,
  budgetService,
  transactionService,
  userService
} from "./api";
import {
  Account,
  Budget,
  FilterState,
  Transaction,
  User
} from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helpers
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
    return `€ ${(amount || 0).toFixed(2).replace('.', ',')}`;
  }
}

export const formatPercentage = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return '0.00%';
  }
  return `${(Math.round(value * 100) / 100).toFixed(2)}%`;
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

const convertToMondayIndex = (jsDay: number): number => jsDay === 0 ? 6 : jsDay - 1;

export const isAdmin = (user: User): boolean => {
  return user.role !== 'member';
};

export const getTransactionsByType = async (userId: string, type: 'expense' | 'income'): Promise<Transaction[]> => {
  const transactions = await transactionService.getByUserId(userId);
  return transactions.filter(tx => tx.type === type);
};

export const getExpenseTransactions = (user: User) => getTransactionsByType(user.id, 'expense');
export const getIncomeTransactions = (user: User) => getTransactionsByType(user.id, 'income');

const getBudgetSpent = async (budget: Budget): Promise<number> => {
  const transactions = await transactionService.getByUserId(budget.user_id);
  const spent = transactions
    .filter(tx => tx.type === 'expense' && budget.categories.includes(tx.category))
    .reduce((total, tx) => total + tx.amount, 0);
  return Math.round(spent * 100) / 100;
};

export const getBalanceSpent = getBudgetSpent;

export const getBudgetBalance = async (budget: Budget): Promise<number> => {
  const spent = await getBudgetSpent(budget);
  return Math.round((budget.amount - spent) * 100) / 100;
};

export const getBudgetProgress = async (budget: Budget): Promise<number> => {
  const spent = await getBudgetSpent(budget);
  const progress = Math.min(Math.max((spent / budget.amount) * 100, 0), 100);
  return Math.round(progress * 100) / 100;
};

export const getUserBudgets = (user: User) => budgetService.getByUserId(user.id);
export const getUserTransactions = (user: User) => transactionService.getByUserId(user.id);

export const getDynamicChartData = async (budget: Budget) => {
  try {
    const user = await userService.getById(budget.user_id);
    if (!user) return {
      expense: [0],
      income: [0],
      dailyExpenses: [],
      dailyIncome: [],
      categories: [],
      incomeTypes: []
    };

    const [expenses, income] = await Promise.all([
      getExpenseTransactions(user),
      getIncomeTransactions(user)
    ]);

    const budgetExpenses = expenses.filter(tx => budget.categories.includes(tx.category));
    const totalExpense = budgetExpenses.reduce((total, tx) => total + tx.amount, 0);
    const totalIncome = income.reduce((total, tx) => total + tx.amount, 0);

    const dayNames = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const allCategories = Array.from(new Set(budgetExpenses.map(tx => tx.category)));
    const allIncomeTypes = Array.from(new Set(income.map(tx => tx.category)));

    const dailyExpenseData: { [day: string]: { [category: string]: number } } = {};
    dayNames.forEach(day => {
      dailyExpenseData[day] = {};
      allCategories.forEach(category => {
        dailyExpenseData[day][category] = 0;
      });
    });

    budgetExpenses.forEach(transaction => {
      const dayIndex = convertToMondayIndex(transaction.date.getDay());
      const dayName = dayNames[dayIndex];

      if (dayName && dailyExpenseData[dayName] && transaction.category) {
        dailyExpenseData[dayName][transaction.category] += transaction.amount;
      }
    });

    // Daily income data
    const dailyIncomeData: { [day: string]: { [type: string]: number } } = {};
    dayNames.forEach(day => {
      dailyIncomeData[day] = {};
      allIncomeTypes.forEach(type => {
        dailyIncomeData[day][type] = 0;
      });
    });

    income.forEach(transaction => {
      const dayIndex = convertToMondayIndex(transaction.date.getDay());
      const dayName = dayNames[dayIndex];

      if (dayName && dailyIncomeData[dayName] && transaction.category) {
        dailyIncomeData[dayName][transaction.category] += transaction.amount;
      }
    });

    const dailyExpenses = dayNames.map(day => {
      const dayData: { [key: string]: number | string } = { day };
      allCategories.forEach(category => {
        const amount = dailyExpenseData[day][category];
        dayData[category] = Math.round(amount * 100) / 100;
      });
      return dayData;
    });

    const dailyIncome = dayNames.map(day => {
      const dayData: { [key: string]: number | string } = { day };
      allIncomeTypes.forEach(type => {
        const amount = dailyIncomeData[day][type];
        dayData[type] = Math.round(amount * 100) / 100;
      });
      return dayData;
    });

    return {
      expense: [totalExpense],
      income: [totalIncome],
      dailyExpenses,
      dailyIncome,
      categories: allCategories,
      incomeTypes: allIncomeTypes
    };
  } catch (error) {
    console.error('Error fetching chart data:', error);
    return {
      expense: [0],
      income: [0],
      dailyExpenses: [],
      dailyIncome: [],
      categories: [],
      incomeTypes: []
    };
  }
};

const calculateBalance = (transactions: Transaction[]): number => {
  const balance = transactions.reduce((total, tx) => 
    tx.type === 'income' ? total + tx.amount : total - tx.amount, 0
  );
  return Math.round(balance * 100) / 100;
};

export const getUserAccountBalance = async (userId: string): Promise<number> => {
  try {
    const transactions = await transactionService.getByUserId(userId);
    return calculateBalance(transactions);
  } catch {
    return 0;
  }
};

export const getAllAccountsBalance = async (): Promise<number> => {
  try {
    const users = await userService.getAll();
    const balances = await Promise.all(users.map(user => getUserAccountBalance(user.id)));
    return Math.round(balances.reduce((total, balance) => total + balance, 0) * 100) / 100;
  } catch {
    return 0;
  }
};

export const getAccountBalance = async (accountId: string): Promise<number> => {
  try {
    const transactions = await transactionService.getByAccountId(accountId);
    return calculateBalance(transactions);
  } catch {
    return 0;
  }
};

export const getFilteredAccounts = async (userId?: string): Promise<Account[]> => {
  try {
    if (!userId || userId === 'all') return accountService.getAll();
    return accountService.getByUserId(userId);
  } catch {
    return [];
  }
};

export const getFilteredBudgets = async (userId?: string): Promise<Budget[]> => {
  try {
    return userId && userId !== 'all' ? budgetService.getByUserId(userId) : budgetService.getAll();
  } catch {
    return [];
  }
};

export const getRecurringTransactions = async (userId?: string): Promise<Transaction[]> => {
  try {
    const allTransactions = await transactionService.getAll();
    const recurring = allTransactions.filter(tx => 
      tx.frequency && tx.frequency !== 'once' && 
      ['weekly', 'biweekly', 'monthly', 'yearly'].includes(tx.frequency)
    );
    
    const filtered = userId && userId !== 'all' 
      ? recurring.filter(tx => tx.user_id === userId) 
      : recurring;
    
    return filtered.slice(0, 5);
  } catch {
    return [];
  }
};

export const getAccountsWithBalance = getFilteredAccounts;

export const parseFiltersFromUrl = (searchParams: URLSearchParams): FilterState => {
  return {
    member: searchParams.get('member') || 'all',
    budget: searchParams.get('budget') || '',
    category: searchParams.get('category') || '',
    dateRange: searchParams.get('dateRange') || '',
    type: searchParams.get('type') || '',
    minAmount: searchParams.get('minAmount') || '',
    maxAmount: searchParams.get('maxAmount') || ''
  };
};

export const filterTransactions = (transactions: Transaction[], filters: FilterState): Transaction[] => {
  return transactions.filter(transaction => {
    // Filter by category
    if (filters.category && filters.category !== 'all' && transaction.category !== filters.category) {
      return false;
    }

    // Filter by type
    if (filters.type && filters.type !== 'all' && transaction.type !== filters.type) {
      return false;
    }

    // Filter by amount range
    if (filters.minAmount && transaction.amount < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && transaction.amount > parseFloat(filters.maxAmount)) {
      return false;
    }

    return true;
  });
};

export const applySearchFilter = (searchQuery: string, transactions: Transaction[]): Transaction[] => {
  if (!searchQuery.trim()) {
    return transactions;
  }
  
  const query = searchQuery.toLowerCase().trim();
  return transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(query) ||
    transaction.category.toLowerCase().includes(query) ||
    transaction.amount.toString().includes(query)
  );
};

export const getTotalForSection = calculateBalance;

export const formatDateLabel = (date: string): string => {
  try {
    const transactionDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (transactionDate.toDateString() === today.toDateString()) {
      return 'Oggi';
    } else if (transactionDate.toDateString() === yesterday.toDateString()) {
      return 'Ieri';
    } else {
      return formatDate(date);
    }
  } catch {
    return formatDate(date);
  }
};

export const formatDueDate = (dueDate: Date): string => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return 'Oggi';
    } else if (daysDiff === 1) {
      return 'Domani';
    } else if (daysDiff < 7) {
      return `Tra ${daysDiff} giorni`;
    } else {
      return formatDate(dueDate.toISOString().split('T')[0]);
    }
  } catch {
    return 'Data non valida';
  }
};

// Calculate the next due date for a recurrent transaction
export const calculateNextDueDate = (transactionDate: Date, frequency: string): Date => {
  const baseDate = new Date(transactionDate);
  const today = new Date();
  
  // Start from the transaction date and find the next occurrence
  const nextDate = new Date(baseDate);
  
  while (nextDate <= today) {
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'biweekly':
        nextDate.setDate(nextDate.getDate() + 14);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        // For 'once' or unknown frequencies, return the original date
        return baseDate;
    }
  }
  
  return nextDate;
};

// Italian pluralization helper
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
};

export const getDaysUntilDue = (dueDate: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export const groupUpcomingTransactionsByDaysRemaining = (transactions: Transaction[]): Record<string, Transaction[]> => {
  const grouped: Record<string, Transaction[]> = {};
  
  transactions
    .filter(tx => tx.frequency && tx.frequency !== 'once')
    .forEach(transaction => {
      if (!transaction.frequency || transaction.frequency === 'once') return;
      
      const nextDueDate = calculateNextDueDate(transaction.date, transaction.frequency);
      const daysUntil = getDaysUntilDue(nextDueDate);
      
      // Only include transactions due within the next 7 days
      if (daysUntil > 7) return;
      
      let groupKey: string = '';
      let sortOrder: number = 999;
      
      if (daysUntil === 0) {
        groupKey = 'Oggi';
        sortOrder = 0;
      } else if (daysUntil === 1) {
        groupKey = 'Domani';
        sortOrder = 1;
      } else if (daysUntil <= 3) {
        groupKey = 'Prossimi 3 giorni';
        sortOrder = 2;
      } else if (daysUntil <= 7) {
        groupKey = 'Questa settimana';
        sortOrder = 3;
      }
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push({ ...transaction, _sortOrder: sortOrder } as Transaction & { _sortOrder: number });
    });
  
  // Sort each group by due date (earliest first)
  Object.keys(grouped).forEach(key => {
    grouped[key].sort((a, b) => {
      if (!a.frequency || !b.frequency || a.frequency === 'once' || b.frequency === 'once') return 0;
      const aDueDate = calculateNextDueDate(a.date, a.frequency);
      const bDueDate = calculateNextDueDate(b.date, b.frequency);
      return aDueDate.getTime() - bDueDate.getTime();
    });
  });
  
  // Convert to ordered object with groups sorted by urgency
  const orderedGroupKeys = Object.keys(grouped).sort((a, b) => {
    const aTransaction = grouped[a][0] as Transaction & { _sortOrder: number };
    const bTransaction = grouped[b][0] as Transaction & { _sortOrder: number };
    return aTransaction._sortOrder - bTransaction._sortOrder;
  });
  
  const orderedGrouped: Record<string, Transaction[]> = {};
  orderedGroupKeys.forEach(key => {
    orderedGrouped[key] = grouped[key].map(tx => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _sortOrder, ...cleanTx } = tx as Transaction & { _sortOrder: number };
      return cleanTx;
    });
  });
  
  return orderedGrouped;
};

// Category labels mapping
export const categoryLabels: Record<string, string> = {
  'parrucchiere': 'Parrucchiere',
  'trasferimento': 'Trasferimento',
  'altro': 'Altro',
  'bonifico': 'Bonifico',
  'abbonamenti_tv': 'Abbonamenti TV',
  'veterinario': 'Veterinario',
  'bollo_auto': 'Bollo Auto',
  'contanti': 'Contanti',
  'cibo_fuori': 'Ristoranti',
  'investimenti': 'Investimenti',
  'yuup_thor': 'Yuup',
  'palestra': 'Palestra',
  'spesa': 'Spesa',
  'bolletta_acqua': 'Bolletta Acqua',
  'medicine_thor': 'Medicine',
  'bolletta_tari': 'Bolletta TARI',
  'medicine': 'Medicine',
  'ricarica_telefono': 'Ricarica Telefono',
  'regali': 'Regali',
  'bolletta_tim': 'Bolletta TIM',
  'estetista': 'Estetista',
  'tagliando_auto': 'Tagliando Auto',
  'stipendio': 'Stipendio',
  'vestiti': 'Vestiti',
  'visite_mediche': 'Visite Mediche',
  'risparmi': 'Risparmi',
  'skincare': 'Skincare',
  'haircare': 'Haircare',
  'taglio_thor': 'Taglio',
  'cibo_thor': 'Cibo',
  'eventi': 'Eventi',
  'rata_auto': 'Rata Auto',
  'bolletta_gas': 'Bolletta Gas',
  'bolletta_depuratore': 'Bolletta Depuratore',
  'analisi_mediche': 'Analisi Mediche',
  'bolletta_luce': 'Bolletta Luce',
  'abbonamenti_necessari': 'Abbonamenti',
  'cibo_asporto': 'Cibo Asporto',
  'benzina': 'Benzina',
  'assicurazione': 'Assicurazione'
};

export const getCategoryLabel = (categoryKey: string): string => {
  return categoryLabels[categoryKey] || categoryKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const getAccountName = async (accountId: string): Promise<string> => {
  try {
    const account = await accountService.getById(accountId);
    return account?.name || accountId;
  } catch {
    return accountId;
  }
};

export const truncateText = (text: string, maxLength = 20): string => 
  text.length <= maxLength ? text : `${text.substring(0, maxLength)}...`;

export const formatFrequency = (frequency?: string): string => {
  if (!frequency) return 'Una volta';

  const frequencyMap: { [key: string]: string } = {
    'once': 'Una volta',
    'weekly': 'Settimanale',
    'biweekly': 'Bisettimanale',
    'monthly': 'Mensile',
    'yearly': 'Annuale'
  };

  return frequencyMap[frequency] || frequency;
};
