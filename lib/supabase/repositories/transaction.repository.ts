/**
 * Transaction Repository
 * Implements domain-specific transaction operations
 */

import { Transaction, TransactionType } from '../../../types';
import { transactionMapper } from '../mappers';
import { BaseSupabaseRepository } from './base.repository';

export interface TransactionFilters {
  accountId?: string;
  personId?: string;
  type?: TransactionType;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  isReconciled?: boolean;
  parentTransactionId?: string;
}

export class TransactionRepository extends BaseSupabaseRepository<Transaction, TransactionFilters> {
  constructor() {
    super('transactions');
  }

  protected mapToEntity(data: any): Transaction {
    return transactionMapper.toEntity(data);
  }

  protected mapFromEntity(entity: Transaction): any {
    return transactionMapper.toDatabase(entity);
  }

  protected buildFilters(filters: TransactionFilters) {
    return (query: any) => {
      if (filters.accountId) {
        query = query.eq('account_id', filters.accountId);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('date', filters.dateTo);
      }
      if (filters.isReconciled !== undefined) {
        query = query.eq('is_reconciled', filters.isReconciled);
      }
      if (filters.parentTransactionId) {
        query = query.eq('parent_transaction_id', filters.parentTransactionId);
      }
      return query;
    };
  }

  // Domain-specific methods
  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.findByFilters({ accountId });
  }

  async findByDateRange(dateFrom: string, dateTo: string): Promise<Transaction[]> {
    return this.findByFilters({ dateFrom, dateTo });
  }

  async findUnreconciled(): Promise<Transaction[]> {
    return this.findByFilters({ isReconciled: false });
  }

  async findReconciled(): Promise<Transaction[]> {
    return this.findByFilters({ isReconciled: true });
  }

  async findByCategory(category: string): Promise<Transaction[]> {
    return this.findByFilters({ category });
  }

  async linkTransactions(parentId: string, childId: string): Promise<boolean> {
    try {
      // Update child transaction
      await this.update(childId, { 
        isReconciled: true, 
        parentTransactionId: parentId 
      } as Partial<Transaction>);

      // Update parent transaction
      await this.update(parentId, { 
        isReconciled: true 
      } as Partial<Transaction>);

      return true;
    } catch (error) {
      console.error('Failed to link transactions:', error);
      return false;
    }
  }

  async unlinkTransaction(transactionId: string): Promise<boolean> {
    try {
      const transaction = await this.findById(transactionId);
      if (!transaction) return false;

      // If it's a child transaction, unlink it
      if (transaction.parentTransactionId) {
        await this.update(transactionId, { 
          isReconciled: false, 
          parentTransactionId: null 
        } as Partial<Transaction>);

        // Check if parent should also be unlinked
        const siblings = await this.findByFilters({ 
          parentTransactionId: transaction.parentTransactionId 
        });
        
        if (siblings.length === 0) {
          await this.update(transaction.parentTransactionId, { 
            isReconciled: false 
          } as Partial<Transaction>);
        }
      } else {
        // If it's a parent transaction, unlink all children
        const children = await this.findByFilters({ 
          parentTransactionId: transactionId 
        });
        
        for (const child of children) {
          await this.update(child.id, { 
            isReconciled: false, 
            parentTransactionId: null 
          } as Partial<Transaction>);
        }
        
        await this.update(transactionId, { 
          isReconciled: false 
        } as Partial<Transaction>);
      }

      return true;
    } catch (error) {
      console.error('Failed to unlink transaction:', error);
      return false;
    }
  }
}
