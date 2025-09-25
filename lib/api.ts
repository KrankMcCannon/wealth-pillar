import {
    Account,
    Budget,
    BudgetPeriod,
    Category,
    Group,
    InvestmentHolding,
    RecurringTransactionSeries,
    Transaction,
    User,
} from './types';
import { supabase } from './supabase-client';

const getSupabaseClient = () => supabase;

const generateTimestamps = () => ({
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

const generateId = (prefix: string) => `${prefix}_${Date.now()}`;

// Supabase API client
class SupabaseApiClient {
  // Helper function to handle Supabase responses
  private handleResponse<T>(response: { data: T | null; error: unknown }): T {
    if (response.error) {
      const errorMessage = response.error instanceof Error ? response.error.message : String(response.error);
      throw new Error(`Supabase error: ${errorMessage}`);
    }
    if (!response.data) {
      throw new Error('No data returned from Supabase');
    }
    return response.data;
  }

  // Generic CRUD operations
  async getAll<T>(table: string): Promise<T[]> {
    const response = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false });

    return this.handleResponse(response);
  }

  async getById<T>(table: string, id: string): Promise<T> {
    const response = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    return this.handleResponse(response);
  }

  async create<T>(table: string, data: Omit<T, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Promise<T> {
    const newData = {
      ...data,
      id: data.id || generateId(table.slice(0, -1)), // Remove 's' from table name
      ...generateTimestamps(),
    };

    const response = await supabase
      .from(table)
      .insert([newData])
      .select()
      .single();

    return this.handleResponse(response);
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString(),
    };

    const response = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    return this.handleResponse(response);
  }

  async delete(table: string, id: string): Promise<void> {
    const response = await supabase
      .from(table)
      .delete()
      .eq('id', id);

    if (response.error) {
      throw new Error(`Supabase error: ${response.error.message}`);
    }
  }

  // Custom query methods
  async getByUserId<T>(table: string, userId: string): Promise<T[]> {
    const response = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return this.handleResponse(response);
  }

  async getByGroupId<T>(table: string, groupId: string): Promise<T[]> {
    const response = await supabase
      .from(table)
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    return this.handleResponse(response);
  }
}

const apiClient = new SupabaseApiClient();

