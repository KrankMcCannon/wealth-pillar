import { ReconciliationAllocation, ReconciliationGroup } from '../../../types';
import { BaseSupabaseRepository } from './base.repository';

export interface ReconciliationGroupFilters {
  sourceTransactionId?: string;
  personId?: string;
}

export class ReconciliationGroupRepository extends BaseSupabaseRepository<ReconciliationGroup, ReconciliationGroupFilters> {
  constructor() {
    super('reconciliation_groups');
  }

  /**
   * Trova un gruppo di riconciliazione per transazione sorgente
   */
  async findBySourceTransaction(sourceTransactionId: string): Promise<ReconciliationGroup | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('source_transaction_id', sourceTransactionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }

    return this.mapToEntity(data);
  }

  /**
   * Trova tutti i gruppi di riconciliazione per una persona
   */
  async findByPerson(personId: string): Promise<ReconciliationGroup[]> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .contains('allocations', [{ personId }]);

    if (error) throw error;

    return data.map(this.mapToEntity);
  }

  /**
   * Aggiorna le allocazioni di un gruppo di riconciliazione
   */
  async updateAllocations(
    groupId: string, 
    allocations: ReconciliationAllocation[],
    totalAllocatedAmount: number,
    remainingAmount: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .update({
        allocations,
        total_allocated_amount: totalAllocatedAmount,
        remaining_amount: remainingAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupId);

    if (error) throw error;
    return true;
  }

  /**
   * Elimina un gruppo di riconciliazione e tutte le sue allocazioni
   */
  async deleteGroup(groupId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', groupId);

    if (error) throw error;
    return true;
  }

  protected mapToEntity(data: any): ReconciliationGroup {
    return {
      id: data.id,
      sourceTransactionId: data.source_transaction_id,
      allocations: data.allocations || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  protected mapFromEntity(entity: ReconciliationGroup): any {
    return {
      id: entity.id,
      source_transaction_id: entity.sourceTransactionId,
      allocations: entity.allocations,
      total_allocated_amount: entity.allocations.reduce((sum, alloc) => sum + alloc.amount, 0),
      remaining_amount: entity.allocations.reduce((sum, alloc) => sum + alloc.amount, 0),
      created_at: entity.createdAt,
      updated_at: entity.updatedAt
    };
  }

  protected buildFilters(filters: ReconciliationGroupFilters) {
    return (query: any) => {
      if (filters.sourceTransactionId) {
        query = query.eq('source_transaction_id', filters.sourceTransactionId);
      }
      if (filters.personId) {
        query = query.contains('allocations', [{ personId: filters.personId }]);
      }
      return query;
    };
  }
}
