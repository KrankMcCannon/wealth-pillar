/**
 * Budget Repository
 * Implements domain-specific budget operations
 */

import { Budget } from '../../../types';
import { RepositoryError } from '../types/interfaces';
import { BaseSupabaseRepository } from './base.repository';

export interface BudgetFilters {
  personId?: string;
  period?: Budget['period'];
  groupId?: string; // Filtro per gruppo tramite person
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

  /**
   * Override per gestire il filtro di gruppo tramite query in due step
   */
  async findByFilters(filters: BudgetFilters): Promise<Budget[]> {
    if (filters.groupId) {
      try {
        // Prima otteniamo gli ID delle persone del gruppo
        const { data: people, error: peopleError } = await this.supabase
          .from('people')
          .select('id')
          .eq('group_id', filters.groupId);

        if (peopleError) {
          throw new RepositoryError(`Failed to fetch people for group filter`, peopleError.code, peopleError);
        }

        if (!people || people.length === 0) {
          // Se non ci sono persone nel gruppo, non ci sono budget
          return [];
        }

        const personIds = people.map(person => person.id);

        // Ora otteniamo i budget per queste persone
        const { data, error } = await this.supabase
          .from(this.tableName)
          .select('*')
          .in('person_id', personIds);

        if (error) {
          throw new RepositoryError(`Failed to fetch ${this.tableName} with groupId filter`, error.code, error);
        }

        // Mappiamo i risultati e applichiamo gli altri filtri
        let budgets = (data || []).map(item => this.mapToEntity(item));
        
        // Applica gli altri filtri manualmente
        if (filters.personId) {
          budgets = budgets.filter(b => b.personId === filters.personId);
        }
        if (filters.period) {
          budgets = budgets.filter(b => b.period === filters.period);
        }

        return budgets;
      } catch (error) {
        if (error instanceof RepositoryError) throw error;
        throw new RepositoryError(`Unexpected error in findByFilters with groupId for ${this.tableName}`, 'UNKNOWN_ERROR', error);
      }
    }

    // Usa l'implementazione base per gli altri filtri
    return super.findByFilters(filters);
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
