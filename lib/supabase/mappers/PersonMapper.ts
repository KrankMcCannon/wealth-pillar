/**
 * Person Mapper
 * Gestisce la conversione tra Person entity e database row
 */

import { BudgetPeriodData, Person } from '../../../types';
import { BaseMapper, MappingError } from './BaseMapper';

interface PersonDatabaseRow {
  id: string;
  name: string;
  avatar?: string | null;
  theme_color?: string | null;
  budget_start_date: number | string;
  budget_periods?: any; // Array di BudgetPeriodData objects
  created_at?: string;
  updated_at?: string;
}

export class PersonMapper extends BaseMapper<Person, PersonDatabaseRow> {
  toEntity(dbRow: PersonDatabaseRow): Person {
    try {
      return {
        id: dbRow.id,
        name: dbRow.name,
        avatar: dbRow.avatar || '',
        themeColor: dbRow.theme_color || undefined,
        budgetStartDate: dbRow.budget_start_date.toString(),
        budgetPeriods: this.safeParseArray<BudgetPeriodData>(dbRow.budget_periods),
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map person from database: ${error}`,
        dbRow,
        'Person'
      );
    }
  }

  toDatabase(entity: Person): Partial<PersonDatabaseRow> {
    try {
      return {
        id: entity.id,
        name: entity.name,
        avatar: entity.avatar || null,
        theme_color: entity.themeColor || null,
        budget_start_date: parseInt(entity.budgetStartDate),
        budget_periods: entity.budgetPeriods || [],
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map person to database: ${error}`,
        entity,
        'PersonDatabaseRow'
      );
    }
  }
}

// Singleton instance
export const personMapper = new PersonMapper();
