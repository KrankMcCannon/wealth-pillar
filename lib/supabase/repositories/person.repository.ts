/**
 * Person Repository
 * Implements domain-specific person operations
 */

import { Person } from '../../../types';
import { BaseSupabaseRepository } from '../base-repository';

export interface PersonFilters {
  name?: string;
}

export class PersonRepository extends BaseSupabaseRepository<Person, PersonFilters> {
  constructor() {
    super('people');
  }

  protected mapToEntity(data: any): Person {
    return {
      id: data.id,
      name: data.name,
      avatar: data.avatar || '',
      themeColor: data.theme_color || '#3B82F6',
      budgetStartDate: data.budget_start_date
    };
  }

  protected mapFromEntity(entity: Person): any {
    return {
      id: entity.id,
      name: entity.name,
      avatar: entity.avatar,
      theme_color: entity.themeColor,
      budget_start_date: entity.budgetStartDate
    };
  }

  protected buildFilters(filters: PersonFilters) {
    return (query: any) => {
      if (filters.name) {
        query = query.ilike('name', `%${filters.name}%`);
      }
      return query;
    };
  }

  // Domain-specific methods
  async findByName(name: string): Promise<Person[]> {
    return this.findByFilters({ name });
  }
}
