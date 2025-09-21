import {
  Account,
  Budget,
  BudgetPeriod,
  Category,
  Group,
  InvestmentHolding,
  Transaction,
  User,
} from './types';

// Base URL for json-server API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const generateTimestamps = () => ({
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const generateId = (prefix: string) => `${prefix}_${Date.now()}`;

// Generic API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }


  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// API Services
export const userService = {
  getAll: (): Promise<User[]> => apiClient.get<User[]>('/users'),
  getById: (id: string): Promise<User> => apiClient.get<User>(`/users/${id}`),
  create: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> =>
    apiClient.post<User>('/users', {
      ...user,
      id: generateId('user'),
      ...generateTimestamps(),
    }),
  update: (id: string, user: Partial<User>): Promise<User> =>
    apiClient.patch<User>(`/users/${id}`, {
      ...user,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/users/${id}`),
};

export const groupService = {
  getAll: (): Promise<Group[]> => apiClient.get<Group[]>('/groups'),
  getById: (id: string): Promise<Group> => apiClient.get<Group>(`/groups/${id}`),
  create: (group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> =>
    apiClient.post<Group>('/groups', {
      ...group,
      id: generateId('group'),
      ...generateTimestamps(),
    }),
  update: (id: string, group: Partial<Group>): Promise<Group> =>
    apiClient.patch<Group>(`/groups/${id}`, {
      ...group,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/groups/${id}`),
};

export const accountService = {
  getAll: (): Promise<Account[]> => apiClient.get<Account[]>('/accounts'),
  getById: (id: string): Promise<Account> => apiClient.get<Account>(`/accounts/${id}`),
  getByUserId: (userId: string): Promise<Account[]> =>
    apiClient.get<Account[]>(`/accounts?user_ids_like=${userId}`),
  create: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> =>
    apiClient.post<Account>('/accounts', {
      ...account,
      id: generateId('acc'),
      ...generateTimestamps(),
    }),
  update: (id: string, account: Partial<Account>): Promise<Account> =>
    apiClient.patch<Account>(`/accounts/${id}`, {
      ...account,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/accounts/${id}`),
};

export const transactionService = {
  getAll: (): Promise<Transaction[]> => apiClient.get<Transaction[]>('/transactions'),
  getById: (id: string): Promise<Transaction> => apiClient.get<Transaction>(`/transactions/${id}`),
  getByUserId: (userId: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>(`/transactions?user_id=${userId}`),
  getByAccountId: (accountId: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>(`/transactions?account_id=${accountId}`),
  getByType: (type: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>(`/transactions?type=${type}`),
  getByCategory: (category: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>(`/transactions?category=${category}`),
  create: (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const nowIso = new Date().toISOString();
    const withTimestamps = {
      created_at: (transaction as Transaction).created_at ?? nowIso,
      updated_at: (transaction as Transaction).updated_at ?? nowIso,
    };
    return apiClient.post<Transaction>('/transactions', {
      ...transaction,
      id: generateId('trx'),
      ...withTimestamps,
    });
  },
  update: (id: string, transaction: Partial<Transaction>): Promise<Transaction> =>
    apiClient.patch<Transaction>(`/transactions/${id}`, {
      ...transaction,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/transactions/${id}`),
};

export const budgetService = {
  getAll: (): Promise<Budget[]> => apiClient.get<Budget[]>('/budgets'),
  getById: (id: string): Promise<Budget> => apiClient.get<Budget>(`/budgets/${id}`),
  getByUserId: (userId: string): Promise<Budget[]> =>
    apiClient.get<Budget[]>(`/budgets?user_id=${userId}`),
  create: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> =>
    apiClient.post<Budget>('/budgets', {
      ...budget,
      id: generateId('bdg'),
      ...generateTimestamps(),
    }),
  update: (id: string, budget: Partial<Budget>): Promise<Budget> =>
    apiClient.patch<Budget>(`/budgets/${id}`, {
      ...budget,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/budgets/${id}`),
};

export const categoryService = {
  getAll: (): Promise<Category[]> => apiClient.get<Category[]>('/categories'),
  getById: (id: string): Promise<Category> => apiClient.get<Category>(`/categories/${id}`),
  create: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> =>
    apiClient.post<Category>('/categories', {
      ...category,
      id: generateId('cat'),
      ...generateTimestamps(),
    }),
  update: (id: string, category: Partial<Category>): Promise<Category> =>
    apiClient.patch<Category>(`/categories/${id}`, {
      ...category,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/categories/${id}`),
};

export const investmentService = {
  getAll: (): Promise<InvestmentHolding[]> => apiClient.get<InvestmentHolding[]>('/investments'),
  getById: (id: string): Promise<InvestmentHolding> => apiClient.get<InvestmentHolding>(`/investments/${id}`),
  getByUserId: (userId: string): Promise<InvestmentHolding[]> =>
    apiClient.get<InvestmentHolding[]>(`/investments?user_id=${userId}`),
  create: (investment: Omit<InvestmentHolding, 'id' | 'created_at' | 'updated_at'>): Promise<InvestmentHolding> =>
    apiClient.post<InvestmentHolding>('/investments', {
      ...investment,
      id: generateId('inv'),
      ...generateTimestamps(),
    }),
  update: (id: string, investment: Partial<InvestmentHolding>): Promise<InvestmentHolding> =>
    apiClient.patch<InvestmentHolding>(`/investments/${id}`, {
      ...investment,
      updated_at: new Date().toISOString(),
    }),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/investments/${id}`),
};

export const budgetPeriodService = {
  // Derive from users.budget_periods (no direct /budgetPeriods endpoint)
  getAll: async (): Promise<BudgetPeriod[]> => {
    const users = await userService.getAll();
    return users.flatMap((u) => (u.budget_periods || []).map((p) => ({ ...p, user_id: p.user_id || u.id })));
  },
  getById: async (id: string): Promise<BudgetPeriod> => {
    const all = await budgetPeriodService.getAll();
    const found = all.find((p) => p.id === id);
    if (!found) throw new Error('BudgetPeriod not found');
    return found;
  },
  getByBudgetId: async (budgetId: string): Promise<BudgetPeriod[]> => {
    const all = await budgetPeriodService.getAll();
    return all.filter((p) => p.budget_id === budgetId);
  },
  getByUserId: async (userId: string): Promise<BudgetPeriod[]> => {
    const user = await userService.getById(userId);
    return user.budget_periods || [];
  },
  getActivePeriods: async (userId?: string): Promise<BudgetPeriod[]> => {
    if (userId) {
      const periods = await budgetPeriodService.getByUserId(userId);
      return periods.filter((p) => p.is_active);
    }
    const all = await budgetPeriodService.getAll();
    return all.filter((p) => p.is_active);
  },
  getCurrentPeriod: async (budgetId: string): Promise<BudgetPeriod | null> => {
    const all = await budgetPeriodService.getByBudgetId(budgetId);
    return all.find((p) => p.budget_id === budgetId && p.is_active && (p.end_date === null || p.end_date === undefined)) || null;
  },
  create: async (period: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetPeriod> => {
    const id = generateId('bdp');
    const timestamps = generateTimestamps();
    const newPeriod: BudgetPeriod = { id, ...period, ...timestamps } as BudgetPeriod;
    const user = await userService.getById(period.user_id);
    const list = [...(user.budget_periods || []), newPeriod];
    await userService.update(user.id, { budget_periods: list });
    return newPeriod;
  },
  update: async (id: string, period: Partial<BudgetPeriod>): Promise<BudgetPeriod> => {
    const users = await userService.getAll();
    const owner = users.find((u) => (u.budget_periods || []).some((p) => p.id === id));
    if (!owner) throw new Error('BudgetPeriod owner not found');
    const updatedList = (owner.budget_periods || []).map((p) => (p.id === id ? { ...p, ...period, updated_at: new Date().toISOString() } : p));
    await userService.update(owner.id, { budget_periods: updatedList });
    const updated = updatedList.find((p) => p.id === id)!;
    return updated as BudgetPeriod;
  },
  delete: async (id: string): Promise<void> => {
    const users = await userService.getAll();
    const owner = users.find((u) => (u.budget_periods || []).some((p) => p.id === id));
    if (!owner) return;
    const filtered = (owner.budget_periods || []).filter((p) => p.id !== id);
    await userService.update(owner.id, { budget_periods: filtered });
  },
  endCurrentPeriod: async (budgetId: string): Promise<BudgetPeriod> => {
    const current = await budgetPeriodService.getCurrentPeriod(budgetId);
    if (!current) throw new Error('No active period found');
    return budgetPeriodService.update(current.id, { end_date: new Date().toISOString(), is_active: false });
  },
  startNewPeriod: async (budgetId: string, userId: string): Promise<BudgetPeriod> => {
    return budgetPeriodService.create({
      budget_id: budgetId,
      user_id: userId,
      start_date: new Date().toISOString(),
      end_date: null,
      total_spent: 0,
      total_saved: 0,
      category_spending: {},
      is_active: true,
    });
  },
};

// Helper functions for common operations
export const apiHelpers = {
  // Get current user (you might want to implement proper authentication)
  getCurrentUser: async (): Promise<User> => {
    const users = await userService.getAll();
    return users[0]; // For demo purposes, return first user
  },

  // Get transactions with filtering options
  getTransactionsWithFilters: async (filters: {
    userId?: string;
    type?: string;
    category?: string;
    accountId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Transaction[]> => {
    const params = new URLSearchParams();

    if (filters.userId) params.append('user_id', filters.userId);
    if (filters.type) params.append('type', filters.type);
    if (filters.category) params.append('category', filters.category);
    if (filters.accountId) params.append('account_id', filters.accountId);

    return apiClient.get<Transaction[]>(`/transactions?${params.toString()}`);
  },

  // Get user's complete financial data
  getUserFinancialData: async (userId: string) => {
    const [user, accounts, transactions, budgets, investments] = await Promise.all([
      userService.getById(userId),
      accountService.getByUserId(userId),
      transactionService.getByUserId(userId),
      budgetService.getByUserId(userId),
      investmentService.getByUserId(userId),
    ]);

    return {
      user,
      accounts,
      transactions,
      budgets,
      investments,
    };
  },
};

export default apiClient;
