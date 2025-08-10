/**
 * Person Service
 * Gestisce la business logic specifica per le persone
 */

import { v4 as uuidv4 } from 'uuid';
import { Person } from '../../../types';
import { PersonFilters, PersonRepository } from '../repositories/person.repository';
import { BaseService, ServiceError } from './base-service';

export class PersonService extends BaseService<Person, PersonFilters> {
  constructor(repository: PersonRepository) {
    super(repository);
  }

  /**
   * Crea una nuova persona con validazioni specifiche
   */
  async createPerson(personData: Omit<Person, 'id'>): Promise<Person> {
    const personWithId: Person = {
      ...personData,
      id: uuidv4(),
    };

    return await this.create(personWithId);
  }

  /**
   * Ottiene persone per nome (ricerca parziale)
   */
  async searchByName(name: string): Promise<Person[]> {
    return await this.findByFilters({ name });
  }

  /**
   * Validazioni specifiche per la creazione di persone
   */
  protected async validateForCreate(personData: Omit<Person, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Validazione nome univoco
    const existingPeople = await this.getAll();
    const nameExists = existingPeople.some(person => 
      person.name.toLowerCase() === personData.name.toLowerCase()
    );
    
    if (nameExists) {
      throw new ServiceError('Una persona con questo nome esiste già', 'DUPLICATE_NAME');
    }

    // Validazione nome non vuoto
    if (!personData.name || personData.name.trim() === '') {
      throw new ServiceError('Il nome è richiesto', 'MISSING_NAME');
    }

    // Validazione budgetStartDate
    if (personData.budgetStartDate) {
      const startDate = parseInt(personData.budgetStartDate);
      if (isNaN(startDate) || startDate < 1 || startDate > 31) {
        throw new ServiceError('La data di inizio budget deve essere tra 1 e 31', 'INVALID_BUDGET_START_DATE');
      }
    }
  }

  /**
   * Validazioni specifiche per l'aggiornamento di persone
   */
  protected async validateForUpdate(id: string, personData: Partial<Person>): Promise<void> {
    // Verifica che la persona esista
    const existingPerson = await this.getById(id);
    if (!existingPerson) {
      throw new ServiceError('Persona non trovata', 'NOT_FOUND');
    }

    // Validazione nome univoco se cambiato
    if (personData.name && personData.name !== existingPerson.name) {
      const existingPeople = await this.getAll();
      const nameExists = existingPeople.some(person => 
        person.id !== id && person.name.toLowerCase() === personData.name!.toLowerCase()
      );
      
      if (nameExists) {
        throw new ServiceError('Una persona con questo nome esiste già', 'DUPLICATE_NAME');
      }

      // Validazione nome non vuoto
      if (personData.name.trim() === '') {
        throw new ServiceError('Il nome è richiesto', 'MISSING_NAME');
      }
    }

    // Validazione budgetStartDate se fornita
    if (personData.budgetStartDate !== undefined) {
      const startDate = parseInt(personData.budgetStartDate);
      if (isNaN(startDate) || startDate < 1 || startDate > 31) {
        throw new ServiceError('La data di inizio budget deve essere tra 1 e 31', 'INVALID_BUDGET_START_DATE');
      }
    }
  }
}