// API Services
export const userService = {
  getAll: (): Promise<User[]> => apiClient.getAll<User>('users'),
  getById: (id: string): Promise<User> => apiClient.getById<User>('users', id),
  create: (user: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> =>
    apiClient.create<User>('users', user),
  update: (id: string, user: Partial<User>): Promise<User> =>
    apiClient.update<User>('users', id, user),
  delete: (id: string): Promise<void> => apiClient.delete('users', id),
};

export const groupService = {
  getAll: (): Promise<Group[]> => apiClient.getAll<Group>('groups'),
  getById: (id: string): Promise<Group> => apiClient.getById<Group>('groups', id),
  create: (group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group> =>
    apiClient.create<Group>('groups', group),
  update: (id: string, group: Partial<Group>): Promise<Group> =>
    apiClient.update<Group>('groups', id, group),
  delete: (id: string): Promise<void> => apiClient.delete('groups', id),
};

export const accountService = {
  getAll: (): Promise<Account[]> => apiClient.getAll<Account>('accounts'),
  getById: (id: string): Promise<Account> => apiClient.getById<Account>('accounts', id),
  getByUserId: async (userId: string): Promise<Account[]> => {
    const response = await supabase
      .from('accounts')
      .select('*')
      .contains('user_ids', [userId]);

    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },
  getByGroupId: (groupId: string): Promise<Account[]> => apiClient.getByGroupId<Account>('accounts', groupId),
  create: (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> =>
    apiClient.create<Account>('accounts', account),
  update: (id: string, account: Partial<Account>): Promise<Account> =>
    apiClient.update<Account>('accounts', id, account),
  delete: (id: string): Promise<void> => apiClient.delete('accounts', id),
};

export const transactionService = {
  getAll: (): Promise<Transaction[]> => apiClient.getAll<Transaction>('transactions'),
  getById: (id: string): Promise<Transaction> => apiClient.getById<Transaction>('transactions', id),
  getByUserId: (userId: string): Promise<Transaction[]> => apiClient.getByUserId<Transaction>('transactions', userId),
  getByAccountId: async (accountId: string): Promise<Transaction[]> => {
    const response = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .order('date', { ascending: false });

    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },
  getByDateRange: async (startDate: string, endDate: string, userId?: string): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query.order('date', { ascending: false });

    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },
  create: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction> =>
    apiClient.create<Transaction>('transactions', transaction),
  update: (id: string, transaction: Partial<Transaction>): Promise<Transaction> =>
    apiClient.update<Transaction>('transactions', id, transaction),
  delete: (id: string): Promise<void> => apiClient.delete('transactions', id),

  // Advanced query methods with optimized database calls
  getUpcomingTransactions: async (userId?: string): Promise<Transaction[]> => {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('type', 'expense')
      .not('frequency', 'eq', 'once')
      .not('frequency', 'is', null)
      .order('date', { ascending: true });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query;
    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },

  getFinancialSummary: async (userId?: string, dateRange?: { start: string; end: string }): Promise<{
    totalIncome: number;
    totalExpenses: number;
    totalTransfers: number;
    netIncome: number;
    expensesByCategory: Record<string, number>;
  }> => {
    let query = supabase
      .from('transactions')
      .select('amount, type, category');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (dateRange) {
      query = query.gte('date', dateRange.start).lte('date', dateRange.end);
    }

    const response = await query;
    if (response.error) throw new Error(response.error.message);

    const transactions = response.data || [];

    const summary = transactions.reduce((acc, t) => {
      switch (t.type) {
        case 'income':
          acc.totalIncome += t.amount;
          break;
        case 'expense':
          acc.totalExpenses += t.amount;
          acc.expensesByCategory[t.category] = (acc.expensesByCategory[t.category] || 0) + t.amount;
          break;
        case 'transfer':
          acc.totalTransfers += t.amount;
          break;
      }
      return acc;
    }, {
      totalIncome: 0,
      totalExpenses: 0,
      totalTransfers: 0,
      netIncome: 0,
      expensesByCategory: {} as Record<string, number>
    });

    summary.netIncome = summary.totalIncome - summary.totalExpenses;
    return summary;
  },

  getSpendingTrends: async (userId?: string, days: number = 30): Promise<{
    dailySpending: Record<string, number>;
    categorySpending: Record<string, number>;
    totalSpent: number;
    avgDailySpending: number;
    weeklyAverage: number;
  }> => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

    let query = supabase
      .from('transactions')
      .select('amount, date, category')
      .eq('type', 'expense')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query;
    if (response.error) throw new Error(response.error.message);

    const transactions = response.data || [];

    const dailySpending: Record<string, number> = {};
    const categorySpending: Record<string, number> = {};

    transactions.forEach(t => {
      const day = new Date(t.date).toISOString().split('T')[0];
      dailySpending[day] = (dailySpending[day] || 0) + t.amount;
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const avgDailySpending = totalSpent / days;
    const weeklyAverage = Object.values(dailySpending)
      .reduce((sum, amount, _, arr) => sum + (amount / (arr.length / 7)), 0);

    return {
      dailySpending,
      categorySpending,
      totalSpent,
      avgDailySpending,
      weeklyAverage
    };
  },

  bulkOperations: async (operations: Array<{
    type: 'create' | 'update' | 'delete';
    id?: string;
    data?: Partial<Transaction>;
  }>): Promise<Transaction[]> => {
    const results: Transaction[] = [];

    // Group operations by type for better performance
    const creates = operations.filter(op => op.type === 'create');
    const updates = operations.filter(op => op.type === 'update');
    const deletes = operations.filter(op => op.type === 'delete');

    // Batch creates
    if (creates.length > 0) {
      const createData = creates.map(op => op.data).filter(Boolean);
      const response = await supabase
        .from('transactions')
        .insert(createData)
        .select();

      if (response.error) throw new Error(response.error.message);
      results.push(...(response.data || []));
    }

    // Batch updates (done sequentially for data integrity)
    for (const op of updates) {
      if (op.id && op.data) {
        const updated = await transactionService.update(op.id, op.data);
        results.push(updated);
      }
    }

    // Batch deletes
    if (deletes.length > 0) {
      const deleteIds = deletes.map(op => op.id).filter(Boolean);
      const response = await supabase
        .from('transactions')
        .delete()
        .in('id', deleteIds);

      if (response.error) throw new Error(response.error.message);
    }

    return results;
  },

  // Type conversion helpers for CSV data
  convertFromCSV: (csvData: Record<string, unknown>): Omit<Transaction, 'id' | 'created_at' | 'updated_at'> => ({
    description: csvData.description as string,
    amount: parseFloat(csvData.amount as string),
    type: csvData.type as 'income' | 'expense' | 'transfer',
    category: csvData.category as string,
    date: csvData.date as string,
    user_id: csvData.user_id as string, // This needs to be populated during import
    account_id: csvData.account_id as string,
    to_account_id: (csvData.to_account_id as string) || null,
    frequency: (csvData.frequency as 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly') || undefined,
    recurring_series_id: (csvData.recurring_series_id as string) || undefined,
    group_id: (csvData.group_id as string) || undefined,
  }),
};

export const categoryService = {
  getAll: (): Promise<Category[]> => apiClient.getAll<Category>('categories'),
  getById: (id: string): Promise<Category> => apiClient.getById<Category>('categories', id),
  create: (category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> =>
    apiClient.create<Category>('categories', category),
  update: (id: string, category: Partial<Category>): Promise<Category> =>
    apiClient.update<Category>('categories', id, category),
  delete: (id: string): Promise<void> => apiClient.delete('categories', id),
};

export const budgetService = {
  getAll: (): Promise<Budget[]> => apiClient.getAll<Budget>('budgets'),
  getById: (id: string): Promise<Budget> => apiClient.getById<Budget>('budgets', id),
  getByUserId: (userId: string): Promise<Budget[]> => apiClient.getByUserId<Budget>('budgets', userId),
  create: (budget: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<Budget> =>
    apiClient.create<Budget>('budgets', budget),
  update: (id: string, budget: Partial<Budget>): Promise<Budget> =>
    apiClient.update<Budget>('budgets', id, budget),
  delete: (id: string): Promise<void> => apiClient.delete('budgets', id),

  // Advanced budget analytics methods
  getBudgetAnalysis: async (budgetId: string): Promise<{
    budget: Budget;
    currentPeriod: BudgetPeriod | null;
    categorySpending: Record<string, { spent: number; budgeted: number; remaining: number; percentage: number }>;
    totalSpent: number;
    totalBudgeted: number;
    remainingBudget: number;
    isOverBudget: boolean;
    daysRemaining: number;
  }> => {
    // Get budget details
    const budget = await budgetService.getById(budgetId);

    // Get current period
    const currentPeriod = await budgetPeriodService.getCurrentPeriod(budgetId);

    if (!currentPeriod) {
      return {
        budget,
        currentPeriod: null,
        categorySpending: {},
        totalSpent: 0,
        totalBudgeted: budget.amount,
        remainingBudget: budget.amount,
        isOverBudget: false,
        daysRemaining: 0
      };
    }

    // Get transactions for the period and categories
    const response = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('type', 'expense')
      .eq('user_id', budget.user_id)
      .gte('date', currentPeriod.start_date)
      .lte('date', currentPeriod.end_date)
      .in('category', budget.categories);

    if (response.error) throw new Error(response.error.message);

    const transactions = response.data || [];

    // Calculate category spending
    const categorySpending: Record<string, { spent: number; budgeted: number; remaining: number; percentage: number }> = {};
    const budgetPerCategory = budget.amount / budget.categories.length;

    budget.categories.forEach(category => {
      const spent = transactions
        .filter(t => t.category === category)
        .reduce((sum, t) => sum + t.amount, 0);

      const remaining = budgetPerCategory - spent;
      const percentage = budgetPerCategory > 0 ? (spent / budgetPerCategory) * 100 : 0;

      categorySpending[category] = {
        spent: Math.round(spent * 100) / 100,
        budgeted: budgetPerCategory,
        remaining: Math.round(remaining * 100) / 100,
        percentage: Math.round(percentage * 100) / 100
      };
    });

    const totalSpent = Math.round(transactions.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
    const remainingBudget = Math.round((budget.amount - totalSpent) * 100) / 100;
    const isOverBudget = totalSpent > budget.amount;

    // Calculate days remaining in period
    const endDate = new Date(currentPeriod.end_date || new Date());
    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    return {
      budget,
      currentPeriod,
      categorySpending,
      totalSpent,
      totalBudgeted: budget.amount,
      remainingBudget,
      isOverBudget,
      daysRemaining
    };
  },

  getBudgetsByUserWithStatus: async (userId: string): Promise<Array<Budget & {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'under_budget' | 'near_limit' | 'over_budget';
    currentPeriod: BudgetPeriod | null;
  }>> => {
    const budgets = await budgetService.getByUserId(userId);

    const budgetsWithStatus = await Promise.all(budgets.map(async (budget) => {
      const analysis = await budgetService.getBudgetAnalysis(budget.id);

      let status: 'under_budget' | 'near_limit' | 'over_budget' = 'under_budget';
      if (analysis.isOverBudget) {
        status = 'over_budget';
      } else if (analysis.totalSpent / analysis.totalBudgeted > 0.8) {
        status = 'near_limit';
      }

      return {
        ...budget,
        spent: analysis.totalSpent,
        remaining: analysis.remainingBudget,
        percentage: analysis.totalBudgeted > 0 ? (analysis.totalSpent / analysis.totalBudgeted) * 100 : 0,
        status,
        currentPeriod: analysis.currentPeriod
      };
    }));

    return budgetsWithStatus;
  }
};

export const recurringTransactionService = {
  getAll: (): Promise<RecurringTransactionSeries[]> => apiClient.getAll<RecurringTransactionSeries>('recurring_transactions'),
  getById: (id: string): Promise<RecurringTransactionSeries> => apiClient.getById<RecurringTransactionSeries>('recurring_transactions', id),
  getByUserId: (userId: string): Promise<RecurringTransactionSeries[]> => apiClient.getByUserId<RecurringTransactionSeries>('recurring_transactions', userId),

  getActive: async (userId?: string): Promise<RecurringTransactionSeries[]> => {
    let query = supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .eq('is_paused', false);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query.order('created_at', { ascending: false });

    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },

  getDueWithinDays: async (days: number, userId?: string): Promise<RecurringTransactionSeries[]> => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    let query = supabase
      .from('recurring_transactions')
      .select('*')
      .eq('is_active', true)
      .eq('is_paused', false)
      .lte('next_due_date', targetDate.toISOString());

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const response = await query.order('next_due_date', { ascending: true });

    if (response.error) throw new Error(response.error.message);
    return response.data || [];
  },

  pause: async (id: string, pauseUntil?: Date): Promise<RecurringTransactionSeries> => {
    const updateData: Partial<RecurringTransactionSeries> = {
      is_paused: true,
      pause_until: pauseUntil ? pauseUntil.toISOString() : null,
    };

    return apiClient.update<RecurringTransactionSeries>('recurring_transactions', id, updateData);
  },

  resume: async (id: string): Promise<RecurringTransactionSeries> => {
    const updateData: Partial<RecurringTransactionSeries> = {
      is_paused: false,
      pause_until: null,
    };

    return apiClient.update<RecurringTransactionSeries>('recurring_transactions', id, updateData);
  },

  execute: async (id: string): Promise<Transaction> => {
    const series = await recurringTransactionService.getById(id);

    // Create the transaction
    const newTransaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
      description: series.description,
      amount: series.amount,
      type: series.type,
      category: series.category,
      date: new Date().toISOString(),
      user_id: series.user_id,
      account_id: series.account_id,
      to_account_id: series.to_account_id,
      frequency: series.frequency,
      recurring_series_id: series.id,
      group_id: series.group_id,
    };

    const transaction = await transactionService.create(newTransaction);

    // Update the series execution stats and next due date
    const nextDueDate = calculateNextDueDate(series);
    await recurringTransactionService.update(id, {
      last_executed_date: new Date().toISOString(),
      total_executions: series.total_executions + 1,
      next_due_date: nextDueDate.toISOString(),
    });

    return transaction;
  },

  create: (recurringTransaction: Omit<RecurringTransactionSeries, 'id' | 'created_at' | 'updated_at'>): Promise<RecurringTransactionSeries> =>
    apiClient.create<RecurringTransactionSeries>('recurring_transactions', recurringTransaction),
  update: (id: string, recurringTransaction: Partial<RecurringTransactionSeries>): Promise<RecurringTransactionSeries> =>
    apiClient.update<RecurringTransactionSeries>('recurring_transactions', id, recurringTransaction),
  delete: (id: string): Promise<void> => apiClient.delete('recurring_transactions', id),

  // Advanced analytics and statistics methods
  getStats: async (userId?: string): Promise<{
    totalActiveSeries: number;
    totalExpenseSeries: number;
    totalIncomeSeries: number;
    totalMonthlyImpact: number;
    averageAmount: number;
    nextDueDateSeries: RecurringTransactionSeries[];
    overdueCount: number;
    upcomingCount: number;
  }> => {
    const series = await recurringTransactionService.getActive(userId);

    const stats = {
      totalActiveSeries: series.length,
      totalExpenseSeries: series.filter(s => s.type === 'expense').length,
      totalIncomeSeries: series.filter(s => s.type === 'income').length,
      totalMonthlyImpact: series.reduce((sum, s) => {
        // Convert all frequencies to monthly equivalent
        let monthlyAmount = s.amount;
        switch (s.frequency) {
          case 'weekly':
            monthlyAmount = s.amount * 4.33; // Average weeks per month
            break;
          case 'biweekly':
            monthlyAmount = s.amount * 2.17; // Average biweeks per month
            break;
          case 'yearly':
            monthlyAmount = s.amount / 12;
            break;
          // monthly stays as is
        }
        return sum + (s.type === 'expense' ? -monthlyAmount : monthlyAmount);
      }, 0),
      averageAmount: series.length > 0 ? series.reduce((sum, s) => sum + s.amount, 0) / series.length : 0,
      nextDueDateSeries: series
        .filter(s => s.next_due_date)
        .sort((a, b) => new Date(a.next_due_date).getTime() - new Date(b.next_due_date).getTime())
        .slice(0, 3),
      overdueCount: 0,
      upcomingCount: 0
    };

    // Calculate overdue and upcoming counts
    const now = new Date();
    series.forEach(s => {
      if (s.next_due_date) {
        const dueDate = new Date(s.next_due_date);
        if (dueDate < now) {
          stats.overdueCount++;
        } else if (dueDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000) { // Within 7 days
          stats.upcomingCount++;
        }
      }
    });

    return stats;
  },

  getReconciliation: async (seriesId: string): Promise<{
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
  }> => {
    const series = await recurringTransactionService.getById(seriesId);

    // Get all transactions created by this series
    const response = await supabase
      .from('transactions')
      .select('*')
      .eq('recurring_series_id', seriesId)
      .order('date', { ascending: false });

    if (response.error) throw new Error(response.error.message);

    const transactions = response.data || [];
    const totalPaid = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const expectedAmount = series.amount * series.total_executions;
    const missedPayments = series.total_executions - transactions.length;

    return {
      series,
      transactions,
      summary: {
        expectedExecutions: series.total_executions,
        actualExecutions: transactions.length,
        missedPayments,
        totalPaid,
        expectedTotal: expectedAmount,
        difference: totalPaid - expectedAmount,
        successRate: series.total_executions > 0
          ? (transactions.length / series.total_executions) * 100
          : 0
      }
    };
  },

  findMissedExecutions: async (): Promise<Array<{
    series: RecurringTransactionSeries;
    missedCount: number;
  }>> => {
    const activeSeries = await recurringTransactionService.getActive();
    const missedSeries = [];

    for (const series of activeSeries) {
      const reconciliation = await recurringTransactionService.getReconciliation(series.id);
      if (reconciliation.summary.missedPayments > 0) {
        missedSeries.push({
          series,
          missedCount: reconciliation.summary.missedPayments
        });
      }
    }

    return missedSeries;
  },

  // Optimized method for dashboard data
  getDashboardData: async (userId?: string): Promise<{
    activeSeries: RecurringTransactionSeries[];
    upcomingSeries: RecurringTransactionSeries[];
    overdueSeries: RecurringTransactionSeries[];
    monthlyImpact: { income: number; expenses: number; net: number };
  }> => {
    const series = await recurringTransactionService.getActive(userId);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingSeries = series.filter(s => {
      if (!s.next_due_date) return false;
      const dueDate = new Date(s.next_due_date);
      return dueDate >= now && dueDate <= weekFromNow;
    });

    const overdueSeries = series.filter(s => {
      if (!s.next_due_date) return false;
      const dueDate = new Date(s.next_due_date);
      return dueDate < now;
    });

    // Calculate monthly impact
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    series.forEach(s => {
      let monthlyAmount = s.amount;
      switch (s.frequency) {
        case 'weekly':
          monthlyAmount = s.amount * 4.33;
          break;
        case 'biweekly':
          monthlyAmount = s.amount * 2.17;
          break;
        case 'yearly':
          monthlyAmount = s.amount / 12;
          break;
      }

      if (s.type === 'income') {
        monthlyIncome += monthlyAmount;
      } else if (s.type === 'expense') {
        monthlyExpenses += monthlyAmount;
      }
    });

    return {
      activeSeries: series,
      upcomingSeries,
      overdueSeries,
      monthlyImpact: {
        income: Math.round(monthlyIncome * 100) / 100,
        expenses: Math.round(monthlyExpenses * 100) / 100,
        net: Math.round((monthlyIncome - monthlyExpenses) * 100) / 100
      }
    };
  }
};

// Helper function to calculate next due date
function calculateNextDueDate(series: RecurringTransactionSeries): Date {
  const currentDate = new Date(series.next_due_date);

  switch (series.frequency) {
    case 'weekly':
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    case 'biweekly':
      currentDate.setDate(currentDate.getDate() + 14);
      break;
    case 'monthly':
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (series.day_of_month) {
        currentDate.setDate(series.day_of_month);
      }
      break;
    case 'yearly':
      currentDate.setFullYear(currentDate.getFullYear() + 1);
      if (series.month_of_year && series.day_of_month) {
        currentDate.setMonth(series.month_of_year - 1);
        currentDate.setDate(series.day_of_month);
      }
      break;
    default:
      // For 'once', don't update the date
      break;
  }

  return currentDate;
}

// Investment holdings service (if needed)
export const investmentService = {
  getAll: (): Promise<InvestmentHolding[]> => {
    // This would need to be implemented based on your investment holdings table
    // For now, return empty array
    return Promise.resolve([]);
  },
  getById: (): Promise<InvestmentHolding> => {
    throw new Error('Investment holdings not implemented yet');
  },
  getByUserId: (): Promise<InvestmentHolding[]> => {
    return Promise.resolve([]);
  },
  create: (): Promise<InvestmentHolding> => {
    throw new Error('Investment holdings not implemented yet');
  },
  update: (): Promise<InvestmentHolding> => {
    throw new Error('Investment holdings not implemented yet');
  },
  delete: (): Promise<void> => {
    throw new Error('Investment holdings not implemented yet');
  },
};

// Utility function to call Supabase functions
export const callSupabaseFunction = async <T>(
  functionName: string,
  args: Record<string, unknown>
): Promise<T> => {
  const response = await supabase.rpc(functionName, args);

  if (response.error) {
    throw new Error(`Supabase function error: ${response.error.message}`);
  }

  return response.data;
};

// Examples of using Supabase functions
export const analyticsService = {
  getTransactionsByUser: (userId: string, filters?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
    accountId?: string;
  }): Promise<Transaction[]> =>
    callSupabaseFunction('get_transactions_by_user', {
      p_user_id: userId,
      p_limit: filters?.limit || 50,
      p_offset: filters?.offset || 0,
      p_start_date: filters?.startDate || null,
      p_end_date: filters?.endDate || null,
      p_category: filters?.category || null,
      p_type: filters?.type || null,
      p_account_id: filters?.accountId || null,
    }),

  getAccountBalance: async (accountId: string, endDate?: string): Promise<number> => {
    try {
      const supabase = getSupabaseClient();

      // Calculate balance manually by summing transactions
      const query = supabase
        .from('transactions')
        .select('amount, type, account_id, to_account_id')
        .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`);

      if (endDate) {
        query.lte('date', endDate);
      }

      const { data: transactions, error } = await query;

      if (error) throw error;

      let balance = 0;
      transactions?.forEach(transaction => {
        if (transaction.account_id === accountId) {
          // Money going out (expense) or in (income) from this account
          if (transaction.type === 'expense') {
            balance -= transaction.amount;
          } else if (transaction.type === 'income') {
            balance += transaction.amount;
          } else if (transaction.type === 'transfer') {
            balance -= transaction.amount; // Money leaving this account
          }
        } else if (transaction.to_account_id === accountId) {
          // Money coming into this account (transfer)
          balance += transaction.amount;
        }
      });

      return balance;
    } catch (error) {
      console.error('Error calculating account balance:', error);
      return 0;
    }
  },

  getMonthlySpendingByCategory: (userId: string, year: number, month: number) =>
    callSupabaseFunction('get_monthly_spending_by_category', {
      p_user_id: userId,
      p_year: year,
      p_month: month,
    }),
};

// Budget periods service (from user's budget_periods JSONB field)
export const budgetPeriodService = {
  getAll: async (): Promise<BudgetPeriod[]> => {
    // Get all budget periods from all users
    const users = await userService.getAll();
    return users.flatMap(user => user.budget_periods || []);
  },

  getByUserId: async (userId: string): Promise<BudgetPeriod[]> => {
    const user = await userService.getById(userId);
    return user.budget_periods || [];
  },

  getCurrentPeriod: async (userId: string): Promise<BudgetPeriod | null> => {
    const periods = await budgetPeriodService.getByUserId(userId);
    return periods.find(p => p.is_active) || null;
  },

  getActivePeriods: async (userId: string): Promise<BudgetPeriod[]> => {
    const periods = await budgetPeriodService.getByUserId(userId);
    return periods.filter(p => p.is_active);
  },

  create: async (userId: string, budgetPeriod: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetPeriod> => {
    const user = await userService.getById(userId);
    const newBudgetPeriod: BudgetPeriod = {
      ...budgetPeriod,
      id: generateId('bdp'),
      ...generateTimestamps(),
    };

    const updatedBudgetPeriods = [...(user.budget_periods || []), newBudgetPeriod];
    await userService.update(userId, { budget_periods: updatedBudgetPeriods });

    return newBudgetPeriod;
  },

  update: async (userId: string, budgetPeriodId: string, updates: Partial<BudgetPeriod>): Promise<BudgetPeriod> => {
    const user = await userService.getById(userId);
    const budgetPeriods = user.budget_periods || [];
    const index = budgetPeriods.findIndex(bp => bp.id === budgetPeriodId);

    if (index === -1) {
      throw new Error(`Budget period ${budgetPeriodId} not found`);
    }

    const updatedBudgetPeriod = {
      ...budgetPeriods[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const updatedBudgetPeriods = [...budgetPeriods];
    updatedBudgetPeriods[index] = updatedBudgetPeriod;

    await userService.update(userId, { budget_periods: updatedBudgetPeriods });

    return updatedBudgetPeriod;
  },

  delete: async (userId: string, budgetPeriodId: string): Promise<void> => {
    const user = await userService.getById(userId);
    const updatedBudgetPeriods = (user.budget_periods || []).filter(bp => bp.id !== budgetPeriodId);

    await userService.update(userId, { budget_periods: updatedBudgetPeriods });
  },

  startNewPeriod: async (userId: string): Promise<BudgetPeriod> => {
    // End current period first
    const currentPeriod = await budgetPeriodService.getCurrentPeriod(userId);
    if (currentPeriod) {
      await budgetPeriodService.update(userId, currentPeriod.id, {
        is_active: false,
        end_date: new Date().toISOString()
      });
    }

    // Create new period
    const newPeriod: Omit<BudgetPeriod, 'id' | 'created_at' | 'updated_at'> = {
      user_id: userId,
      start_date: new Date().toISOString(),
      end_date: null,
      total_spent: 0,
      total_saved: 0,
      category_spending: {},
      is_active: true,
    };

    return budgetPeriodService.create(userId, newPeriod);
  },

  endCurrentPeriod: async (userId: string): Promise<BudgetPeriod | null> => {
    const currentPeriod = await budgetPeriodService.getCurrentPeriod(userId);
    if (!currentPeriod) return null;

    return budgetPeriodService.update(userId, currentPeriod.id, {
      is_active: false,
      end_date: new Date().toISOString()
    });
  },
};

// API helpers for common operations
export const apiHelpers = {
  getCurrentUser: async (): Promise<User> => {
    // This would typically use authentication context
    // For now, return the first user as a placeholder
    const users = await userService.getAll();
    if (users.length === 0) {
      throw new Error('No users found');
    }
    return users[0];
  },

  getCurrentUserId: async (): Promise<string> => {
    const user = await apiHelpers.getCurrentUser();
    return user.id;
  },

  getTransactionsForCurrentUser: async (): Promise<Transaction[]> => {
    const userId = await apiHelpers.getCurrentUserId();
    return transactionService.getByUserId(userId);
  },

  getTransactionsWithFilters: async (filters?: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    category?: string;
    type?: string;
    accountId?: string;
  }): Promise<Transaction[]> => {
    const userId = filters?.userId || await apiHelpers.getCurrentUserId();

    if (filters?.startDate || filters?.endDate) {
      return transactionService.getByDateRange(
        filters.startDate || '1900-01-01',
        filters.endDate || '2100-12-31',
        userId
      );
    }

    let transactions = await transactionService.getByUserId(userId);

    if (filters?.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }

    if (filters?.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }

    if (filters?.accountId) {
      transactions = transactions.filter(t => t.account_id === filters.accountId);
    }

    return transactions;
  },

  getAccountsForCurrentUser: async (): Promise<Account[]> => {
    const userId = await apiHelpers.getCurrentUserId();
    return accountService.getByUserId(userId);
  },

  getBudgetsForCurrentUser: async (): Promise<Budget[]> => {
    const userId = await apiHelpers.getCurrentUserId();
    return budgetService.getByUserId(userId);
  },
};