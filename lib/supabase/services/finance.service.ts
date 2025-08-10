/**
 * Finance Service Aggregator
 * Implementa il Facade Pattern per fornire un'interfaccia unificata
 * Segue il principio di Single Responsibility aggregando i servizi specifici
 */

import { SupabaseClient } from '@supabase/supabase-js';
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
import { Account, InvestmentHolding, Transaction } from '../../../types';

export class FinanceService {
  // Service instances
  public readonly accounts: AccountService;
  public readonly budgets: BudgetService;
  public readonly categories: CategoryService;
  public readonly people: PersonService;
  public readonly transactions: TransactionService;

  constructor(private supabaseClient: SupabaseClient<Database>) {
    // Initialize repositories
    const accountRepo = new AccountRepository();
    const budgetRepo = new BudgetRepository();
    const categoryRepo = new CategoryRepository();
    const personRepo = new PersonRepository();
    const transactionRepo = new TransactionRepository();

    // Initialize services
    this.accounts = new AccountService(accountRepo);
    this.budgets = new BudgetService(budgetRepo);
    this.categories = new CategoryService(categoryRepo);
    this.people = new PersonService(personRepo);
    this.transactions = new TransactionService(transactionRepo);
  }

  /**
   * Metodi di convenienza per operazioni comuni
   */

  /**
   * Carica tutti i dati necessari per l'applicazione
   */
  async loadAllData() {
    const [people, accounts, transactions, budgets, investments, categories] = await Promise.all([
      this.people.getAll(),
      this.accounts.getAll(),
      this.transactions.getAll(),
      this.budgets.getAll(),
      this.getInvestments(),
      this.categories.getAll(),
    ]);

    return {
      people,
      accounts,
      transactions: transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      budgets,
      investments,
      categories,
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
   * Carica dati per una persona specifica
   */
  async loadPersonData(personId: string) {
    const [person, accounts, budgets] = await Promise.all([
      this.people.getById(personId),
      this.accounts.getAccountsByPerson(personId),
      this.budgets.getBudgetsByPerson(personId),
    ]);

    if (!person) {
      throw new Error('Persona non trovata');
    }

    // Carica transazioni per tutti gli account della persona
    const accountIds = accounts.map(acc => acc.id);
    const transactionPromises = accountIds.map(accountId => 
      this.transactions.getTransactionsByAccount(accountId)
    );
    const transactionArrays = await Promise.all(transactionPromises);
    const transactions = transactionArrays.flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      person,
      accounts,
      transactions,
      budgets,
    };
  }

  /**
   * Calcola il bilancio totale per una persona
   */
  async calculatePersonBalance(personId: string): Promise<number> {
    const accounts = await this.accounts.getAccountsByPerson(personId);
    const transactions = await Promise.all(
      accounts.map(acc => this.transactions.getTransactionsByAccount(acc.id))
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
      if (transaction.category === 'trasferimento') {
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
   * Ottiene transazioni con informazioni collegate
   */
  async getEnrichedTransactions(): Promise<(Transaction & { 
    accountName?: string; 
    toAccountName?: string;
    linkedTransaction?: Transaction;
  })[]> {
    const [transactions, accounts] = await Promise.all([
      this.transactions.getAll(),
      this.accounts.getAll(),
    ]);

    return transactions.map(transaction => {
      const account = accounts.find(acc => acc.id === transaction.accountId);
      const toAccount = transaction.toAccountId 
        ? accounts.find(acc => acc.id === transaction.toAccountId)
        : undefined;
      
      const linkedTransaction = transaction.linkedTransactionId
        ? transactions.find(tx => tx.id === transaction.linkedTransactionId)
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
   * Ottiene statistiche per una persona
   */
  async getPersonStats(personId: string) {
    const [accounts, budgets] = await Promise.all([
      this.accounts.getAccountsByPerson(personId),
      this.budgets.getBudgetsByPerson(personId),
    ]);

    const totalBalance = await this.accounts.getTotalBalanceForPerson(personId);
    const totalBudget = await this.budgets.getTotalBudgetForPerson(personId);

    return {
      totalAccounts: accounts.length,
      totalBalance,
      totalBudgets: budgets.length,
      totalBudgetAmount: totalBudget,
    };
  }
}
