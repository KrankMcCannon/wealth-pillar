/**
 * Repository Factory
 * Singleton pattern for repository instances
 */

import { AccountRepository } from './account.repository';
import { BudgetRepository } from './budget.repository';
import { CategoryRepository } from './category.repository';
import { PersonRepository } from './person.repository';
import { TransactionRepository } from './transaction.repository';

class RepositoryFactory {
  private static transactionRepo: TransactionRepository | null = null;
  private static accountRepo: AccountRepository | null = null;
  private static personRepo: PersonRepository | null = null;
  private static budgetRepo: BudgetRepository | null = null;
  private static categoryRepo: CategoryRepository | null = null;

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

  // Reset all instances (useful for testing)
  static reset(): void {
    this.transactionRepo = null;
    this.accountRepo = null;
    this.personRepo = null;
    this.budgetRepo = null;
    this.categoryRepo = null;
  }
}

export { RepositoryFactory };

// Convenience exports for easy access
export const transactionRepository = () => RepositoryFactory.getTransactionRepository();
export const accountRepository = () => RepositoryFactory.getAccountRepository();
export const personRepository = () => RepositoryFactory.getPersonRepository();
export const budgetRepository = () => RepositoryFactory.getBudgetRepository();
export const categoryRepository = () => RepositoryFactory.getCategoryRepository();
