/**
 * Finance Service Aggregator
 * Implementa il Facade Pattern per fornire un'interfaccia unificata
 * Segue il principio di Single Responsibility aggregando i servizi specifici
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { CategoryUtils } from '../../../lib/utils/category.utils';
import { TransactionUtils } from '../../../lib/utils/transaction.utils';
import type { Database } from '../types/database.types';

// Repositories
import { AccountRepository } from '../repositories/account.repository';
import { BudgetRepository } from '../repositories/budget.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { PersonRepository } from '../repositories/person.repository';
import { TransactionRepository } from '../repositories/transaction.repository';

// Services
import { AccountService } from './account.service';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { PersonService } from './person.service';
import { TransactionService } from './transaction.service';

// Types
import { Account, Budget, InvestmentHolding, Person, Transaction } from '../../../types';

export class FinanceService {
  // Service instances private
  private readonly _accounts: AccountService;
  private readonly _budgets: BudgetService;
  private readonly _categories: CategoryService;
  private readonly _people: PersonService;
  private readonly _transactions: TransactionService;
  private userGroupId: string | null = null;

  constructor(
    private supabaseClient: SupabaseClient<Database>,
    private userId?: string // User ID fornito da Clerk per l'isolamento dati
  ) {
    // Initialize repositories con supporto per filtri di gruppo
    const accountRepo = new AccountRepository();
    const budgetRepo = new BudgetRepository();
    const categoryRepo = new CategoryRepository();
    const personRepo = new PersonRepository();
    const transactionRepo = new TransactionRepository();

    // Initialize services con repositories configurati
    this._accounts = new AccountService(accountRepo);
    this._budgets = new BudgetService(budgetRepo);
    this._categories = new CategoryService(categoryRepo);
    this._people = new PersonService(personRepo);
    this._transactions = new TransactionService(transactionRepo);

    // Initialize user group context if userId is provided
    if (this.userId) {
      this.initializeUserContext();
    }
  }

  /**
   * Inizializza il contesto utente recuperando il group_id
   */
  private async initializeUserContext(): Promise<void> {
    if (!this.userId) return;

    try {
      // Recupera il gruppo dell'utente corrente
      const { data: group, error } = await this.supabaseClient
        .from('groups')
        .select('id')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.warn('No active group found for user:', this.userId);
        this.userGroupId = null;
        return;
      }

      this.userGroupId = group.id;
    } catch (error) {
      console.error('Error initializing user context:', error);
      this.userGroupId = null;
    }
  }

  /**
   * Recupera il group_id dell'utente corrente
   */
  async getUserGroupId(): Promise<string | null> {
    if (!this.userId) return null;
    
    if (this.userGroupId === null) {
      await this.initializeUserContext();
    }
    
    return this.userGroupId;
  }

  /**
   * Override dei metodi base per utilizzare automaticamente il filtro di gruppo
   */

  /**
   * Override del metodo people.getAll() per filtrare per gruppo
   */
  get people() {
    const originalService = this._people;
    return {
      // Metodi esistenti del service mantenendo il contesto
      getAll: async () => this.getPeopleByUserGroup(),
      getById: (id: string) => originalService.getById(id),
      create: (entity: Omit<Person, 'id' | 'created_at' | 'updated_at'>) => originalService.create(entity),
      update: (id: string, entity: Partial<Person>) => originalService.update(id, entity),
      delete: (id: string) => originalService.delete(id),
      findByFilters: (filters: any) => originalService.findByFilters(filters),
      // Metodi specifici del PersonService
      createPerson: (personData: Omit<Person, 'id'>) => originalService.createPerson(personData),
      searchByName: (name: string) => originalService.searchByName(name)
    };
  }

  /**
   * Override del metodo accounts.getAll() per filtrare per gruppo
   */
  get accounts() {
    const originalService = this._accounts;
    return {
      // Metodi esistenti del service mantenendo il contesto
      getAll: async () => this.getAccountsByUserGroup(),
      getById: (id: string) => originalService.getById(id),
      create: (entity: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => originalService.create(entity),
      update: (id: string, entity: Partial<Account>) => originalService.update(id, entity),
      delete: (id: string) => originalService.delete(id),
      findByFilters: (filters: any) => originalService.findByFilters(filters),
      // Metodi specifici del AccountService
      createAccount: (accountData: Omit<Account, 'id'>) => originalService.createAccount(accountData),
      getAccountsByPerson: (personId: string) => originalService.getAccountsByPerson(personId),
      getAccountsByType: (type: Account['type']) => originalService.getAccountsByType(type),
      getTotalBalanceForPerson: (personId: string) => originalService.getTotalBalanceForPerson(personId)
    };
  }

  /**
   * Override del metodo transactions.getAll() per filtrare per gruppo
   */
  get transactions() {
    const originalService = this._transactions;
    return {
      // Metodi esistenti del service mantenendo il contesto
      getAll: async () => this.getTransactionsByUserGroup(),
      getById: (id: string) => originalService.getById(id),
      create: (entity: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => originalService.create(entity),
      update: (id: string, entity: Partial<Transaction>) => originalService.update(id, entity),
      delete: (id: string) => originalService.delete(id),
      findByFilters: (filters: any) => originalService.findByFilters(filters),
      // Metodi specifici del TransactionService
      createTransaction: (transactionData: Omit<Transaction, 'id' | 'createdAt'>) => originalService.createTransaction(transactionData),
      getTransactionsByAccount: (accountId: string) => originalService.getTransactionsByAccount(accountId),
      getTransactionsByCategory: (category: string) => originalService.getTransactionsByCategory(category),
      getTransactionsByDateRange: (startDate: string, endDate: string) => originalService.getTransactionsByDateRange(startDate, endDate),
      linkTransactions: (tx1Id: string, tx2Id: string) => originalService.linkTransactions(tx1Id, tx2Id),
      unlinkTransactions: (txId: string) => originalService.unlinkTransactions(txId),
      // Metodi di utility per calcoli
      getEffectiveAmount: (transaction: Transaction, linkedTransaction?: Transaction) => originalService.getEffectiveAmount(transaction, linkedTransaction),
      isParentTransaction: (transaction: Transaction, linkedTransaction?: Transaction) => originalService.isParentTransaction(transaction, linkedTransaction)
    };
  }

  /**
   * Override del metodo budgets.getAll() per filtrare per gruppo
   */
  get budgets() {
    const originalService = this._budgets;
    return {
      // Metodi esistenti del service mantenendo il contesto
      getAll: async () => this.getBudgetsByUserGroup(),
      getById: (id: string) => originalService.getById(id),
      create: (entity: Omit<Budget, 'id' | 'created_at' | 'updated_at'>) => originalService.create(entity),
      update: (id: string, entity: Partial<Budget>) => originalService.update(id, entity),
      delete: (id: string) => originalService.delete(id),
      findByFilters: (filters: any) => originalService.findByFilters(filters),
      // Metodi specifici del BudgetService
      createBudget: (budgetData: Omit<Budget, 'id'>) => originalService.createBudget(budgetData),
      getBudgetsByPerson: (personId: string) => originalService.getBudgetsByPerson(personId),
      getBudgetsByPeriod: (period: Budget['period']) => originalService.getBudgetsByPeriod(period),
      getTotalBudgetForPerson: (personId: string) => originalService.getTotalBudgetForPerson(personId)
    };
  }

  /**
   * Getter per categories (non filtrato per gruppo)
   */
  get categories() {
    return this._categories;
  }
  
  /**
   * Ottiene tutti i people del gruppo dell'utente
   */
  async getPeopleByUserGroup(): Promise<Person[]> {
    const groupId = await this.getUserGroupId();
    if (!groupId) return [];
    
    return this._people.findByFilters({ groupId });
  }

  /**
   * Ottiene tutti gli account del gruppo dell'utente
   */
  async getAccountsByUserGroup(): Promise<Account[]> {
    const groupId = await this.getUserGroupId();
    if (!groupId) return [];
    
    return this._accounts.findByFilters({ groupId });
  }

  /**
   * Ottiene tutte le transazioni del gruppo dell'utente
   */
  async getTransactionsByUserGroup(): Promise<Transaction[]> {
    const groupId = await this.getUserGroupId();
    if (!groupId) return [];
    
    return this._transactions.findByFilters({ groupId });
  }

  /**
   * Ottiene tutti i budget del gruppo dell'utente
   */
  async getBudgetsByUserGroup(): Promise<Budget[]> {
    const groupId = await this.getUserGroupId();
    if (!groupId) return [];
    
    return this._budgets.findByFilters({ groupId });
  }

  /**
   * Metodi di convenienza per operazioni comuni filtrate per utente
   */

  /**
   * Carica tutti i dati necessari per l'applicazione filtrati per gruppo utente
   */
  async loadAllData() {
    if (!this.userId) {
      // Se non c'è utente autenticato, restituisce dati vuoti
      return {
        people: [],
        accounts: [],
        transactions: [],
        budgets: [],
        investments: [],
        categories: []
      };
    }

    // Carica tutti i dati filtrati per gruppo
    const [people, accounts, transactions, budgets, investments, categories] = await Promise.all([
      this.getPeopleByUserGroup(),
      this.getAccountsByUserGroup(),
      this.getTransactionsByUserGroup(),
      this.getBudgetsByUserGroup(),
      this.getInvestments(),
      this.categories.getAll(), // Le categorie non sono filtrate per gruppo
    ]);

    return {
      people,
      accounts,
      transactions: TransactionUtils.sortByDateDesc(transactions),
      budgets,
      investments,
      categories
    };
  }

  /**
   * Placeholder method for investments - da implementare quando necessario
   */
  private async getInvestments(): Promise<InvestmentHolding[]> {
    // Per ora ritorna un array vuoto
    return [];
  }

  /**
   * Carica dati per una persona specifica con controllo gruppo
   */
  async loadPersonData(personId: string) {
    const [person, accounts, budgets] = await Promise.all([
      this._people.getById(personId),
      this._accounts.getAccountsByPerson(personId),
      this._budgets.getBudgetsByPerson(personId),
    ]);

    if (!person) {
      throw new Error('Persona non trovata');
    }

    // Controllo autorizzazione: la persona deve essere nello stesso gruppo dell'utente
    if (this.userId) {
      const userGroupId = await this.getUserGroupId();
      if (userGroupId && person.groupId !== userGroupId) {
        throw new Error('Accesso negato: la persona non appartiene al tuo gruppo');
      }
    }

    // Carica transazioni per tutti gli account della persona
    const accountIds = accounts.map(acc => acc.id);
    const transactionPromises = accountIds.map(accountId => 
      this._transactions.getTransactionsByAccount(accountId)
    );
    const transactionArrays = await Promise.all(transactionPromises);
    const transactions = TransactionUtils.sortByDateDesc(transactionArrays.flat());

    return {
      person,
      accounts,
      transactions,
      budgets,
    };
  }

  /**
   * Calcola il bilancio totale per una persona con controllo gruppo
   */
  async calculatePersonBalance(personId: string): Promise<number> {
    // Controllo autorizzazione
    if (this.userId) {
      const person = await this._people.getById(personId);
      if (!person) {
        throw new Error('Persona non trovata');
      }
      
      const userGroupId = await this.getUserGroupId();
      if (userGroupId && person.groupId !== userGroupId) {
        throw new Error('Accesso negato: la persona non appartiene al tuo gruppo');
      }
    }

    const accounts = await this._accounts.getAccountsByPerson(personId);
    const transactions = await Promise.all(
      accounts.map(acc => this._transactions.getTransactionsByAccount(acc.id))
    );
    
    const allTransactions = transactions.flat();
    
    return accounts.reduce((totalBalance, account) => {
      const accountTransactions = allTransactions.filter(tx => tx.accountId === account.id);
      const calculatedBalance = this.calculateAccountBalance(account, accountTransactions);
      return totalBalance + calculatedBalance;
    }, 0);
  }

  /**
   * Calcola il bilancio di un account basato sulle transazioni
   */
  calculateAccountBalance(account: Account, transactions: Transaction[]): number {
    let balance = 0; // Assumiamo che il bilancio iniziale sia gestito altrove

    return transactions.reduce((acc, transaction) => {
      // Gestione trasferimenti
      if (CategoryUtils.isCategoryTransfer(transaction.category)) {
        if (transaction.accountId === account.id) {
          // Account di origine: sottrai
          return acc - transaction.amount;
        } else if (transaction.toAccountId === account.id) {
          // Account di destinazione: aggiungi
          return acc + transaction.amount;
        }
        return acc;
      }

      // Transazioni normali
      if (transaction.accountId === account.id) {
        if (transaction.type === 'entrata') {
          return acc + transaction.amount;
        } else {
          return acc - transaction.amount;
        }
      }

      return acc;
    }, balance);
  }

  /**
   * Ottiene transazioni con informazioni collegate filtrate per gruppo
   */
  async getEnrichedTransactions(): Promise<(Transaction & { 
    accountName?: string; 
    toAccountName?: string;
    linkedTransaction?: Transaction;
  })[]> {
    // Usa direttamente i metodi filtrati per gruppo
    const [transactions, accounts] = await Promise.all([
      this.getTransactionsByUserGroup(),
      this.getAccountsByUserGroup(),
    ]);

    return transactions.map(transaction => {
      const account = accounts.find(acc => acc.id === transaction.accountId);
      const toAccount = transaction.toAccountId 
        ? accounts.find(acc => acc.id === transaction.toAccountId)
        : undefined;
      
      const linkedTransaction = transaction.parentTransactionId
        ? transactions.find(tx => tx.id === transaction.parentTransactionId)
        : undefined;

      return {
        ...transaction,
        accountName: account?.name,
        toAccountName: toAccount?.name,
        linkedTransaction,
      };
    });
  }

  /**
   * Ottiene statistiche per una persona con controllo gruppo
   */
  async getPersonStats(personId: string) {
    // Controllo autorizzazione
    if (this.userId) {
      const person = await this._people.getById(personId);
      if (!person) {
        throw new Error('Persona non trovata');
      }
      
      const userGroupId = await this.getUserGroupId();
      if (userGroupId && person.groupId !== userGroupId) {
        throw new Error('Accesso negato: la persona non appartiene al tuo gruppo');
      }
    }

    const [accounts, budgets] = await Promise.all([
      this._accounts.getAccountsByPerson(personId),
      this._budgets.getBudgetsByPerson(personId),
    ]);

    const totalBalance = await this._accounts.getTotalBalanceForPerson(personId);
    const totalBudget = await this._budgets.getTotalBudgetForPerson(personId);

    return {
      totalAccounts: accounts.length,
      totalBalance,
      totalBudgets: budgets.length,
      totalBudgetAmount: totalBudget,
    };
  }

  /**
   * Aggiorna una persona esistente
   */
  async updatePerson(updatedPerson: Person): Promise<Person> {
    return await this._people.update(updatedPerson.id, updatedPerson);
  }
}
