/**
 * Account Repository
 * Implements domain-specific account operations
 */

import { Account } from '../../../types';
import { BaseSupabaseRepository } from '../base-repository';

export interface AccountFilters {
  personId?: string;
  type?: Account['type'];
}

export class AccountRepository extends BaseSupabaseRepository<Account, AccountFilters> {
  constructor() {
    super('accounts');
  }

  protected mapToEntity(data: any): Account {
    return {
      id: data.id,
      name: data.name,
      balance: data.initial_balance, // We'll calculate current balance separately
      type: data.type,
      personIds: data.person_ids || []
    };
  }

  protected mapFromEntity(entity: Account): any {
    return {
      id: entity.id,
      name: entity.name,
      initial_balance: entity.balance,
      type: entity.type,
      person_ids: entity.personIds
    };
  }

  protected buildFilters(filters: AccountFilters) {
    return (query: any) => {
      if (filters.personId) {
        query = query.contains('person_ids', [filters.personId]);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      return query;
    };
  }

  // Domain-specific methods
  async findByPersonId(personId: string): Promise<Account[]> {
    return this.findByFilters({ personId });
  }

  async findByType(type: Account['type']): Promise<Account[]> {
    return this.findByFilters({ type });
  }
}
