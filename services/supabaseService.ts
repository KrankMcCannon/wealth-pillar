import { getSupabaseClient } from '../lib/supabase/client';
import { Account, Budget, CategoryOption, InvestmentHolding, Person, Transaction } from '../types';

export class SupabaseService {
  private supabase = getSupabaseClient();

  // People
  async getPeople(): Promise<Person[]> {
    const { data, error } = await this.supabase
      .from('people')
      .select('*')
      .order('name');
    
    if (error) throw new Error(`Errore caricamento persone: ${error.message}`);
    
    // Converti da formato DB a formato app
    return (data || []).map(person => ({
      id: person.id,
      name: person.name,
      avatar: person.avatar || '',
      themeColor: person.theme_color,
      budgetStartDate: person.budget_start_date.toString(),
    }));
  }

  async updatePerson(person: Person): Promise<Person> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('accounts')
      .select('*')
      .order('name');
    
    if (error) throw new Error(`Errore caricamento account: ${error.message}`);
    
    return (data || []).map(account => ({
      id: account.id,
      name: account.name,
      type: account.type,
      balance: parseFloat(account.balance || '0'),
      personIds: account.person_ids || [],
    }));
  }

  async addAccount(account: Omit<Account, 'id'>): Promise<Account> {
    const { data, error } = await this.supabase
      .from('accounts')
      .insert({
        name: account.name,
        type: account.type,
        balance: account.balance,
        person_ids: account.personIds,
      })
      .select()
      .single();
    
    if (error) throw new Error(`Errore creazione account: ${error.message}`);
    
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance || '0'),
      personIds: data.person_ids || [],
    };
  }

  async updateAccount(account: Account): Promise<Account> {
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw new Error(`Errore caricamento transazioni: ${error.message}`);
    
    return (data || []).map(transaction => ({
      id: transaction.id,
      description: transaction.description,
      amount: parseFloat(transaction.amount),
      date: transaction.date,
      type: transaction.type,
      category: transaction.category,
      accountId: transaction.account_id,
      toAccountId: transaction.to_account_id,
      isReconciled: transaction.is_reconciled || false,
      linkedTransactionId: transaction.parent_transaction_id,
      createdAt: transaction.created_at,
    }));
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        account_id: transaction.accountId,
        to_account_id: transaction.toAccountId,
        is_reconciled: transaction.isReconciled || false,
        parent_transaction_id: transaction.linkedTransactionId,
      })
      .select()
      .single();
    
    if (error) throw new Error(`Errore creazione transazione: ${error.message}`);
    
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
    const { data, error } = await this.supabase
      .from('transactions')
      .update({
        description: transaction.description,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        category: transaction.category,
        account_id: transaction.accountId,
        to_account_id: transaction.toAccountId,
        is_reconciled: transaction.isReconciled || false,
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
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
    
    if (error) throw new Error(`Errore creazione budget: ${error.message}`);
    
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
    const { data, error } = await this.supabase
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
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');
    
    if (error) throw new Error(`Errore caricamento categorie: ${error.message}`);
    
    return (data || []).map(category => ({
      id: category.name, // Usiamo il name come ID per compatibilità
      name: category.name,
    }));
  }

  // Investments (placeholder - da implementare se necessario)
  async getInvestments(): Promise<InvestmentHolding[]> {
    // Per ora restituiamo array vuoto
    // In futuro puoi creare una tabella investments se necessario
    return [];
  }

  async addInvestment(investment: Omit<InvestmentHolding, 'id'>): Promise<InvestmentHolding> {
    // Placeholder per compatibilità
    throw new Error('Investments non ancora implementati in Supabase');
  }

  // Link transactions
  async linkTransactions(tx1Id: string, tx2Id: string): Promise<void> {
    const { error } = await this.supabase
      .from('transactions')
      .update({ parent_transaction_id: tx1Id })
      .eq('id', tx2Id);
    
    if (error) throw new Error(`Errore collegamento transazioni: ${error.message}`);
  }
}

export const supabaseService = new SupabaseService();
