/**
 * Client-side API Service using Next.js API Routes (Server-side)
 */

import { Account, Budget, BudgetPeriod, Category, Group, InvestmentHolding, RecurringTransactionSeries, Transaction, User } from "../types";


// API configuration:
// Always prefer same-origin '/api' in the browser to avoid CORS.
// On the server, allow overriding via NEXT_PUBLIC_API_URL to reach upstream directly.
const API_BASE_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || '/api')
  : '/api';

/**
 * Enhanced API client with proper error handling and authentication
 */
class ApiClient {
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add authentication header if available
    if (this.authToken) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.authToken}`,
      };
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code || 'API_ERROR'
        );
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing errors
      throw new ApiError(
        'Network error or invalid response',
        0,
        'NETWORK_ERROR'
      );
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    return this.makeRequest<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Global API client instance
const apiClient = new ApiClient();

// Helper to set authentication token (to be called from auth hooks)
export const setApiAuthToken = (token: string | null) => {
  apiClient.setAuthToken(token);
};

// ======================
// SERVICE LAYER
// ======================

export const userService = {
  getAll: (): Promise<User[]> => apiClient.get<User[]>('/users'),
  getById: (id: string): Promise<User> => apiClient.get<User>(`/users/${id}`),
  create: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> =>
    apiClient.post<User>('/users', user),
  update: (id: string, user: Partial<User>): Promise<User> =>
    apiClient.put<User>(`/users/${id}`, user),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/users/${id}`),
};

// TODO: Implement group management feature - reserved for future implementation
export const groupService = {
  getAll: (): Promise<Group[]> => apiClient.get<Group[]>('/groups'),
  getById: (id: string): Promise<Group> => apiClient.get<Group>(`/groups/${id}`),
  create: (group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> =>
    apiClient.post<Group>('/groups', group),
  update: (id: string, group: Partial<Group>): Promise<Group> =>
    apiClient.put<Group>(`/groups/${id}`, group),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/groups/${id}`),
};

export const accountService = {
  getAll: (): Promise<Account[]> => apiClient.get<Account[]>('/accounts'),
  getById: (id: string): Promise<Account> => apiClient.get<Account>(`/accounts/${id}`),
  getByUserId: (userId: string): Promise<Account[]> =>
    apiClient.get<Account[]>('/accounts', { userId }),
  getByGroupId: (groupId: string): Promise<Account[]> =>
    apiClient.get<Account[]>('/accounts', { groupId }),
  create: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> =>
    apiClient.post<Account>('/accounts', account),
  update: (id: string, account: Partial<Account>): Promise<Account> =>
    apiClient.put<Account>(`/accounts/${id}`, account),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/accounts/${id}`),
};

