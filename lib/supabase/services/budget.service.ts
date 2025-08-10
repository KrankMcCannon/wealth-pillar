/**
 * Budget Service
 * Gestisce la business logic specifica per i budget
 */

import { v4 as uuidv4 } from 'uuid';
import { Budget } from '../../../types';
import { BudgetFilters, BudgetRepository } from '../repositories/budget.repository';
import { BaseService, ServiceError } from './base-service';

export class BudgetService extends BaseService<Budget, BudgetFilters> {
  constructor(repository: BudgetRepository) {
    super(repository);
  }

  /**
   * Crea un nuovo budget con validazioni specifiche
   */
  async createBudget(budgetData: Omit<Budget, 'id'>): Promise<Budget> {
    const budgetWithId: Budget = {
      ...budgetData,
      id: uuidv4(),
    };

    return await this.create(budgetWithId);
  }

  /**
   * Ottiene budget per persona
   */
  async getBudgetsByPerson(personId: string): Promise<Budget[]> {
    return await this.findByFilters({ personId });
  }

  /**
   * Ottiene budget per periodo
   */
  async getBudgetsByPeriod(period: Budget['period']): Promise<Budget[]> {
    return await this.findByFilters({ period });
  }

  /**
   * Calcola il totale dei budget per una persona
   */
  async getTotalBudgetForPerson(personId: string): Promise<number> {
    const budgets = await this.getBudgetsByPerson(personId);
    return budgets.reduce((total, budget) => total + budget.amount, 0);
  }

  /**
   * Validazioni specifiche per la creazione di budget
   */
  protected async validateForCreate(budgetData: Omit<Budget, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Validazione importo
    if (typeof budgetData.amount !== 'number' || budgetData.amount <= 0) {
      throw new ServiceError('L\'importo del budget deve essere un numero positivo', 'INVALID_AMOUNT');
    }

    // Validazione descrizione
    if (!budgetData.description || budgetData.description.trim() === '') {
      throw new ServiceError('La descrizione è richiesta', 'MISSING_DESCRIPTION');
    }

    // Validazione persona
    if (!budgetData.personId || budgetData.personId.trim() === '') {
      throw new ServiceError('La persona è richiesta', 'MISSING_PERSON');
    }

    // Validazione periodo
    if (!budgetData.period || !['monthly', 'yearly'].includes(budgetData.period)) {
      throw new ServiceError('Il periodo deve essere "monthly" o "yearly"', 'INVALID_PERIOD');
    }

    // Validazione categorie
    if (!budgetData.categories || !Array.isArray(budgetData.categories) || budgetData.categories.length === 0) {
      throw new ServiceError('Almeno una categoria è richiesta', 'MISSING_CATEGORIES');
    }

    // Validazione unicità (stessa persona, stesso periodo, stesse categorie)
    const existingBudgets = await this.getBudgetsByPerson(budgetData.personId);
    const duplicateBudget = existingBudgets.find(budget => 
      budget.period === budgetData.period &&
      this.arraysEqual(budget.categories.sort(), budgetData.categories.sort())
    );

    if (duplicateBudget) {
      throw new ServiceError('Esiste già un budget per questa persona con lo stesso periodo e categorie', 'DUPLICATE_BUDGET');
    }
  }

  /**
   * Validazioni specifiche per l'aggiornamento di budget
   */
  protected async validateForUpdate(id: string, budgetData: Partial<Budget>): Promise<void> {
    // Verifica che il budget esista
    const existingBudget = await this.getById(id);
    if (!existingBudget) {
      throw new ServiceError('Budget non trovato', 'NOT_FOUND');
    }

    // Validazione importo se fornito
    if (budgetData.amount !== undefined && (typeof budgetData.amount !== 'number' || budgetData.amount <= 0)) {
      throw new ServiceError('L\'importo del budget deve essere un numero positivo', 'INVALID_AMOUNT');
    }

    // Validazione descrizione se fornita
    if (budgetData.description !== undefined && budgetData.description.trim() === '') {
      throw new ServiceError('La descrizione è richiesta', 'MISSING_DESCRIPTION');
    }

    // Validazione periodo se fornito
    if (budgetData.period !== undefined && !['monthly', 'yearly'].includes(budgetData.period)) {
      throw new ServiceError('Il periodo deve essere "monthly" o "yearly"', 'INVALID_PERIOD');
    }

    // Validazione categorie se fornite
    if (budgetData.categories !== undefined) {
      if (!Array.isArray(budgetData.categories) || budgetData.categories.length === 0) {
        throw new ServiceError('Almeno una categoria è richiesta', 'MISSING_CATEGORIES');
      }
    }
  }

  /**
   * Utility per confrontare array
   */
  private arraysEqual<T>(arr1: T[], arr2: T[]): boolean {
    if (arr1.length !== arr2.length) return false;
    return arr1.every((val, index) => val === arr2[index]);
  }
}
