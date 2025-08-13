import { Account, Budget, CategoryOption, InvestmentHolding, Person, Transaction } from '../types';

const API_BASE_URL = 'http://localhost:3001';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // People
  async getPeople(): Promise<Person[]> {
    return this.request<Person[]>('/people');
  }

  async updatePerson(person: Person): Promise<Person> {
    return this.request<Person>(`/people/${person.id}`, {
      method: 'PUT',
      body: JSON.stringify(person),
    });
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return this.request<Account[]>('/accounts');
  }

  async addAccount(account: Account): Promise<Account> {
    return this.request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateAccount(account: Account): Promise<Account> {
    return this.request<Account>(`/accounts/${account.id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return this.request<Transaction[]>('/transactions?_sort=date&_order=desc');
  }

  async addTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    return this.request<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    return this.request<Transaction>(`/transactions/${transaction.id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return this.request<Budget[]>('/budgets');
  }

  async addBudget(budget: Budget): Promise<Budget> {
    return this.request<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    return this.request<Budget>(`/budgets/${budget.id}`, {
      method: 'PUT',
      body: JSON.stringify(budget),
    });
  }

  // Investments
  async getInvestments(): Promise<InvestmentHolding[]> {
    return this.request<InvestmentHolding[]>('/investments');
  }

  async addInvestment(investment: Omit<InvestmentHolding, 'id'>): Promise<InvestmentHolding> {
    return this.request<InvestmentHolding>('/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
  }

  // Categories
  async getCategories(): Promise<CategoryOption[]> {
    return this.request<CategoryOption[]>('/categories');
  }
}

export const apiService = new ApiService();
