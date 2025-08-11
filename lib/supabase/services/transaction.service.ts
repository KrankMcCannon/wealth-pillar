/**
 * Transaction Service
 * Gestisce la business logic specifica per le transazioni
 */

import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../../../types';
import { TransactionFilters, TransactionRepository } from '../repositories/transaction.repository';
import { BaseService, ServiceError } from './base-service';

export class TransactionService extends BaseService<Transaction, TransactionFilters> {
  constructor(repository: TransactionRepository) {
    super(repository);
  }

  /**
   * Crea una nuova transazione con validazioni specifiche
   */
  async createTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const transactionWithId: Transaction = {
      ...transactionData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      isReconciled: false,
    };

    return await this.create(transactionWithId);
  }

  /**
   * Ottiene transazioni per account
   */
  async getTransactionsByAccount(accountId: string): Promise<Transaction[]> {
    return await this.findByFilters({ accountId });
  }

  /**
   * Ottiene transazioni per categoria
   */
  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return await this.findByFilters({ category });
  }

  /**
   * Ottiene transazioni per periodo
   */
  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    return await this.findByFilters({ dateFrom: startDate, dateTo: endDate });
  }

  /**
   * Collega due transazioni per riconciliazione
   */
  async linkTransactions(tx1Id: string, tx2Id: string): Promise<void> {
    const tx1 = await this.getById(tx1Id);
    const tx2 = await this.getById(tx2Id);

    if (!tx1 || !tx2) {
      throw new ServiceError('Una o entrambe le transazioni non esistono', 'NOT_FOUND');
    }

    if (tx1.isReconciled || tx2.isReconciled) {
      throw new ServiceError('Una o entrambe le transazioni sono già riconciliate', 'ALREADY_RECONCILED');
    }

    // Validazioni per il linking
    await this.validateTransactionLinking(tx1, tx2);

    // Aggiorna entrambe le transazioni
    await Promise.all([
      this.update(tx1Id, { isReconciled: true, linkedTransactionId: tx2Id }),
      this.update(tx2Id, { isReconciled: true, linkedTransactionId: tx1Id })
    ]);
  }

  /**
   * Scollega transazioni riconciliate
   */
  async unlinkTransactions(txId: string): Promise<void> {
    const tx = await this.getById(txId);
    if (!tx) {
      throw new ServiceError('Transazione non trovata', 'NOT_FOUND');
    }

    if (!tx.isReconciled || !tx.linkedTransactionId) {
      throw new ServiceError('La transazione non è riconciliata', 'NOT_RECONCILED');
    }

    const linkedTx = await this.getById(tx.linkedTransactionId);
    
    // Aggiorna entrambe le transazioni
    const updates = [
      this.update(txId, { isReconciled: false, linkedTransactionId: undefined })
    ];

    if (linkedTx) {
      updates.push(
        this.update(linkedTx.id, { isReconciled: false, linkedTransactionId: undefined })
      );
    }

    await Promise.all(updates);
  }

  /**
   * Calcola l'importo effettivo di una transazione considerando la riconciliazione
   */
  getEffectiveAmount(transaction: Transaction, linkedTransaction?: Transaction): number {
    if (!transaction.isReconciled || !linkedTransaction) {
      return Math.abs(transaction.amount);
    }

    // Se la transazione ha un remainingAmount salvato, usa quello
    if (transaction.remainingAmount !== undefined) {
      return Math.abs(transaction.remainingAmount);
    }

    // Altrimenti calcola l'importo effettivo come differenza
    const remainingAmount = Math.abs(transaction.amount) - Math.abs(linkedTransaction.amount);
    return Math.max(0, remainingAmount);
  }

  /**
   * Determina se una transazione è la principale in una coppia riconciliata
   */
  isParentTransaction(transaction: Transaction, linkedTransaction?: Transaction): boolean {
    if (!transaction.isReconciled || !linkedTransaction) {
      return false;
    }

    // La transazione con importo maggiore è la principale
    if (transaction.amount !== linkedTransaction.amount) {
      return transaction.amount > linkedTransaction.amount;
    }
    
    // Se gli importi sono uguali, confronta le date
    const txDate = new Date(transaction.date);
    const linkedDate = new Date(linkedTransaction.date);
    
    if (txDate.getTime() !== linkedDate.getTime()) {
      return txDate <= linkedDate;
    }
    
    // Se anche le date sono uguali, usa il timestamp di creazione
    if (transaction.createdAt && linkedTransaction.createdAt) {
      const txCreated = new Date(transaction.createdAt);
      const linkedCreated = new Date(linkedTransaction.createdAt);
      
      if (txCreated.getTime() !== linkedCreated.getTime()) {
        return txCreated <= linkedCreated;
      }
    }
    
    // Ultimo resort: confronto lessicografico degli ID
    return transaction.id < linkedTransaction.id;
  }

  /**
   * Validazioni specifiche per la creazione di transazioni
   */
  protected async validateForCreate(transactionData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    // Validazione importo
    if (typeof transactionData.amount !== 'number' || transactionData.amount <= 0) {
      throw new ServiceError('L\'importo deve essere un numero positivo', 'INVALID_AMOUNT');
    }

    // Validazione data
    const transactionDate = new Date(transactionData.date);
    if (isNaN(transactionDate.getTime())) {
      throw new ServiceError('Data non valida', 'INVALID_DATE');
    }

    // Validazione account
    if (!transactionData.accountId || transactionData.accountId.trim() === '') {
      throw new ServiceError('Account richiesto', 'MISSING_ACCOUNT');
    }

    // Validazione categoria
    if (!transactionData.category || transactionData.category.trim() === '') {
      throw new ServiceError('Categoria richiesta', 'MISSING_CATEGORY');
    }

    // Validazione descrizione
    if (!transactionData.description || transactionData.description.trim() === '') {
      throw new ServiceError('Descrizione richiesta', 'MISSING_DESCRIPTION');
    }

    // Validazione specifica per trasferimenti
    if (transactionData.category === 'trasferimento') {
      if (!transactionData.toAccountId || transactionData.toAccountId.trim() === '') {
        throw new ServiceError('Account di destinazione richiesto per i trasferimenti', 'MISSING_TO_ACCOUNT');
      }
      
      if (transactionData.accountId === transactionData.toAccountId) {
        throw new ServiceError('L\'account di origine e destinazione non possono essere uguali', 'SAME_ACCOUNT_TRANSFER');
      }
    }
  }

  /**
   * Validazioni specifiche per l'aggiornamento di transazioni
   */
  protected async validateForUpdate(id: string, transactionData: Partial<Transaction>): Promise<void> {
    // Verifica che la transazione esista
    const existingTransaction = await this.getById(id);
    if (!existingTransaction) {
      throw new ServiceError('Transazione non trovata', 'NOT_FOUND');
    }

    // Validazione importo se fornito
    if (transactionData.amount !== undefined && (typeof transactionData.amount !== 'number' || transactionData.amount <= 0)) {
      throw new ServiceError('L\'importo deve essere un numero positivo', 'INVALID_AMOUNT');
    }

    // Validazione data se fornita
    if (transactionData.date !== undefined) {
      const transactionDate = new Date(transactionData.date);
      if (isNaN(transactionDate.getTime())) {
        throw new ServiceError('Data non valida', 'INVALID_DATE');
      }
    }
  }

  /**
   * Validazioni per il collegamento di transazioni
   */
  private async validateTransactionLinking(tx1: Transaction, tx2: Transaction): Promise<void> {
    // Non è possibile collegare una transazione a se stessa
    if (tx1.id === tx2.id) {
      throw new ServiceError('Impossibile collegare una transazione a se stessa', 'SELF_LINK');
    }

    // Validazioni di business logic per il linking
    if (tx1.type === tx2.type && tx1.category !== 'trasferimento' && tx2.category !== 'trasferimento') {
      throw new ServiceError('Non è possibile collegare due transazioni dello stesso tipo', 'SAME_TYPE_LINK');
    }

    // Altri controlli specifici del dominio possono essere aggiunti qui
  }
}
