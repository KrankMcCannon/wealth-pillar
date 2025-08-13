/**
 * Category Service
 * Gestisce la business logic specifica per le categorie
 */

import { v4 as uuidv4 } from 'uuid';
import { CategoryOption } from '../../../types';
import { CategoryFilters, CategoryRepository } from '../repositories/category.repository';
import { BaseService, ServiceError } from './base-service';

export class CategoryService extends BaseService<CategoryOption, CategoryFilters> {
  constructor(repository: CategoryRepository) {
    super(repository);
  }

  /**
   * Crea una nuova categoria con validazioni specifiche
   */
  async createCategory(categoryData: Omit<CategoryOption, 'id'>): Promise<CategoryOption> {
    const categoryWithId: CategoryOption = {
      ...categoryData,
      id: uuidv4(),
    };

    return await this.create(categoryWithId);
  }

  /**
   * Ottiene categorie per nome (ricerca parziale)
   */
  async searchByName(name: string): Promise<CategoryOption[]> {
    return await this.findByFilters({ name });
  }

  /**
   * Validazioni specifiche per la creazione di categorie
   */
  protected async validateForCreate(categoryData: Omit<CategoryOption, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Validazione nome univoco
    const existingCategories = await this.getAll();
    const nameExists = existingCategories.some(category => 
      category.name.toLowerCase() === categoryData.name.toLowerCase()
    );
    
    if (nameExists) {
      throw new ServiceError('Una categoria con questo nome esiste già', 'DUPLICATE_NAME');
    }

    // Validazione nome non vuoto
    if (!categoryData.name || categoryData.name.trim() === '') {
      throw new ServiceError('Il nome è richiesto', 'MISSING_NAME');
    }

    // Validazione label (se fornita, non deve essere vuota)
    if (categoryData.label !== undefined && categoryData.label.trim() === '') {
      throw new ServiceError('La label non può essere vuota se fornita', 'EMPTY_LABEL');
    }
  }

  /**
   * Validazioni specifiche per l'aggiornamento di categorie
   */
  protected async validateForUpdate(id: string, categoryData: Partial<CategoryOption>): Promise<void> {
    // Verifica che la categoria esista
    const existingCategory = await this.getById(id);
    if (!existingCategory) {
      throw new ServiceError('Categoria non trovata', 'NOT_FOUND');
    }

    // Validazione nome univoco se cambiato
    if (categoryData.name && categoryData.name !== existingCategory.name) {
      const existingCategories = await this.getAll();
      const nameExists = existingCategories.some(category => 
        category.id !== id && category.name.toLowerCase() === categoryData.name!.toLowerCase()
      );
      
      if (nameExists) {
        throw new ServiceError('Una categoria con questo nome esiste già', 'DUPLICATE_NAME');
      }

      // Validazione nome non vuoto
      if (categoryData.name.trim() === '') {
        throw new ServiceError('Il nome è richiesto', 'MISSING_NAME');
      }
    }

    // Validazione label se fornita
    if (categoryData.label !== undefined && categoryData.label.trim() === '') {
      throw new ServiceError('La label non può essere vuota se fornita', 'EMPTY_LABEL');
    }
  }
}
