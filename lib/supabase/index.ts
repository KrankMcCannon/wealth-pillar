/**
 * Supabase Integration - Main Export File
 * Following SOLID principles and clean architecture
 */

// Configuration
export { getSupabaseConfig, testSupabaseConnection, validateSupabaseConfig } from './config';

// Client
export { createSupabaseClient, getSupabaseClient, getSupabaseUrl, isSupabaseConfigured, resetSupabaseClient } from './client';

// Types
export type { Database, Inserts, Tables, Updates } from './database.types';

// Interfaces
export type {
  IAuthService, IQueryRepository,
  IRealtimeRepository, IRepository, IStorageService
} from './interfaces';

// Base Repository
export { BaseSupabaseRepository } from './base-repository';

// Repositories
export { TransactionRepository } from './repositories/transaction.repository';
export type { TransactionFilters } from './repositories/transaction.repository';

export { AccountRepository } from './repositories/account.repository';
export type { AccountFilters } from './repositories/account.repository';

export { PersonRepository } from './repositories/person.repository';
export type { PersonFilters } from './repositories/person.repository';

export { BudgetRepository } from './repositories/budget.repository';
export type { BudgetFilters } from './repositories/budget.repository';

export { CategoryRepository } from './repositories/category.repository';
export type { CategoryFilters } from './repositories/category.repository';

// Services
export { SupabaseAuthService } from './services/auth.service';
export { MigrationService, migrationService } from './services/migration.service';

// Import classes for internal use
import { AccountRepository } from './repositories/account.repository';
import { BudgetRepository } from './repositories/budget.repository';
import { CategoryRepository } from './repositories/category.repository';
import { PersonRepository } from './repositories/person.repository';
import { TransactionRepository } from './repositories/transaction.repository';
import { SupabaseAuthService } from './services/auth.service';

// React Hooks
export {
  useAccounts, useBudgets,
  useCategories, usePeople, useRealtimeAccounts, useRealtimeTransactions, useSupabaseAuth, useSupabaseRepository,
  useTransactions
} from './hooks/useSupabase';

export { SupabaseConnectionStatus, useSupabaseConnection } from './hooks/useConnection';

// Errors
export { AuthError, RepositoryError } from './interfaces';

// Repository Factory (Singleton pattern for repository instances)
class RepositoryFactory {
  private static transactionRepo: TransactionRepository | null = null;
  private static accountRepo: AccountRepository | null = null;
  private static personRepo: PersonRepository | null = null;
  private static budgetRepo: BudgetRepository | null = null;
  private static categoryRepo: CategoryRepository | null = null;
  private static authService: SupabaseAuthService | null = null;

  static getTransactionRepository(): TransactionRepository {
    if (!this.transactionRepo) {
      this.transactionRepo = new TransactionRepository();
    }
    return this.transactionRepo;
  }

  static getAccountRepository(): AccountRepository {
    if (!this.accountRepo) {
      this.accountRepo = new AccountRepository();
    }
    return this.accountRepo;
  }

  static getPersonRepository(): PersonRepository {
    if (!this.personRepo) {
      this.personRepo = new PersonRepository();
    }
    return this.personRepo;
  }

  static getBudgetRepository(): BudgetRepository {
    if (!this.budgetRepo) {
      this.budgetRepo = new BudgetRepository();
    }
    return this.budgetRepo;
  }

  static getCategoryRepository(): CategoryRepository {
    if (!this.categoryRepo) {
      this.categoryRepo = new CategoryRepository();
    }
    return this.categoryRepo;
  }

  static getAuthService(): SupabaseAuthService {
    if (!this.authService) {
      this.authService = new SupabaseAuthService();
    }
    return this.authService;
  }

  // Reset all instances (useful for testing)
  static reset(): void {
    this.transactionRepo = null;
    this.accountRepo = null;
    this.personRepo = null;
    this.budgetRepo = null;
    this.categoryRepo = null;
    this.authService = null;
  }
}

export { RepositoryFactory };

// Convenience exports for easy access
export const transactionRepository = () => RepositoryFactory.getTransactionRepository();
export const accountRepository = () => RepositoryFactory.getAccountRepository();
export const personRepository = () => RepositoryFactory.getPersonRepository();
export const budgetRepository = () => RepositoryFactory.getBudgetRepository();
export const categoryRepository = () => RepositoryFactory.getCategoryRepository();
export const authService = () => RepositoryFactory.getAuthService();
