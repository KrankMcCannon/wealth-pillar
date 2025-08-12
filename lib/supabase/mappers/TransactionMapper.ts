/**
 * Transaction Mapper
 * Gestisce la conversione tra Transaction entity e database row
 */

import { Transaction, TransactionType } from '../../../types';
import { BaseMapper, MappingError } from './BaseMapper';

interface TransactionDatabaseRow {
  id: string;
  description: string;
  amount: string | number;
  date: string;
  type: string;
  category: string;
  account_id: string;
  to_account_id?: string | null;
  is_reconciled?: boolean | null;
  parent_transaction_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class TransactionMapper extends BaseMapper<Transaction, TransactionDatabaseRow> {
  toEntity(dbRow: TransactionDatabaseRow): Transaction {
    try {
      return {
        id: dbRow.id,
        description: dbRow.description,
        amount: this.safeParseFloat(dbRow.amount),
        date: dbRow.date,
        type: dbRow.type as TransactionType,
        category: dbRow.category,
        accountId: dbRow.account_id,
        toAccountId: dbRow.to_account_id || undefined,
        isReconciled: dbRow.is_reconciled || false,
        parentTransactionId: dbRow.parent_transaction_id || undefined,
        createdAt: dbRow.created_at,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map transaction from database: ${error}`,
        dbRow,
        'Transaction'
      );
    }
  }

  toDatabase(entity: Transaction): Partial<TransactionDatabaseRow> {
    try {
      return {
        id: entity.id,
        description: entity.description,
        amount: entity.amount,
        date: entity.date,
        type: entity.type,
        category: entity.category,
        account_id: entity.accountId,
        to_account_id: entity.toAccountId || null,
        is_reconciled: entity.isReconciled,
        parent_transaction_id: entity.parentTransactionId || null,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map transaction to database: ${error}`,
        entity,
        'TransactionDatabaseRow'
      );
    }
  }
}

// Singleton instance
export const transactionMapper = new TransactionMapper();
