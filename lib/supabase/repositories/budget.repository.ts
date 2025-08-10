/**
 * Budget Repository
 * Implements domain-specific budget operations
 */

import { Budget } from '../../../types';
import { BaseSupabaseRepository } from './base.repository';

export interface BudgetFilters {
  personId?: string;
  period?: Budget['period'];
}

export class BudgetRepository extends BaseSupabaseRepository<Budget, BudgetFilters> {
  constructor() {
    super('budgets');
  }

  protected mapToEntity(data: any): Budget {
    return {
      id: data.id,
      description: data.description || '',
      categories: data.categories || [],
      amount: data.amount,
      period: data.period,
      personId: data.person_id
    };
  }

  protected mapFromEntity(entity: Budget): any {
    return {
      id: entity.id,
      description: entity.description,
      categories: entity.categories,
      amount: entity.amount,
      period: entity.period,
      person_id: entity.personId
    };
  }

  protected buildFilters(filters: BudgetFilters) {
    return (query: any) => {
      if (filters.personId) {
        query = query.eq('person_id', filters.personId);
      }
      if (filters.period) {
        query = query.eq('period', filters.period);
      }
      return query;
    };
  }

  // Domain-specific methods
  async findByPersonId(personId: string): Promise<Budget[]> {
    return this.findByFilters({ personId });
  }

  async findByPeriod(period: Budget['period']): Promise<Budget[]> {
    return this.findByFilters({ period });
  }

  async findMonthlyBudgets(): Promise<Budget[]> {
    return this.findByPeriod('monthly');
  }

  async findYearlyBudgets(): Promise<Budget[]> {
    return this.findByPeriod('annually');
  }
}