export const transactionService = {
  getAll: (): Promise<Transaction[]> => apiClient.get<Transaction[]>('/transactions'),
  getById: (id: string): Promise<Transaction> => apiClient.get<Transaction>(`/transactions/${id}`),
  getByUserId: (userId: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>('/transactions', { userId }),
  getByAccountId: (accountId: string): Promise<Transaction[]> =>
    apiClient.get<Transaction[]>('/transactions', { accountId }),
  getByDateRange: (startDate: string, endDate: string, userId?: string): Promise<Transaction[]> => {
    const params: Record<string, string> = { startDate, endDate };
    if (userId) params.userId = userId;
    return apiClient.get<Transaction[]>('/transactions', params);
  },
  create: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> =>
    apiClient.post<Transaction>('/transactions', transaction),
  update: (id: string, transaction: Partial<Transaction>): Promise<Transaction> =>
    apiClient.put<Transaction>(`/transactions/${id}`, transaction),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/transactions/${id}`),

  // Advanced query methods using server-side processing
  getUpcomingTransactions: (userId?: string): Promise<Transaction[]> => {
    const params: Record<string, string> = { type: 'expense', upcoming: 'true' };
    if (userId) params.userId = userId;
    return apiClient.get<Transaction[]>('/transactions', params);
  },

  getFinancialSummary: (userId?: string, dateRange?: { start: string; end: string }): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netIncome: number;
    expensesByCategory: Record<string, number>;
  }> => {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    if (dateRange) {
      params.startDate = dateRange.start;
      params.endDate = dateRange.end;
    }
    return apiClient.get<{
      totalIncome: number;
      totalExpenses: number;
      totalTransfers: number;
      netIncome: number;
      expensesByCategory: Record<string, number>;
    }>('/transactions/summary', params);
  },

  getSpendingTrends: (userId?: string, days: number = 30): Promise<{
    dailySpending: Record<string, number>;
    categorySpending: Record<string, number>;
    totalSpent: number;
    avgDailySpending: number;
    weeklyAverage: number;
  }> => {
    const params: Record<string, string> = { days: days.toString() };
    if (userId) params.userId = userId;
    return apiClient.get<{
      dailySpending: Record<string, number>;
      categorySpending: Record<string, number>;
      totalSpent: number;
      avgDailySpending: number;
      weeklyAverage: number;
    }>('/transactions/trends', params);
  },
};

export const budgetService = {
  getAll: (): Promise<Budget[]> => apiClient.get<Budget[]>('/budgets'),
  getById: (id: string): Promise<Budget> => apiClient.get<Budget>(`/budgets/${id}`),
  getByUserId: (userId: string): Promise<Budget[]> =>
    apiClient.get<Budget[]>('/budgets', { userId }),
  create: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> =>
    apiClient.post<Budget>('/budgets', budget),
  update: (id: string, budget: Partial<Budget>): Promise<Budget> =>
    apiClient.put<Budget>(`/budgets/${id}`, budget),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/budgets/${id}`),

  // Advanced budget analytics methods using server-side processing
  getBudgetAnalysis: (budgetId: string): Promise<{
    budget: Budget;
    currentPeriod: BudgetPeriod | null;
    categorySpending: Record<string, { spent: number; budgeted: number; remaining: number; percentage: number }>;
    totalSpent: number;
    totalBudgeted: number;
    remainingBudget: number;
    isOverBudget: boolean;
    daysRemaining: number;
  }> =>
    apiClient.get<{
      budget: Budget;
      currentPeriod: BudgetPeriod | null;
      categorySpending: Record<string, { spent: number; budgeted: number; remaining: number; percentage: number }>;
      totalSpent: number;
      totalBudgeted: number;
      remainingBudget: number;
      isOverBudget: boolean;
      daysRemaining: number;
    }>(`/budgets/${budgetId}/analysis`),

  getBudgetsByUserWithStatus: (userId: string): Promise<Array<Budget & {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under_budget' | 'near_limit' | 'over_budget';
    currentPeriod: BudgetPeriod | null;
  }>> =>
    apiClient.get<Array<Budget & {
      spent: number;
      remaining: number;
      percentage: number;
      status: 'under_budget' | 'near_limit' | 'over_budget';
      currentPeriod: BudgetPeriod | null;
    }>>('/budgets', { userId, includeAnalysis: 'true' }),
};

