/**
 * Budget Mapper
 * Gestisce la conversione tra Budget entity e database row
 */

import { Budget } from '../../../types';
import { BaseMapper, MappingError } from './BaseMapper';

interface BudgetDatabaseRow {
  id: string;
  description: string;
  categories?: any;
  amount: string | number;
  period: string;
  person_id: string;
  created_at?: string;
  updated_at?: string;
}

export class BudgetMapper extends BaseMapper<Budget, BudgetDatabaseRow> {
  toEntity(dbRow: BudgetDatabaseRow): Budget {
    try {
      return {
        id: dbRow.id,
        description: dbRow.description,
        categories: this.safeParseArray<string>(dbRow.categories),
        amount: this.safeParseFloat(dbRow.amount),
        period: dbRow.period as Budget['period'],
        personId: dbRow.person_id,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map budget from database: ${error}`,
        dbRow,
        'Budget'
      );
    }
  }

  toDatabase(entity: Budget): Partial<BudgetDatabaseRow> {
    try {
      return {
        id: entity.id,
        description: entity.description,
        categories: entity.categories,
        amount: entity.amount,
        period: entity.period,
        person_id: entity.personId,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map budget to database: ${error}`,
        entity,
        'BudgetDatabaseRow'
      );
    }
  }
}

// Singleton instance
export const budgetMapper = new BudgetMapper();
