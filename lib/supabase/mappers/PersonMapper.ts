/**
 * Person Mapper
 * Gestisce la conversione tra Person entity e database row
 */

import { BudgetPeriodData, Person } from "../../../types";
import { BaseMapper, MappingError } from "./BaseMapper";

interface PersonDatabaseRow {
  id: string;
  name: string;
  avatar?: string | null;
  theme_color?: string | null;
  budget_start_date: number | string;
  budget_periods?: any; // Array di BudgetPeriodData objects
  group_id?: string | null;
  role?: string | null;
  created_at?: string;
  updated_at?: string;
}

export class PersonMapper extends BaseMapper<Person, PersonDatabaseRow> {
  toEntity(dbRow: PersonDatabaseRow): Person {
    return {
      id: dbRow.id,
      name: dbRow.name,
      avatar: dbRow.avatar || "",
      themeColor: dbRow.theme_color || "#3B82F6",
      budgetStartDate: dbRow.budget_start_date.toString(),
      budgetPeriods: this.safeParseArray<BudgetPeriodData>(dbRow.budget_periods, []),
      groupId: dbRow.group_id || "",
      role: (dbRow.role as "owner" | "admin" | "member") || "member",
      createdAt: dbRow.created_at || new Date().toISOString(),
      updatedAt: dbRow.updated_at || new Date().toISOString(),
    };
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
      throw new MappingError(`Failed to map person to database: ${error}`, entity, "PersonDatabaseRow");
    }
  }
}

// Singleton instance
export const personMapper = new PersonMapper();
