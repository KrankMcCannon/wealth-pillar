/**
 * Account Repository
 * Implements domain-specific account operations
 */

import { Account } from '../../../types';
import { accountMapper } from '../mappers';
import { BaseSupabaseRepository } from './base.repository';

export interface AccountFilters {
  personId?: string;
  type?: Account['type'];
  groupId?: string; // Filtro per gruppo
}

export class AccountRepository extends BaseSupabaseRepository<Account, AccountFilters> {
  constructor() {
    super('accounts');
  }

  protected mapToEntity(data: any): Account {
    return accountMapper.toEntity(data);
  }

  protected mapFromEntity(entity: Account): any {
    return accountMapper.toDatabase(entity);
  }

  protected buildFilters(filters: AccountFilters) {
    return (query: any) => {
      if (filters.groupId) {
        query = query.eq('group_id', filters.groupId);
      }
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
