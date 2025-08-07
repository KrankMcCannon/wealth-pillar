/**
 * Migration Service
 * Migrates data from JSON to Supabase database
 */

import {
  accountRepository,
  budgetRepository,
  categoryRepository,
  personRepository,
  transactionRepository
} from '../index';

export interface JSONData {
  people: any[];
  accounts: any[];
  transactions: any[];
  budgets: any[];
  categories: any[];
}

export class MigrationService {
  
  async migrateFromJSON(jsonData: JSONData): Promise<{
    success: boolean;
    migrated: {
      people: number;
      accounts: number;
      transactions: number;
      budgets: number;
      categories: number;
    };
    errors: string[];
  }> {
    const results = {
      success: true,
      migrated: { people: 0, accounts: 0, transactions: 0, budgets: 0, categories: 0 },
      errors: [] as string[]
    };

    try {
      // 1. Migrate Categories first (they are referenced by transactions)
      console.log('🏷️ Migrating categories...');
      for (const category of jsonData.categories || []) {
        try {
          await categoryRepository().create({
            name: category.name
          });
          results.migrated.categories++;
        } catch (error) {
          results.errors.push(`Category migration failed: ${error}`);
        }
      }

      // 2. Migrate People
      console.log('👥 Migrating people...');
      for (const person of jsonData.people || []) {
        try {
          await personRepository().create({
            name: person.name,
            avatar: person.avatar || '',
            themeColor: person.themeColor || '#3B82F6',
            budgetStartDate: person.budgetStartDate
          });
          results.migrated.people++;
        } catch (error) {
          results.errors.push(`Person migration failed: ${error}`);
        }
      }

      // 3. Migrate Accounts
      console.log('🏦 Migrating accounts...');
      for (const account of jsonData.accounts || []) {
        try {
          await accountRepository().create({
            name: account.name,
            balance: account.balance || 0,
            type: account.type,
            personIds: account.personIds || []
          });
          results.migrated.accounts++;
        } catch (error) {
          results.errors.push(`Account migration failed: ${error}`);
        }
      }

      // 4. Migrate Budgets
      console.log('💰 Migrating budgets...');
      for (const budget of jsonData.budgets || []) {
        try {
          await budgetRepository().create({
            description: budget.description || '',
            categories: budget.categories || [],
            amount: budget.amount,
            period: budget.period,
            personId: budget.personId
          });
          results.migrated.budgets++;
        } catch (error) {
          results.errors.push(`Budget migration failed: ${error}`);
        }
      }

      // 5. Migrate Transactions (last because they may reference other entities)
      console.log('💸 Migrating transactions...');
      for (const transaction of jsonData.transactions || []) {
        try {
          await transactionRepository().create({
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date,
            type: transaction.type,
            category: transaction.category,
            accountId: transaction.accountId,
            toAccountId: transaction.toAccountId,
            isReconciled: transaction.isReconciled || false,
            parentTransactionId: transaction.parentTransactionId || transaction.linkedTransactionId
          });
          results.migrated.transactions++;
        } catch (error) {
          results.errors.push(`Transaction migration failed: ${error}`);
        }
      }

      console.log('✅ Migration completed!');
      console.log('📊 Results:', results.migrated);
      
      if (results.errors.length > 0) {
        console.warn('⚠️ Migration completed with errors:', results.errors);
        results.success = false;
      }

    } catch (error) {
      results.success = false;
      results.errors.push(`Migration failed: ${error}`);
      console.error('❌ Migration failed:', error);
    }

    return results;
  }

  async migrateFromJSONFile(filePath: string): Promise<any> {
    try {
      const response = await fetch(filePath);
      const jsonData = await response.json();
      return this.migrateFromJSON(jsonData);
    } catch (error) {
      throw new Error(`Failed to load JSON file: ${error}`);
    }
  }

  async validateMigration(): Promise<{
    isValid: boolean;
    counts: {
      people: number;
      accounts: number;
      transactions: number;
      budgets: number;
      categories: number;
    };
    issues: string[];
  }> {
    const issues: string[] = [];
    
    try {
      const counts = {
        people: await personRepository().count(),
        accounts: await accountRepository().count(),
        transactions: await transactionRepository().count(),
        budgets: await budgetRepository().count(),
        categories: await categoryRepository().count()
      };

      // Basic validation
      if (counts.people === 0) issues.push('No people found');
      if (counts.accounts === 0) issues.push('No accounts found');
      if (counts.categories === 0) issues.push('No categories found');

      // Check for orphaned records
      const allTransactions = await transactionRepository().findAll();
      const allAccounts = await accountRepository().findAll();
      const accountIds = new Set(allAccounts.map(a => a.id));

      for (const transaction of allTransactions) {
        if (!accountIds.has(transaction.accountId)) {
          issues.push(`Transaction ${transaction.id} references non-existent account ${transaction.accountId}`);
        }
      }

      return {
        isValid: issues.length === 0,
        counts,
        issues
      };

    } catch (error) {
      return {
        isValid: false,
        counts: { people: 0, accounts: 0, transactions: 0, budgets: 0, categories: 0 },
        issues: [`Validation failed: ${error}`]
      };
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      console.log('🗑️ Clearing all data...');
      
      // Delete in reverse dependency order
      const allTransactions = await transactionRepository().findAll();
      for (const transaction of allTransactions) {
        await transactionRepository().delete(transaction.id);
      }

      const allBudgets = await budgetRepository().findAll();
      for (const budget of allBudgets) {
        await budgetRepository().delete(budget.id);
      }

      const allAccounts = await accountRepository().findAll();
      for (const account of allAccounts) {
        await accountRepository().delete(account.id);
      }

      const allPeople = await personRepository().findAll();
      for (const person of allPeople) {
        await personRepository().delete(person.id);
      }

      const allCategories = await categoryRepository().findAll();
      for (const category of allCategories) {
        await categoryRepository().delete(category.id);
      }

      console.log('✅ All data cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear data:', error);
      return false;
    }
  }
}

// Export singleton instance
export const migrationService = new MigrationService();
