/**
 * Clerk-Supabase Integration Service (Refactored)
 * Implementa il Service Layer ottimizzato seguendo i principi SOLID e DRY
 * 
 * Questo servizio sostituisce il vecchio ClerkSupabaseService fornendo:
 * - Separazione delle responsabilità
 * - Eliminazione della duplicazione di codice
 * - Migliore gestione degli errori
 * - Interfaccia pulita per l'integrazione Clerk-Supabase
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Account, Budget, CategoryOption, InvestmentHolding, Person, Transaction } from '../../../types';
import type { Database } from '../types/database.types';
import { FinanceService } from './finance.service';

export class ClerkSupabaseService {
  private financeService: FinanceService;

  constructor(
    private client: SupabaseClient<Database>,
    private userId?: string // User ID da Clerk per l'isolamento dati
  ) {
    this.financeService = new FinanceService(client, userId);
  }

  /**
   * Carica tutti i dati necessari per l'applicazione
   */
  async loadAllData() {
    try {
      return await this.financeService.loadAllData();
    } catch (error) {
      throw new Error(`Errore nel caricamento dei dati: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * PEOPLE OPERATIONS
   */
  async getPeople(): Promise<Person[]> {
    try {
      return await this.financeService.people.getAll();
    } catch (error) {
      throw new Error(`Errore caricamento persone: ${this.getErrorMessage(error)}`);
    }
  }

  async updatePerson(person: Person): Promise<Person> {
    try {
      return await this.financeService.people.update(person.id, person);
    } catch (error) {
      throw new Error(`Errore aggiornamento persona: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * ACCOUNT OPERATIONS
   */
  async getAccounts(): Promise<Account[]> {
    try {
      return await this.financeService.accounts.getAll();
    } catch (error) {
      throw new Error(`Errore caricamento account: ${this.getErrorMessage(error)}`);
    }
  }

  async addAccount(account: Omit<Account, 'id'>): Promise<Account> {
    try {
      return await this.financeService.accounts.createAccount(account);
    } catch (error) {
      throw new Error(`Errore aggiunta account: ${this.getErrorMessage(error)}`);
    }
  }

  async updateAccount(account: Account): Promise<Account> {
    try {
      return await this.financeService.accounts.update(account.id, account);
    } catch (error) {
      throw new Error(`Errore aggiornamento account: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * TRANSACTION OPERATIONS
   */
  async getTransactions(): Promise<Transaction[]> {
    try {
      return await this.financeService.transactions.getAll();
    } catch (error) {
      throw new Error(`Errore caricamento transazioni: ${this.getErrorMessage(error)}`);
    }
  }

  async addTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      return await this.financeService.transactions.create(transaction);
    } catch (error) {
      throw new Error(`Errore aggiunta transazione: ${this.getErrorMessage(error)}`);
    }
  }

  async updateTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      return await this.financeService.transactions.update(transaction.id, transaction);
    } catch (error) {
      throw new Error(`Errore aggiornamento transazione: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * BUDGET OPERATIONS
   */
  async getBudgets(): Promise<Budget[]> {
    try {
      return await this.financeService.budgets.getAll();
    } catch (error) {
      throw new Error(`Errore caricamento budget: ${this.getErrorMessage(error)}`);
    }
  }

  async addBudget(budget: Omit<Budget, 'id'>): Promise<Budget> {
    try {
      return await this.financeService.budgets.createBudget(budget);
    } catch (error) {
      throw new Error(`Errore aggiunta budget: ${this.getErrorMessage(error)}`);
    }
  }

  async updateBudget(budget: Budget): Promise<Budget> {
    try {
      return await this.financeService.budgets.update(budget.id, budget);
    } catch (error) {
      throw new Error(`Errore aggiornamento budget: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * CATEGORY OPERATIONS
   */
  async getCategories(): Promise<CategoryOption[]> {
    try {
      return await this.financeService.categories.getAll();
    } catch (error) {
      throw new Error(`Errore caricamento categorie: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * INVESTMENT OPERATIONS (placeholder)
   */
  async getInvestments(): Promise<InvestmentHolding[]> {
    // Per ora ritorniamo un array vuoto - da implementare se necessario
    return [];
  }

  async addInvestment(investment: InvestmentHolding): Promise<InvestmentHolding> {
    // Per ora ritorniamo l'investimento così com'è - da implementare se necessario
    return investment;
  }

  /**
   * ADVANCED OPERATIONS
   */

  /**
   * Ottiene dati per una persona specifica
   */
  async getPersonData(personId: string) {
    try {
      return await this.financeService.loadPersonData(personId);
    } catch (error) {
      throw new Error(`Errore caricamento dati persona: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Ottiene statistiche per una persona
   */
  async getPersonStats(personId: string) {
    try {
      return await this.financeService.getPersonStats(personId);
    } catch (error) {
      throw new Error(`Errore calcolo statistiche persona: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Ottiene transazioni arricchite con informazioni aggiuntive
   */
  async getEnrichedTransactions() {
    try {
      return await this.financeService.getEnrichedTransactions();
    } catch (error) {
      throw new Error(`Errore caricamento transazioni arricchite: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Calcola il bilancio calcolato per un account
   */
  async getCalculatedBalance(accountId: string): Promise<number> {
    try {
      const account = await this.financeService.accounts.getById(accountId);
      if (!account) {
        throw new Error('Account non trovato');
      }

      const transactions = await this.financeService.transactions.getTransactionsByAccount(accountId);
      return this.financeService.calculateAccountBalance(account, transactions);
    } catch (error) {
      throw new Error(`Errore calcolo bilancio: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Utility per l'estrazione di messaggi di errore
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Accesso diretto ai servizi specifici per operazioni avanzate
   */
  get services() {
    return {
      accounts: this.financeService.accounts,
      budgets: this.financeService.budgets,
      categories: this.financeService.categories,
      people: this.financeService.people,
      transactions: this.financeService.transactions,
    };
  }
}
