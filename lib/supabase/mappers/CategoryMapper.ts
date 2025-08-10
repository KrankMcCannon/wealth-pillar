/**
 * Category Mapper
 * Gestisce la conversione tra CategoryOption entity e database row
 */

import { CategoryOption } from '../../../types';
import { BaseMapper, MappingError } from './BaseMapper';

interface CategoryDatabaseRow {
  id: string;
  name: string;
  label: string;
  created_at?: string;
  updated_at?: string;
}

export class CategoryMapper extends BaseMapper<CategoryOption, CategoryDatabaseRow> {
  toEntity(dbRow: CategoryDatabaseRow): CategoryOption {
    try {
      return {
        id: dbRow.id,
        name: dbRow.name,
        label: dbRow.label,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map category from database: ${error}`,
        dbRow,
        'CategoryOption'
      );
    }
  }

  toDatabase(entity: CategoryOption): Partial<CategoryDatabaseRow> {
    try {
      return {
        id: entity.id,
        name: entity.name,
        label: entity.label,
      };
    } catch (error) {
      throw new MappingError(
        `Failed to map category to database: ${error}`,
        entity,
        'CategoryDatabaseRow'
      );
    }
  }
}

// Singleton instance
export const categoryMapper = new CategoryMapper();