export const categoryService = {
  getAll: (): Promise<Category[]> => apiClient.get<Category[]>('/categories'),
  create: (category: Omit<Category, 'id' | 'created_at' | 'updated_at' | 'key'>): Promise<Category> =>
    apiClient.post<Category>('/categories', category),
  update: (id: string, category: Partial<Category>): Promise<Category> =>
    apiClient.put<Category>(`/categories/${id}`, category),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/categories/${id}`),
};

export const recurringTransactionService = {
  getAll: (): Promise<RecurringTransactionSeries[]> =>
    apiClient.get<RecurringTransactionSeries[]>('/recurring-transactions'),
  getById: (id: string): Promise<RecurringTransactionSeries> =>
    apiClient.get<RecurringTransactionSeries>(`/recurring-transactions/${id}`),
  getByUserId: (userId: string): Promise<RecurringTransactionSeries[]> =>
    apiClient.get<RecurringTransactionSeries[]>('/recurring-transactions', { userId }),

  getActive: (userId?: string): Promise<RecurringTransactionSeries[]> => {
    const params: Record<string, string> = { activeOnly: 'true' };
    if (userId) params.userId = userId;
    return apiClient.get<RecurringTransactionSeries[]>('/recurring-transactions', params);
  },

  getDueWithinDays: (days: number, userId?: string): Promise<RecurringTransactionSeries[]> => {
    const params: Record<string, string> = { dueWithinDays: days.toString() };
    if (userId) params.userId = userId;
    return apiClient.get<RecurringTransactionSeries[]>('/recurring-transactions', params);
  },

  pause: (id: string): Promise<RecurringTransactionSeries> =>
    apiClient.patch<RecurringTransactionSeries>(`/recurring-transactions/${id}`, {
      is_active: false,
    }),

  resume: (id: string): Promise<RecurringTransactionSeries> =>
    apiClient.patch<RecurringTransactionSeries>(`/recurring-transactions/${id}`, {
      is_active: true,
    }),

  execute: (id: string): Promise<Transaction> =>
    apiClient.post<Transaction>(`/recurring-transactions/${id}/execute`),

  create: (recurringTransaction: Omit<RecurringTransactionSeries, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringTransactionSeries> =>
    apiClient.post<RecurringTransactionSeries>('/recurring-transactions', recurringTransaction),
  update: (id: string, recurringTransaction: Partial<RecurringTransactionSeries>): Promise<RecurringTransactionSeries> =>
    apiClient.put<RecurringTransactionSeries>(`/recurring-transactions/${id}`, recurringTransaction),
  delete: (id: string): Promise<void> => apiClient.delete<void>(`/recurring-transactions/${id}`),

  // Advanced analytics and statistics methods using server-side processing
  getStats: (userId?: string): Promise<{
    totalActiveSeries: number;
    totalExpenseSeries: number;
    totalIncomeSeries: number;
    totalMonthlyImpact: number;
    averageAmount: number;
    nextDueDateSeries: RecurringTransactionSeries[];
    overdueCount: number;
    upcomingCount: number;
  }> => {
    const params: Record<string, string> = { includeStats: 'true' };
    if (userId) params.userId = userId;
    return apiClient.get<{
      totalActiveSeries: number;
      totalExpenseSeries: number;
      totalIncomeSeries: number;
      totalMonthlyImpact: number;
      averageAmount: number;
      nextDueDateSeries: RecurringTransactionSeries[];
      overdueCount: number;
      upcomingCount: number;
    }>('/recurring-transactions', params);
  },

  getReconciliation: (seriesId: string): Promise<{
    series: RecurringTransactionSeries;
    transactions: Transaction[];
    summary: {
      expectedExecutions: number;
      actualExecutions: number;
      missedPayments: number;
      totalPaid: number;
      expectedTotal: number;
      difference: number;
      successRate: number;
    };
  }> =>
    apiClient.get<{
      series: RecurringTransactionSeries;
      transactions: Transaction[];
      summary: {
        expectedExecutions: number;
        actualExecutions: number;
        missedPayments: number;
        totalPaid: number;
        expectedTotal: number;
        difference: number;
        successRate: number;
      };
    }>(`/recurring-transactions/${seriesId}/reconciliation`),

  findMissedExecutions: (): Promise<Array<{
    series: RecurringTransactionSeries;
    missedCount: number;
  }>> =>
    apiClient.get<Array<{
      series: RecurringTransactionSeries;
      missedCount: number;
    }>>('/recurring-transactions/missed'),

  getDashboardData: (userId?: string): Promise<{
    activeSeries: RecurringTransactionSeries[];
    upcomingSeries: RecurringTransactionSeries[];
    overdueSeries: RecurringTransactionSeries[];
    monthlyImpact: { income: number; expenses: number; net: number };
  }> => {
    const params: Record<string, string> = {};
    if (userId) params.userId = userId;
    return apiClient.get<{
      activeSeries: RecurringTransactionSeries[];
      upcomingSeries: RecurringTransactionSeries[];
      overdueSeries: RecurringTransactionSeries[];
      monthlyImpact: { income: number; expenses: number; net: number };
    }>('/recurring-transactions/dashboard', params);
  },
};

// Investment service (stub - to be implemented)
// TODO: Implement investment holdings feature
export const investmentService = {
  getAll: (): Promise<InvestmentHolding[]> => Promise.resolve([]),
  getByUserId: (): Promise<InvestmentHolding[]> => Promise.resolve([]),
};

// Budget Period Service (simplified for now)
export const budgetPeriodService = {
  getAll: (): Promise<BudgetPeriod[]> => apiClient.get<BudgetPeriod[]>('/budget-periods'),
  getByUserId: (userId: string): Promise<BudgetPeriod[]> =>
    apiClient.get<BudgetPeriod[]>('/budget-periods', { userId }),
  getActivePeriods: (userId: string): Promise<BudgetPeriod[]> =>
    apiClient.get<BudgetPeriod[]>('/budget-periods', { userId, active: 'true' }),
  getCurrentPeriod: (budgetId: string): Promise<BudgetPeriod | null> =>
    apiClient.get<BudgetPeriod | null>(`/budget-periods/current/${budgetId}`),
  startNewPeriod: (userId: string): Promise<BudgetPeriod> =>
    apiClient.post<BudgetPeriod>('/budget-periods', { userId }),
  endCurrentPeriod: (userId: string, endDate?: string): Promise<BudgetPeriod | null> =>
    apiClient.post<BudgetPeriod | null>('/budget-periods/end', {
      userId,
      endDate,
      user_id: userId,
      end_date: endDate,
    }),
  create: (userId: string, budgetPeriod: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetPeriod> =>
    apiClient.post<BudgetPeriod>('/budget-periods', { userId, ...budgetPeriod }),
  update: (userId: string, id: string, data: Partial<BudgetPeriod>): Promise<BudgetPeriod> =>
    apiClient.put<BudgetPeriod>(`/budget-periods/${id}`, { userId, ...data }),
};

// API helpers for backward compatibility
export const apiHelpers = {
  getCurrentUser: (): Promise<User> => apiClient.get<User>('/users/me'),
  getTransactionsWithFilters: (filters: Record<string, unknown>): Promise<Transaction[]> => {
    const params = Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [key, String(value)])
    );
    return apiClient.get<Transaction[]>('/transactions', params);
  },
};
