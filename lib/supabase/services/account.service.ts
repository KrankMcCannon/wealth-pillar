/**
 * Account Service
 * Gestisce la business logic specifica per gli account
 */

import { v4 as uuidv4 } from 'uuid';
import { Account } from '../../../types';
import { AccountFilters, AccountRepository } from '../repositories/account.repository';
import { ValidatorFactory } from '../utils/validation';
import { BaseService, ServiceError } from './base-service';

export class AccountService extends BaseService<Account, AccountFilters> {
  constructor(repository: AccountRepository) {
    super(repository);
  }

  /**
   * Crea un nuovo account con validazioni specifiche
   */
  async createAccount(accountData: Omit<Account, 'id'>): Promise<Account> {
    const accountWithId: Account = {
      ...accountData,
      id: uuidv4(),
    };

    return await this.create(accountWithId);
  }

  /**
   * Ottiene account per una persona specifica
   */
  async getAccountsByPerson(personId: string): Promise<Account[]> {
    return await this.findByFilters({ personId });
  }

  /**
   * Ottiene account per tipo
   */
  async getAccountsByType(type: Account['type']): Promise<Account[]> {
    return await this.findByFilters({ type });
  }

  /**
   * Calcola il bilancio totale per una persona
   */
  async getTotalBalanceForPerson(personId: string): Promise<number> {
    const accounts = await this.getAccountsByPerson(personId);
    return accounts.reduce((total, account) => total + account.balance, 0);
  }

  /**
   * Validazioni specifiche per la creazione di account
   */
  protected async validateForCreate(accountData: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Usa il validator standardizzato
    const validator = ValidatorFactory.createAccountValidator();
    validator.validateAndThrow(accountData);

    // Validazione business logic specifica
    if (accountData.personIds && accountData.personIds.length > 0) {
      const existingAccounts = await this.getAccountsByPerson(accountData.personIds[0]);
      const nameExists = existingAccounts.some(account => 
        account.name.toLowerCase() === accountData.name.toLowerCase()
      );
      
      if (nameExists) {
        throw new ServiceError('Un account con questo nome esiste già per questa persona', 'DUPLICATE_NAME');
      }
    }
  }

  /**
   * Validazioni specifiche per l'aggiornamento di account
   */
  protected async validateForUpdate(id: string, accountData: Partial<Account>): Promise<void> {
    // Verifica che l'account esista
    const existingAccount = await this.getById(id);
    if (!existingAccount) {
      throw new ServiceError('Account non trovato', 'NOT_FOUND');
    }

    // Validazione parziale per aggiornamenti
    if (accountData.balance !== undefined && (typeof accountData.balance !== 'number' || accountData.balance < 0)) {
      throw new ServiceError('Il bilancio deve essere un numero non negativo', 'INVALID_BALANCE');
    }

    // Validazione nome univoco se cambiato
    if (accountData.name && accountData.name !== existingAccount.name && existingAccount.personIds.length > 0) {
      const existingAccounts = await this.getAccountsByPerson(existingAccount.personIds[0]);
      const nameExists = existingAccounts.some(account => 
        account.id !== id && account.name.toLowerCase() === accountData.name!.toLowerCase()
      );
      
      if (nameExists) {
        throw new ServiceError('Un account con questo nome esiste già per questa persona', 'DUPLICATE_NAME');
      }
    }
  }
}
