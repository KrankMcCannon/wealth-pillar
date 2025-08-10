/**
 * Account Mapper
 * Gestisce la conversione tra Account entity e database row
 */

import { Account } from '../../../types';
import { BaseMapper, MappingError } from './BaseMapper';

interface AccountDatabaseRow {
  id: string;
  name: string;
  type: string;
  balance?: string | number | null;
  initial_balance?: string | number | null;
  person_ids?: any;
  created_at?: string;
  updated_at?: string;
}

export class AccountMapper extends BaseMapper<Account, AccountDatabaseRow> {
  toEntity(dbRow: AccountDatabaseRow): Account {
    try {
      return {
        id: dbRow.id,
        name: dbRow.name,
        type: dbRow.type as Account['type'],
        balance: this.safeParseFloat(dbRow.balance || dbRow.initial_balance),
        personIds: this.safeParseArray<string>(dbRow.person_ids),
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map account from database: ${error}`,
        dbRow,
        'Account'
      );
    }
  }

  toDatabase(entity: Account): Partial<AccountDatabaseRow> {
    try {
      return {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        balance: entity.balance,
        initial_balance: entity.balance, // For backward compatibility
        person_ids: entity.personIds,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map account to database: ${error}`,
        entity,
        'AccountDatabaseRow'
      );
    }
  }
}

// Singleton instance
export const accountMapper = new AccountMapper();
