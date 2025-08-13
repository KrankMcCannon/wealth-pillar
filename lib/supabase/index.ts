/**
 * Supabase Integration - Main Export File
 * Following SOLID principles and clean architecture
 */

// Configuration
export { getSupabaseConfig, testSupabaseConnection, validateSupabaseConfig } from '../config';

// Client
export {
  createSupabaseClient, getSupabaseClient, getSupabaseUrl,
  isSupabaseConfigured,
  resetSupabaseClient
} from './client/supabase.client';

export {
  createClerkSupabaseClient,
  useClerkSupabaseClient
} from './client/clerk-supabase.client';

// Types  
export type { Database, Inserts, Tables, Updates } from './types/database.types';
export type {
  FilterType, IQueryRepository,
  IRealtimeRepository,
  IRepository,
  IStorageService, RepositoryError, SortType
} from './types/interfaces';

// Services
export * from './services';

// Repositories
export { AccountRepository } from './repositories/account.repository';
export type { AccountFilters } from './repositories/account.repository';
export { BaseSupabaseRepository } from './repositories/base.repository';
export { BudgetRepository } from './repositories/budget.repository';
export type { BudgetFilters } from './repositories/budget.repository';
export { CategoryRepository } from './repositories/category.repository';
export type { CategoryFilters } from './repositories/category.repository';
export {
  accountRepository, budgetRepository,
  categoryRepository, personRepository, RepositoryFactory,
  transactionRepository
} from './repositories/factory';
export { PersonRepository } from './repositories/person.repository';
export type { PersonFilters } from './repositories/person.repository';
export { TransactionRepository } from './repositories/transaction.repository';
export type { TransactionFilters } from './repositories/transaction.repository';

// Mappers
export * from './mappers';

// Utils
export * from './utils';

// React Hooks
export {
  useAccounts, useBudgets,
  useCategories, usePeople, useRealtimeAccounts, useRealtimeTransactions, useSupabaseRepository,
  useTransactions
} from './hooks/useSupabase';

export { SupabaseConnectionStatus, useSupabaseConnection } from './hooks/useConnection';
