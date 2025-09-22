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
  TransactionFrequencyType,
  TransactionType,
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

// Transaction type checking utilities
const isTransferLike = (tx: Transaction): boolean => {
  return tx.type === 'transfer' || tx.category === 'trasferimento' || !!tx.to_account_id;
};

const isValidTransaction = (tx: Transaction): boolean => {
  return tx.amount !== null && tx.account_id !== "" && !isNaN(new Date(tx.date).getTime());
};

const isWithinDateRange = (txDate: Date, startDate: Date, endDate?: Date): boolean => {
  const end = endDate || new Date();
  return txDate >= startDate && txDate <= end;
};

/**
 * Calculate budget spending for the active budget period
 */
const getBudgetSpent = async (budget: Budget): Promise<number> => {
  const transactions = await transactionService.getByUserId(budget.user_id);
  const users = await userService.getAll();
  const user = users.find(u => u.id === budget.user_id);

  if (!user) return 0;

  const { start, end } = getActivePeriodDates(user);
  return calculateBudgetSpent(transactions, budget, start || undefined, end || undefined);
};

export const getBalanceSpent = getBudgetSpent;

/**
 * Calculate remaining budget balance for the active period
 */
export const getBudgetBalance = async (budget: Budget): Promise<number> => {
  const spent = await getBudgetSpent(budget);
  return Math.round((budget.amount - spent) * 100) / 100;
};

/**
 * Calculate budget progress percentage for the active period (can exceed 100%)
 */
export const getBudgetProgress = async (budget: Budget): Promise<number> => {
  const spent = await getBudgetSpent(budget);
  const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
  return Math.round(progress * 100) / 100;
};

/**
 * Get budget spending breakdown by category for the active period
 */
export const getBudgetCategorySpending = async (budget: Budget): Promise<Record<string, number>> => {
  const transactions = await transactionService.getByUserId(budget.user_id);
  const users = await userService.getAll();
  const user = users.find(u => u.id === budget.user_id);

  if (!user) return {};

  const { start, end } = getActivePeriodDates(user);
  const relevantTransactions = getBudgetTransactions(transactions, budget, start || undefined, end || undefined);

  // Calculate spending by category
  const categorySpending: Record<string, number> = {};
  budget.categories.forEach(category => {
    const categoryTotal = relevantTransactions
      .filter(tx => tx.category === category)
      .reduce((sum, tx) => {
        if (tx.type === 'expense') return sum + tx.amount;
        if (tx.type === 'income') return sum - tx.amount;
        return sum;
      }, 0);
    if (categoryTotal !== 0) {
      categorySpending[category] = Math.round(categoryTotal * 100) / 100;
    }
  });

  return categorySpending;
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
      const dayIndex = convertToMondayIndex(new Date(transaction.date).getDay());
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
      const dayIndex = convertToMondayIndex(new Date(transaction.date).getDay());
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

// Centralized transaction calculation utilities
const calculateBalance = (transactions: Transaction[]): number => {
  // User-level balance: income - expense; ignore transfers (net zero across accounts)
  const balance = transactions.reduce((total, tx) => {
    if (tx.type === 'income') return total + tx.amount;
    if (tx.type === 'expense') return total - tx.amount;
    // transfer ignored at user level
    return total;
  }, 0);
  return Math.round(balance * 100) / 100;
};

// Centralized account balance calculation with transfer handling
export const calculateAccountBalance = (accountId: string, transactions: Transaction[]): number => {
  const related = transactions.filter(t =>
    (t.account_id === accountId || t.to_account_id === accountId) &&
    isValidTransaction(t)
  );

  const balance = related.reduce((sum, t) => {
    // Handle transfer transactions with proper double-entry logic
    if (t.to_account_id && t.type === 'transfer') {
      if (t.account_id === accountId) return sum - t.amount; // outflow from source account
      if (t.to_account_id === accountId) return sum + t.amount; // inflow to destination account
      return sum;
    }

    // Handle regular income/expense transactions
    if (t.account_id === accountId) {
      if (t.type === 'income') return sum + t.amount;
      if (t.type === 'expense') return sum - t.amount;
    }

    return sum;
  }, 0);

  return Math.round(balance * 100) / 100;
};

// Centralized budget transaction filtering
export const getBudgetTransactions = (
  transactions: Transaction[],
  budget: Budget,
  periodStart?: Date,
  periodEnd?: Date
): Transaction[] => {
  return transactions.filter(tx => {
    // Basic filtering
    if (!isValidTransaction(tx) || isTransferLike(tx)) return false;
    if (tx.user_id !== budget.user_id) return false;
    if (!budget.categories.includes(tx.category)) return false;
    if (tx.type !== 'expense' && tx.type !== 'income') return false;

    // Date filtering if period is specified
    if (periodStart) {
      const txDate = new Date(tx.date);
      return isWithinDateRange(txDate, periodStart, periodEnd);
    }

    return true;
  });
};

// Centralized budget spent calculation
export const calculateBudgetSpent = (
  transactions: Transaction[],
  budget: Budget,
  periodStart?: Date,
  periodEnd?: Date
): number => {
  const relevantTransactions = getBudgetTransactions(transactions, budget, periodStart, periodEnd);

  const spent = relevantTransactions.reduce((total, tx) => {
    if (tx.type === 'expense') return total + tx.amount;
    if (tx.type === 'income') return total - tx.amount;
    return total;
  }, 0);

  return Math.round(spent * 100) / 100;
};

// Get active period dates for a user
export const getActivePeriodDates = (user: User): { start: Date | null; end: Date | null } => {
  const activePeriod = user.budget_periods?.find(period => period.is_active);

  if (activePeriod) {
    return {
      start: new Date(activePeriod.start_date),
      end: activePeriod.end_date ? new Date(activePeriod.end_date) : new Date()
    };
  }

  // Fallback to current month
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
  };
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
    const transactions = await transactionService.getAll();
    return calculateAccountBalance(accountId, transactions);
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


// Italian pluralization helper
export const pluralize = (count: number, singular: string, plural: string): string => {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
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

/**
 * Creates a proper transfer transaction with double-entry bookkeeping
 * This function creates a single transfer transaction with proper to_account_id
 * The balance calculation logic will handle both sides of the transfer
 */
export const createTransferTransaction = async (
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string,
  userId: string,
  groupId?: string,
  date?: string
): Promise<Transaction> => {
  const transferData = {
    amount,
    description,
    type: 'transfer' as TransactionType,
    category: 'trasferimento',
    date: date || new Date().toISOString(),
    user_id: userId,
    account_id: fromAccountId,
    to_account_id: toAccountId,
    frequency: 'once' as TransactionFrequencyType,
    group_id: groupId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return await transactionService.create(transferData);
};

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
