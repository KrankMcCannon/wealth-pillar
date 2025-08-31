/**
 * Dummy data that matches the database structure
 * Used for development and testing
 */

import { 
  Group, 
  Person, 
  Category, 
  InvestmentHolding,
  AccountWithBalance,
  TransactionWithAccount,
  BudgetWithSpent 
} from './types';

// Groups
export const dummyGroups: Group[] = [
  {
    id: 'group_1',
    name: 'Famiglia Rossi',
    description: 'Gruppo familiare principale',
    user_id: 'user_clerk_123',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// People
export const dummyPeople: Person[] = [
  {
    id: 'person_1',
    name: 'Marco Rossi',
    avatar: '👨‍💼',
    theme_color: '#3B82F6',
    budget_start_date: '2024-01-01',
    budget_periods: [],
    group_id: 'group_1',
    role: 'owner',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'person_2', 
    name: 'Sofia Rossi',
    avatar: '👩‍💼',
    theme_color: '#EF4444',
    budget_start_date: '2024-01-01',
    budget_periods: [],
    group_id: 'group_1',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
];

// Categories
export const dummyCategories: Category[] = [
  { id: 'cat_1', name: 'Alimentari', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_2', name: 'Trasporti', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_3', name: 'Intrattenimento', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_4', name: 'Bollette', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_5', name: 'Stipendio', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_6', name: 'Shopping', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'cat_7', name: 'Salute', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
];

// Accounts  
export const dummyAccounts: AccountWithBalance[] = [
  {
    id: 'acc_1',
    name: 'Conto Corrente Principale',
    type: 'contanti',
    balance: 5420.50,
    initial_balance: 5000.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'acc_2',
    name: 'Conto Risparmio',
    type: 'risparmio', 
    balance: 12350.75,
    initial_balance: 10000.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-10T15:45:00Z'
  },
  {
    id: 'acc_3',
    name: 'Carta di Credito',
    type: 'contanti',
    balance: -850.25,
    initial_balance: 0,
    person_ids: ['person_1'],
    group_id: 'group_1', 
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-14T09:15:00Z'
  },
  {
    id: 'acc_4',
    name: 'Portafoglio Investimenti',
    type: 'investimenti',
    balance: 25430.80,
    initial_balance: 20000.00,
    person_ids: ['person_1', 'person_2'],
    group_id: 'group_1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-13T14:20:00Z'
  }
];

// Transactions
export const dummyTransactions: TransactionWithAccount[] = [
  {
    id: 'trx_1',
    description: 'Supermercato Conad',
    amount: 127.85,
    type: 'spesa',
    category: 'Alimentari',
    date: '2024-01-15',
    account_id: 'acc_1',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-15T18:30:00Z',
    updated_at: '2024-01-15T18:30:00Z'
  },
  {
    id: 'trx_2',
    description: 'Stipendio Mensile',
    amount: 4500.00,
    type: 'entrata',
    category: 'Stipendio', 
    date: '2024-01-15',
    account_id: 'acc_1',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-15T08:00:00Z',
    updated_at: '2024-01-15T08:00:00Z'
  },
  {
    id: 'trx_3',
    description: 'Netflix Abbonamento',
    amount: 15.99,
    type: 'spesa',
    category: 'Intrattenimento',
    date: '2024-01-14',
    account_id: 'acc_3',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-14T12:15:00Z',
    updated_at: '2024-01-14T12:15:00Z'
  },
  {
    id: 'trx_4',
    description: 'Carburante Shell',
    amount: 52.40,
    type: 'spesa',
    category: 'Trasporti',
    date: '2024-01-14',
    account_id: 'acc_3',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-14T16:45:00Z',
    updated_at: '2024-01-14T16:45:00Z'
  },
  {
    id: 'trx_5',
    description: 'Caffè Starbucks',
    amount: 8.75,
    type: 'spesa',
    category: 'Alimentari',
    date: '2024-01-13',
    account_id: 'acc_1',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-13T09:30:00Z',
    updated_at: '2024-01-13T09:30:00Z'
  },
  {
    id: 'trx_6',
    description: 'Acquisto Amazon',
    amount: 45.99,
    type: 'spesa',
    category: 'Shopping',
    date: '2024-01-13',
    account_id: 'acc_3',
    to_account_id: null,
    is_reconciled: true,
    parent_transaction_id: null,
    linked_transaction_id: null,
    remaining_amount: null,
    created_at: '2024-01-13T14:20:00Z',
    updated_at: '2024-01-13T14:20:00Z'
  }
];

// Enhanced Budget types with periods
export interface BudgetPeriodData {
  start_date: string;
  end_date: string;
  is_current: boolean;
}

// Budgets
export const dummyBudgets: BudgetWithSpent[] = [
  {
    id: 'bdg_1',
    description: 'Budget Spese Quotidiane',
    amount: 800,
    period: 'monthly',
    categories: ['Alimentari', 'Trasporti'],
    person_id: 'person_1',
    spent_amount: 542.60,
    remaining_amount: 257.40,
    percentage_used: 67.83,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'bdg_2',
    description: 'Budget Intrattenimento & Svago',
    amount: 350,
    period: 'monthly',
    categories: ['Intrattenimento', 'Shopping'],
    person_id: 'person_1',
    spent_amount: 426.89,
    remaining_amount: -76.89,
    percentage_used: 121.97,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'bdg_3',
    description: 'Budget Salute & Benessere',
    amount: 200,
    period: 'monthly',
    categories: ['Salute'],
    person_id: 'person_2',
    spent_amount: 99.99,
    remaining_amount: 100.01,
    percentage_used: 50.00,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'bdg_4',
    description: 'Budget Casa & Bollette',
    amount: 600,
    period: 'monthly',
    categories: ['Bollette', 'Casa'],
    person_id: 'person_1',
    spent_amount: 455.20,
    remaining_amount: 144.80,
    percentage_used: 75.87,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 'bdg_5',
    description: 'Budget Risparmio Annuale',
    amount: 3000,
    period: 'annually',
    categories: ['Risparmio'],
    person_id: 'person_1',
    spent_amount: 1200.00,
    remaining_amount: 1800.00,
    percentage_used: 40.00,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
];

// Calculate budget periods
export const getBudgetPeriod = (budget: BudgetWithSpent): BudgetPeriodData => {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (budget.period === 'monthly') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    // annually
    startDate = new Date(now.getFullYear(), 0, 1);
    endDate = new Date(now.getFullYear(), 11, 31);
  }

  return {
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    is_current: true
  };
};

// Investment Holdings
export const dummyInvestmentHoldings: InvestmentHolding[] = [
  {
    id: 'inv_1',
    person_id: 'person_1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    quantity: 25,
    purchase_price: 150.25,
    current_price: 182.50,
    purchase_date: '2023-06-15',
    group_id: 'group_1',
    created_at: '2023-06-15T10:00:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: 'inv_2',
    person_id: 'person_1',
    name: 'Vanguard S&P 500 ETF',
    symbol: 'VOO',
    quantity: 15,
    purchase_price: 380.00,
    current_price: 425.30,
    purchase_date: '2023-03-20',
    group_id: 'group_1',
    created_at: '2023-03-20T14:30:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: 'inv_3',
    person_id: 'person_2',
    name: 'Microsoft Corporation',
    symbol: 'MSFT',
    quantity: 12,
    purchase_price: 280.75,
    current_price: 375.85,
    purchase_date: '2023-04-10',
    group_id: 'group_1',
    created_at: '2023-04-10T11:15:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  },
  {
    id: 'inv_4',
    person_id: 'person_1',
    name: 'Tesla Inc.',
    symbol: 'TSLA',
    quantity: 8,
    purchase_price: 220.00,
    current_price: 185.75,
    purchase_date: '2023-09-05',
    group_id: 'group_1',
    created_at: '2023-09-05T13:45:00Z',
    updated_at: '2024-01-15T16:00:00Z'
  }
];

// Calculated totals and metrics
export const calculatePortfolioMetrics = () => {
  const totalInvestmentValue = dummyInvestmentHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.current_price), 0
  );
  
  const totalInvestmentCost = dummyInvestmentHoldings.reduce((sum, holding) => 
    sum + (holding.quantity * holding.purchase_price), 0
  );

  const totalGainLoss = totalInvestmentValue - totalInvestmentCost;
  const totalGainLossPercent = (totalGainLoss / totalInvestmentCost) * 100;

  const totalAccountBalance = dummyAccounts.reduce((sum, account) => sum + account.balance, 0);
  
  const totalIncome = dummyTransactions
    .filter(t => t.type === 'entrata')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = dummyTransactions
    .filter(t => t.type === 'spesa') 
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalInvestmentValue,
    totalInvestmentCost,
    totalGainLoss,
    totalGainLossPercent,
    totalAccountBalance,
    totalIncome,
    totalExpenses,
    netFlow: totalIncome - totalExpenses
  };
};

// Dashboard-specific data types
export interface DashboardBankAccount {
  id: number;
  name: string;
  type: string;
  owner: string;
  balance: number;
  icon: string;
  color: string;
}

export interface DashboardBudget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  color: string;
  icon: string;
  categories: Array<{
    name: string;
    transactions: number;
    amount: number;
  }>;
}

export interface UpcomingTransaction {
  id: number;
  title: string;
  bankAccount: string;
  daysRemaining: number;
  amount: number;
  icon: string;
}

// Dashboard dummy data
export const dashboardBankAccounts: DashboardBankAccount[] = [
  {
    id: 1,
    name: "Checking",
    type: "Current Account",
    owner: "Alex Morgan",
    balance: 12450.50,
    icon: "Building2", // Will be replaced with actual icon in component
    color: "bg-blue-500"
  },
  {
    id: 2,
    name: "Savings",
    type: "Savings Account", 
    owner: "Alex Morgan",
    balance: 35820.00,
    icon: "PiggyBank",
    color: "bg-green-500"
  },
  {
    id: 3,
    name: "Credit Card",
    type: "Credit Card",
    owner: "Alex Morgan", 
    balance: -2100.30,
    icon: "CreditCard",
    color: "bg-red-500"
  }
];

export const dashboardBudgets: DashboardBudget[] = [
  {
    id: 1,
    name: "Groceries",
    amount: 500,
    spent: 350,
    color: "bg-green-500",
    icon: "🛒",
    categories: [
      { name: "Supermarket", transactions: 12, amount: 280 },
      { name: "Restaurants", transactions: 5, amount: 70 }
    ]
  },
  {
    id: 2,
    name: "Entertainment",
    amount: 300,
    spent: 250,
    color: "bg-yellow-500",
    icon: "🎬",
    categories: [
      { name: "Movies", transactions: 4, amount: 120 },
      { name: "Concerts", transactions: 2, amount: 130 }
    ]
  },
  {
    id: 3,
    name: "Shopping",
    amount: 800,
    spent: 400,
    color: "bg-blue-500",
    icon: "🛍️",
    categories: [
      { name: "Clothing", transactions: 8, amount: 300 },
      { name: "Electronics", transactions: 3, amount: 100 }
    ]
  }
];

export const upcomingTransactions: UpcomingTransaction[] = [
  {
    id: 1,
    title: "Rent Payment",
    bankAccount: "Checking",
    daysRemaining: 1,
    amount: 1200,
    icon: "Home"
  },
  {
    id: 2,
    title: "Internet Bill",
    bankAccount: "Checking",
    daysRemaining: 2,
    amount: 50,
    icon: "Wifi"
  },
  {
    id: 3,
    title: "Grocery Shopping",
    bankAccount: "Credit Card",
    daysRemaining: 3,
    amount: 120,
    icon: "ShoppingCart"
  }
];

// Budget page specific data types
export interface BudgetPageBudget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  color: string;
  icon: string;
}

