/**
 * Base Service
 * Implementa il Service Layer pattern seguendo i principi SOLID
 * Single Responsibility: Gestisce le operazioni di business logic
 * Open/Closed: Estendibile per servizi specifici
 * Dependency Inversion: Dipende da astrazioni (IRepository)
 */

import { IQueryRepository, IRepository, RepositoryError } from '../types/interfaces';

export class ServiceError extends Error {
  constructor(message: string, public code?: string, public cause?: Error) {
    super(message);
    this.name = 'ServiceError';
  }
}

export abstract class BaseService<TEntity, TFilters = any> {
  protected constructor(
    protected repository: IRepository<TEntity> & IQueryRepository<TEntity, TFilters>
  ) {}

  async getAll(): Promise<TEntity[]> {
    try {
      return await this.repository.findAll();
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(`Failed to get all entities: ${error.message}`, error.code, error);
      }
      throw new ServiceError('Unexpected error while getting all entities', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async getById(id: string): Promise<TEntity | null> {
    try {
      return await this.repository.findById(id);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(`Failed to get entity by id: ${error.message}`, error.code, error);
      }
      throw new ServiceError('Unexpected error while getting entity by id', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async create(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<TEntity> {
    try {
      // Hook per validazioni specifiche pre-creazione
      await this.validateForCreate(entity);
      return await this.repository.create(entity);
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Unexpected error while creating entity', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async update(id: string, entity: Partial<TEntity>): Promise<TEntity> {
    try {
      // Hook per validazioni specifiche pre-aggiornamento
      await this.validateForUpdate(id, entity);
      return await this.repository.update(id, entity);
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Unexpected error while updating entity', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Hook per validazioni specifiche pre-eliminazione
      await this.validateForDelete(id);
      return await this.repository.delete(id);
    } catch (error) {
      if (error instanceof RepositoryError || error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError('Unexpected error while deleting entity', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async findByFilters(filters: TFilters): Promise<TEntity[]> {
    try {
      return await this.repository.findByFilters(filters);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(`Failed to find entities by filters: ${error.message}`, error.code, error);
      }
      throw new ServiceError('Unexpected error while finding entities by filters', 'UNKNOWN_ERROR', error as Error);
    }
  }

  async count(filters?: TFilters): Promise<number> {
    try {
      return await this.repository.count(filters);
    } catch (error) {
      if (error instanceof RepositoryError) {
        throw new ServiceError(`Failed to count entities: ${error.message}`, error.code, error);
      }
      throw new ServiceError('Unexpected error while counting entities', 'UNKNOWN_ERROR', error as Error);
    }
  }

  // Hooks per validazioni specifiche - da implementare nelle classi derivate
  protected async validateForCreate(entity: Omit<TEntity, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Default: nessuna validazione
  }

  protected async validateForUpdate(id: string, entity: Partial<TEntity>): Promise<void> {
    // Default: nessuna validazione
  }

  protected async validateForDelete(id: string): Promise<void> {
    // Default: nessuna validazione
  }
}
