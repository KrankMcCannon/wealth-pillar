/**
 * Category Repository
 * Implements domain-specific category operations
 */

import { CategoryOption } from '../../../types';
import { BaseSupabaseRepository } from '../base-repository';

export interface CategoryFilters {
  name?: string;
}

export class CategoryRepository extends BaseSupabaseRepository<CategoryOption, CategoryFilters> {
  constructor() {
    super('categories');
  }

  protected mapToEntity(data: any): CategoryOption {
    return {
      id: data.id,
      name: data.name
    };
  }

  protected mapFromEntity(entity: CategoryOption): any {
    return {
      id: entity.id,
      name: entity.name
    };
  }

  protected buildFilters(filters: CategoryFilters) {
    return (query: any) => {
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      return query;
    };
  }

  // Domain-specific methods
  async findByName(name: string): Promise<CategoryOption[]> {
    return this.findByFilters({ name });
  }
}