export interface DailyExpenseData {
  day: string;
  groceries: number;
  entertainment: number;
  shopping: number;
}

export interface BudgetCategory {
  name: string;
  color: string;
}

export interface BudgetPageTransaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  date: string;
}

// Budget page dummy data
export const budgetPageBudgets: BudgetPageBudget[] = [
  { id: 1, name: "Groceries", amount: 500, spent: 350, color: "bg-green-500", icon: "🛒" },
  { id: 2, name: "Entertainment", amount: 300, spent: 250, color: "bg-yellow-500", icon: "🎬" },
  { id: 3, name: "Shopping", amount: 800, spent: 400, color: "bg-blue-500", icon: "🛍️" },
  { id: 4, name: "Transportation", amount: 200, spent: 180, color: "bg-purple-500", icon: "🚗" },
  { id: 5, name: "Utilities", amount: 300, spent: 250, color: "bg-red-500", icon: "⚡" }
];

export const budgetExpenseData: number[] = [45, 52, 48, 61, 55, 67, 73];
export const budgetIncomeData: number[] = [120, 0, 0, 250, 0, 180, 0];

export const dailyExpenseData: DailyExpenseData[] = [
  { day: "Mon", groceries: 25, entertainment: 15, shopping: 5 },
  { day: "Tue", groceries: 30, entertainment: 20, shopping: 2 },
  { day: "Wed", groceries: 20, entertainment: 18, shopping: 10 },
  { day: "Thu", groceries: 35, entertainment: 16, shopping: 10 },
  { day: "Fri", groceries: 25, entertainment: 20, shopping: 10 },
  { day: "Sat", groceries: 30, entertainment: 25, shopping: 12 },
  { day: "Sun", groceries: 40, entertainment: 18, shopping: 15 }
];

