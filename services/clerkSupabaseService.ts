/**
 * Clerk-Supabase Integration Service
 * Bridges Clerk authentication with Supabase database using official Clerk integration
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/database.types';
import { Account, Budget, CategoryOption, InvestmentHolding, Person, Transaction } from '../types';

export class ClerkSupabaseService {
  private client: SupabaseClient<Database>;

  constructor(client: SupabaseClient<Database>) {
    this.client = client;
  }

  // People
  async getPeople(): Promise<Person[]> {
    const { data, error } = await this.client
      .from('people')
      .select('*')
      .order('name');

    if (error) throw new Error(`Errore caricamento persone: ${error.message}`);

    return (data || []).map(person => ({
      id: person.id,
      name: person.name,
      avatar: person.avatar || '',
      themeColor: person.theme_color,
      budgetStartDate: person.budget_start_date.toString(),
    }));
  }

  async updatePerson(person: Person): Promise<Person> {
    const { data, error } = await this.client
      .from('people')
      .update({
        name: person.name,
        avatar: person.avatar,
        theme_color: person.themeColor,
        budget_start_date: parseInt(person.budgetStartDate),
      })
      .eq('id', person.id)
      .select()
      .single();

    if (error) throw new Error(`Errore aggiornamento persona: ${error.message}`);

    return {
      id: data.id,
      name: data.name,
      avatar: data.avatar || '',
      themeColor: data.theme_color,
      budgetStartDate: data.budget_start_date.toString(),
    };
  }

  // Accounts
async getAccounts(): Promise<Account[]> {
    const { data, error } = await this.client
      .from('accounts')
      .select('*')
      .order('name');

    if (error) throw new Error(`Errore caricamento account: ${error.message}`);

    return (data || []).map(account => {
      // Parse person_ids safely from potentially malformed JSON
      let personIds: string[] = [];
      try {
        if (account.person_ids) {
          // Handle different formats that might come from database
          if (Array.isArray(account.person_ids)) {
            personIds = account.person_ids;
          } else if (typeof account.person_ids === 'string') {
            // Clean up malformed JSON strings
            let cleanJson = account.person_ids;
            // Remove extra quotes and brackets
            cleanJson = cleanJson.replace(/^"/, '').replace(/"$/, '');
            cleanJson = cleanJson.replace(/}]$/, ']');
            cleanJson = cleanJson.replace(/^{/, '[');
            cleanJson = cleanJson.replace(/\\"/g, '"');
            
            personIds = JSON.parse(cleanJson);
          }
        }
      } catch (error) {
        console.error(`Error parsing person_ids for account ${account.name}:`, account.person_ids, error);
        personIds = [];
      }

      return {
        id: account.id,
        name: account.name,
        type: account.type,
        balance: parseFloat(account.balance || '0'),
        personIds: personIds,
      };
    });
  }

  async addAccount(account: Omit<Account, 'id'>): Promise<Account> {
    const { data, error } = await this.client
      .from('accounts')
      .insert({
        name: account.name,
        type: account.type,
        balance: account.balance,
        person_ids: account.personIds,
      })
      .select()
      .single();

    if (error) throw new Error(`Errore aggiunta account: ${error.message}`);

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance || '0'),
      personIds: data.person_ids || [],
    };
  }

  async updateAccount(account: Account): Promise<Account> {
    const { data, error } = await this.client
      .from('accounts')
      .update({
        name: account.name,
        type: account.type,
        balance: account.balance,
        person_ids: account.personIds,
      })
      .eq('id', account.id)
      .select()
      .single();

    if (error) throw new Error(`Errore aggiornamento account: ${error.message}`);

    return {
      id: data.id,
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance || '0'),
      personIds: data.person_ids || [],
    };
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw new Error(`Errore caricamento transazioni: ${error.message}`);

    return (data || []).map(tx => ({
      id: tx.id,
      description: tx.description,
      amount: parseFloat(tx.amount),
      date: tx.date,
      type: tx.type,
      category: tx.category,
      accountId: tx.account_id,
      toAccountId: tx.to_account_id,
      isReconciled: tx.is_reconciled || false,
      linkedTransactionId: tx.parent_transaction_id,
      createdAt: tx.created_at,
    }));
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .insert({
        id: transaction.id,
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        account_id: transaction.accountId,
        to_account_id: transaction.toAccountId,
        is_reconciled: transaction.isReconciled,
        parent_transaction_id: transaction.linkedTransactionId,
      })
      .select()
      .single();

    if (error) throw new Error(`Errore aggiunta transazione: ${error.message}`);

    return {
      id: data.id,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      type: data.type,
      category: data.category,
      accountId: data.account_id,
      toAccountId: data.to_account_id,
      isReconciled: data.is_reconciled || false,
      linkedTransactionId: data.parent_transaction_id,
      createdAt: data.created_at,
    };
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await this.client
      .from('transactions')
      .update({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        account_id: transaction.accountId,
        to_account_id: transaction.toAccountId,
        is_reconciled: transaction.isReconciled,
        parent_transaction_id: transaction.linkedTransactionId,
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (error) throw new Error(`Errore aggiornamento transazione: ${error.message}`);

    return {
      id: data.id,
      description: data.description,
      amount: parseFloat(data.amount),
      date: data.date,
      type: data.type,
      category: data.category,
      accountId: data.account_id,
      toAccountId: data.to_account_id,
      isReconciled: data.is_reconciled || false,
      linkedTransactionId: data.parent_transaction_id,
      createdAt: data.created_at,
    };
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await this.client
      .from('budgets')
      .select('*')
      .order('description');

    if (error) throw new Error(`Errore caricamento budget: ${error.message}`);

    return (data || []).map(budget => ({
      id: budget.id,
      description: budget.description,
      categories: budget.categories || [],
      amount: parseFloat(budget.amount),
      period: budget.period,
      personId: budget.person_id,
    }));
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    const { data, error } = await this.client
      .from('budgets')
      .insert({
        description: budget.description,
        categories: budget.categories,
        amount: budget.amount,
        period: budget.period,
        person_id: budget.personId,
      })
      .select()
      .single();

    if (error) throw new Error(`Errore aggiunta budget: ${error.message}`);

    return {
      id: data.id,
      description: data.description,
      categories: data.categories || [],
      amount: parseFloat(data.amount),
      period: data.period,
      personId: data.person_id,
    };
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    const { data, error } = await this.client
      .from('budgets')
      .update({
        description: budget.description,
        categories: budget.categories,
        amount: budget.amount,
        period: budget.period,
        person_id: budget.personId,
      })
      .eq('id', budget.id)
      .select()
      .single();

    if (error) throw new Error(`Errore aggiornamento budget: ${error.message}`);

    return {
      id: data.id,
      description: data.description,
      categories: data.categories || [],
      amount: parseFloat(data.amount),
      period: data.period,
      personId: data.person_id,
    };
  }

  // Categories
  async getCategories(): Promise<CategoryOption[]> {
    const { data, error } = await this.client
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw new Error(`Errore caricamento categorie: ${error.message}`);

    return (data || []).map(category => ({
      id: category.id,
      name: category.name,
      label: category.label,
    }));
  }

  // Investments (placeholder - da implementare se necessario)
  async getInvestments(): Promise<InvestmentHolding[]> {
    // Per ora ritorniamo un array vuoto
    return [];
  }

  async addInvestment(investment: InvestmentHolding): Promise<InvestmentHolding> {
    // Per ora ritorniamo l'investimento così com'è
    return investment;
  }
}
