/**
 * Base Supabase Repository
 * Implements Repository Pattern with error handling
 */

import { getSupabaseClient } from '../client/supabase.client';
import { IQueryRepository, IRealtimeRepository, IRepository, RepositoryError } from '../types/interfaces';

export abstract class BaseSupabaseRepository<TEntity, TFilters = any> 
  implements IRepository<TEntity>, IQueryRepository<TEntity, TFilters>, IRealtimeRepository<TEntity> {
  
  protected supabase = getSupabaseClient();
  
  constructor(protected tableName: string) {}

  // Abstract methods to be implemented by derived classes
  protected abstract mapToEntity(data: any): TEntity;
  protected abstract mapFromEntity(entity: TEntity): any;
  protected abstract buildFilters(filters: TFilters): any;

  async findAll(): Promise<TEntity[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new RepositoryError(`Failed to fetch ${this.tableName}`, error.code, error);
      }

      return data?.map(item => this.mapToEntity(item)) || [];
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in findAll for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async findById(id: string): Promise<TEntity | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw new RepositoryError(`Failed to fetch ${this.tableName} by id`, error.code, error);
      }

      return data ? this.mapToEntity(data) : null;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in findById for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async create(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TEntity> {
    try {
      const mappedData = this.mapFromEntity(entity as TEntity);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(mappedData)
        .select()
        .single();

      if (error) {
        throw new RepositoryError(`Failed to create ${this.tableName}`, error.code, error);
      }

      return this.mapToEntity(data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in create for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async update(id: string, entity: Partial<TEntity>): Promise<TEntity> {
    try {
      const mappedData = this.mapFromEntity(entity as TEntity);
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({ ...mappedData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new RepositoryError(`Failed to update ${this.tableName}`, error.code, error);
      }

      return this.mapToEntity(data);
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in update for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw new RepositoryError(`Failed to delete ${this.tableName}`, error.code, error);
      }

      return true;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in delete for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async findByFilters(filters: TFilters): Promise<TEntity[]> {
    try {
      let query = this.supabase.from(this.tableName).select('*');
      
      // Apply filters using derived class implementation
      query = this.buildFilters(filters)(query);
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new RepositoryError(`Failed to fetch ${this.tableName} with filters`, error.code, error);
      }

      return data?.map(item => this.mapToEntity(item)) || [];
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in findByFilters for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  async count(filters?: TFilters): Promise<number> {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact', head: true });
      
      if (filters) {
        query = this.buildFilters(filters)(query);
      }
      
      const { count, error } = await query;

      if (error) {
        throw new RepositoryError(`Failed to count ${this.tableName}`, error.code, error);
      }

      return count || 0;
    } catch (error) {
      if (error instanceof RepositoryError) throw error;
      throw new RepositoryError(`Unexpected error in count for ${this.tableName}`, 'UNKNOWN_ERROR', error);
    }
  }

  subscribe(callback: (data: TEntity[]) => void): () => void {
    const subscription = this.supabase
      .channel(`${this.tableName}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: this.tableName 
        }, 
        async () => {
          // Refresh data when changes occur
          const data = await this.findAll();
          callback(data);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  subscribeToItem(id: string, callback: (data: TEntity | null) => void): () => void {
    const subscription = this.supabase
      .channel(`${this.tableName}_${id}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: this.tableName,
          filter: `id=eq.${id}`
        }, 
        async () => {
          // Refresh item when changes occur
          const data = await this.findById(id);
          callback(data);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }
}