export const budgetCategories: BudgetCategory[] = [
  { name: "Groceries", color: "#10b981" },
  { name: "Entertainment", color: "#f59e0b" },
  { name: "Shopping", color: "#3b82f6" },
  { name: "Transportation", color: "#8b5cf6" },
  { name: "Utilities", color: "#ef4444" }
];

export const budgetTransactions: BudgetPageTransaction[] = [
  { id: 1, title: "Grocery Store", category: "Groceries", amount: 45, date: "2024-01-15" },
  { id: 2, title: "Movie Theater", category: "Entertainment", amount: 25, date: "2024-01-14" },
  { id: 3, title: "Online Shopping", category: "Shopping", amount: 89, date: "2024-01-13" },
  { id: 4, title: "Gas Station", category: "Transportation", amount: 35, date: "2024-01-12" },
  { id: 5, title: "Electricity Bill", category: "Utilities", amount: 120, date: "2024-01-10" }
];

// Transactions page specific data
export interface TransactionPageTransaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  icon: string;
  account?: string;
}

export const transactionsPageData = {
  today: [
    { id: 1, title: "Fresh Foods Market", category: "Groceries", amount: 45.20, type: "expense" as const, date: "2024-01-31", icon: "🛒", account: "Credit Card" },
    { id: 2, title: "Cinema City", category: "Entertainment", amount: 22.50, type: "expense" as const, date: "2024-01-31", icon: "🎬", account: "Checking" }
  ],
  yesterday: [
    { id: 3, title: "Power Company", category: "Utilities", amount: 75.00, type: "expense" as const, date: "2024-01-30", icon: "⚡", account: "Checking" },
    { id: 4, title: "Tech Solutions Inc.", category: "Salary", amount: 3500.00, type: "income" as const, date: "2024-01-30", icon: "💰", account: "Checking" }
  ],
  thisWeek: [
    { id: 5, title: "Gas Station", category: "Transportation", amount: 65.00, type: "expense" as const, date: "2024-01-29", icon: "⛽", account: "Credit Card" },
    { id: 6, title: "Subscription Service", category: "Entertainment", amount: 9.99, type: "expense" as const, date: "2024-01-28", icon: "📺", account: "Checking" },
    { id: 7, title: "Online Store", category: "Shopping", amount: 89.99, type: "expense" as const, date: "2024-01-27", icon: "📦", account: "Credit Card" }
  ]
};

export const upcomingTransactionsList = [
  { id: 1, title: "Rent Payment", category: "Housing", amount: 1200, type: "expense" as const, date: "2024-02-01", icon: "🏠", account: "Checking", daysLeft: 1 },
  { id: 2, title: "Internet Bill", category: "Utilities", amount: 50, type: "expense" as const, date: "2024-02-02", icon: "📶", account: "Checking", daysLeft: 2 },
  { id: 3, title: "Grocery Shopping", category: "Groceries", amount: 120, type: "expense" as const, date: "2024-02-03", icon: "🛒", account: "Credit Card", daysLeft: 3 }
];

export const recurrentTransactions = [
  { id: 1, title: "Netflix Subscription", category: "Entertainment", amount: 15.99, frequency: "Monthly", nextDate: "2024-02-05", icon: "📺", account: "Checking" },
  { id: 2, title: "Gym Membership", category: "Health", amount: 29.99, frequency: "Monthly", nextDate: "2024-02-10", icon: "💪", account: "Checking" },
  { id: 3, title: "Phone Plan", category: "Utilities", amount: 45.00, frequency: "Monthly", nextDate: "2024-02-15", icon: "📱", account: "Checking" }
];