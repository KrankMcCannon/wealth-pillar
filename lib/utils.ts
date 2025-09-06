import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { dummyAccounts, dummyBudgets, dummyTransactions, dummyUsers } from "./dummy-data";
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
    return `€ ${amount.toFixed(2).replace('.', ',')}`;
  }
}

export const formatPercentage = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) {
    return '0.00%';
  }
  return `${Math.round(value * 100) / 100}%`;
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

export const getMondayFirstDayIndex = (dateString: string): number => {
  const date = new Date(dateString)
  const jsDay = date.getDay() // 0=Dom ... 6=Sab
  return jsDay === 0 ? 6 : jsDay - 1 // Lun=0 ... Dom=6
}

export const isAdmin = (user: User): boolean => {
  return user.role !== 'member';
};

export const getExpenseTransactions = (user: User): Transaction[] => {
  return dummyTransactions.filter((transaction) => transaction.user_id === user.id && transaction.type === 'expense');
};

export const getIncomeTransactions = (user: User): Transaction[] => {
  return dummyTransactions.filter((transaction) => transaction.user_id === user.id && transaction.type === 'income');
};

export const getBalanceSpent = (budget: Budget): number => {
  const user_transactions = dummyTransactions.filter((transaction) => transaction.user_id === budget.user_id);
  const spent = user_transactions
    .filter((transaction) => transaction.type === 'expense' && budget.categories.includes(transaction.category))
    .reduce((total, transaction) => total + transaction.amount, 0);
  return Math.round(spent * 100) / 100;
};

export const getBudgetBalance = (budget: Budget): number => {
  const user_transactions = dummyTransactions.filter((transaction) => transaction.user_id === budget.user_id);
  const spent = user_transactions
    .filter((transaction) => transaction.type === 'expense' && budget.categories.includes(transaction.category))
    .reduce((total, transaction) => total + transaction.amount, 0);
  return Math.round((budget.amount - spent) * 100) / 100;
}

export const getBudgetProgress = (budget: Budget): number => {
  const balance = getBudgetBalance(budget);
  const spent = budget.amount - balance;
  const progress = (spent / budget.amount) * 100;
  return Math.round(Math.min(Math.max(progress, 0), 100) * 100) / 100;
};

export const getUserBudgets = (user: User): Budget[] => {
  return dummyBudgets.filter((budget) => budget.user_id === user.id);
};

export const getUserTransactions = (user: User): Transaction[] => {
  return dummyTransactions.filter((transaction) => transaction.user_id === user.id);
}

export const getDynamicChartData = (budget: Budget) => {
  const user = dummyUsers.find((user) => user.id === budget.user_id);
  if (!user) return {
    expense: [0],
    income: [0],
    dailyExpenses: [],
    dailyIncome: [],
    categories: [],
    incomeTypes: []
  };

  const expenses = getExpenseTransactions(user);
  const income = getIncomeTransactions(user);

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
    const dayIndex = transaction.date.getDay(); // 0 = Domenica, 1 = Lunedì, ...
    // Convert Sunday-based (0-6) to Monday-based (0-6): Sunday becomes 6, Monday becomes 0
    const mondayBasedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const dayName = dayNames[mondayBasedIndex];
    
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
    const dayIndex = transaction.date.getDay();
    // Convert Sunday-based (0-6) to Monday-based (0-6): Sunday becomes 6, Monday becomes 0
    const mondayBasedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const dayName = dayNames[mondayBasedIndex];
    
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
};

export const getUserAccountBalance = (userId: string): number => {
  const user = dummyUsers.find(u => u.id === userId);
  if (!user) return 0;
  
  const userTransactions = getUserTransactions(user);
  return Math.round(userTransactions.reduce((total, tx) => {
    return tx.type === 'income' ? total + tx.amount : total - tx.amount;
  }, 0) * 100) / 100;
};

export const getAllAccountsBalance = (): number => {
  return Math.round(dummyUsers.reduce((total, user) => {
    return total + getUserAccountBalance(user.id);
  }, 0) * 100) / 100;
};

export const getFilteredBudgets = (userId?: string): Budget[] => {
  if (userId && userId !== 'all') {
    return dummyBudgets.filter(budget => budget.user_id === userId);
  }
  return dummyBudgets;
};

export const getRecurringTransactions = (userId?: string): Transaction[] => {
  const allRecurring = dummyTransactions.filter(tx => 
    tx.frequency === 'weekly' || tx.frequency === 'biweekly' || tx.frequency === 'yearly'
  );
  
  if (userId && userId !== 'all') {
    return allRecurring.filter(tx => tx.user_id === userId).slice(0, 5);
  }
  
  return allRecurring.slice(0, 5);
};

export const getAccountsWithBalance = (userId?: string): Account[] => {
  if (userId && userId !== 'all') {
    return dummyAccounts.filter((account: Account) => account.user_ids.includes(userId));
  }
  return dummyAccounts;
};

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
    if (filters.category && transaction.category !== filters.category) {
      return false;
    }

    // Filter by type
    if (filters.type && transaction.type !== filters.type) {
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

export const getTotalForSection = (transactions: Transaction[]): number => {
  return Math.round(transactions.reduce((sum, tx) => {
    return tx.type === 'income' ? sum + tx.amount : sum - tx.amount;
  }, 0) * 100) / 100;
};

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
