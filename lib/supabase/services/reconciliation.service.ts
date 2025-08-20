import { v4 as uuidv4 } from 'uuid';
import {
    ReconciliationAllocation,
    ReconciliationGroup,
    Transaction
} from '../../../types';
import { ReconciliationGroupRepository } from '../repositories/reconciliation-group.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { BaseService, ServiceError } from './base-service';

export class ReconciliationService extends BaseService<ReconciliationGroup, any> {
  private transactionRepository: TransactionRepository;

  constructor(
    reconciliationRepository: ReconciliationGroupRepository,
    transactionRepository: TransactionRepository
  ) {
    super(reconciliationRepository);
    this.transactionRepository = transactionRepository;
  }

  /**
   * Crea una riconciliazione multi-transazione
   */
  async createMultiTransactionReconciliation(
    sourceTransactionId: string,
    allocations: ReconciliationAllocation[]
  ): Promise<ReconciliationGroup> {
    // Validazioni
    await this.validateMultiTransactionReconciliation(sourceTransactionId, allocations);

    const sourceTransaction = await this.transactionRepository.getById(sourceTransactionId);
    if (!sourceTransaction) {
      throw new ServiceError('Transazione sorgente non trovata', 'NOT_FOUND');
    }

    const totalAllocatedAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const remainingAmount = Math.abs(sourceTransaction.amount) - totalAllocatedAmount;

    if (totalAllocatedAmount > Math.abs(sourceTransaction.amount)) {
      throw new ServiceError('L\'importo totale allocato non può superare l\'importo della transazione sorgente', 'INVALID_AMOUNT');
    }

    // Crea il gruppo di riconciliazione
    const reconciliationGroup: ReconciliationGroup = {
      id: uuidv4(),
      sourceTransactionId,
      allocations,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const createdGroup = await this.create(reconciliationGroup);

    // Aggiorna le transazioni target
    await this.updateTargetTransactions(allocations, sourceTransactionId);

    // Aggiorna la transazione sorgente se completamente riconciliata
    if (remainingAmount === 0) {
      await this.transactionRepository.update(sourceTransactionId, { 
        isReconciled: true,
        remainingAmount: 0
      } as Partial<Transaction>);
    } else {
      await this.transactionRepository.update(sourceTransactionId, { 
        remainingAmount 
      } as Partial<Transaction>);
    }

    return createdGroup;
  }

  /**
   * Aggiorna una riconciliazione esistente
   */
  async updateReconciliation(
    groupId: string,
    allocations: ReconciliationAllocation[]
  ): Promise<ReconciliationGroup> {
    const existingGroup = await this.getById(groupId);
    if (!existingGroup) {
      throw new ServiceError('Gruppo di riconciliazione non trovato', 'NOT_FOUND');
    }

    // Validazioni
    await this.validateMultiTransactionReconciliation(existingGroup.sourceTransactionId, allocations);

    const sourceTransaction = await this.transactionRepository.getById(existingGroup.sourceTransactionId);
    if (!sourceTransaction) {
      throw new ServiceError('Transazione sorgente non trovata', 'NOT_FOUND');
    }

    const totalAllocatedAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const remainingAmount = Math.abs(sourceTransaction.amount) - totalAllocatedAmount;

    if (totalAllocatedAmount > Math.abs(sourceTransaction.amount)) {
      throw new ServiceError('L\'importo totale allocato non può superare l\'importo della transazione sorgente', 'INVALID_AMOUNT');
    }

    // Aggiorna il gruppo
    const updatedGroup = await this.update(groupId, {
      allocations,
      updatedAt: new Date().toISOString()
    });

    // Aggiorna le transazioni target
    await this.updateTargetTransactions(allocations, existingGroup.sourceTransactionId);

    // Aggiorna la transazione sorgente
    if (remainingAmount === 0) {
      await this.transactionRepository.update(existingGroup.sourceTransactionId, { 
        isReconciled: true,
        remainingAmount: 0
      } as Partial<Transaction>);
    } else {
      await this.transactionRepository.update(existingGroup.sourceTransactionId, { 
        remainingAmount 
      } as Partial<Transaction>);
    }

    return updatedGroup;
  }

  /**
   * Elimina una riconciliazione
   */
  async deleteReconciliation(groupId: string): Promise<void> {
    const group = await this.getById(groupId);
    if (!group) {
      throw new ServiceError('Gruppo di riconciliazione non trovato', 'NOT_FOUND');
    }

    // Scollega le transazioni target
    for (const allocation of group.allocations) {
      const targetTx = await this.transactionRepository.getById(allocation.targetTransactionId);
      if (targetTx) {
        await this.transactionRepository.update(allocation.targetTransactionId, {
          isReconciled: false,
          parentTransactionId: undefined
        } as Partial<Transaction>);
      }
    }

    // Ripristina la transazione sorgente
    await this.transactionRepository.update(group.sourceTransactionId, {
      isReconciled: false,
      remainingAmount: undefined
    } as Partial<Transaction>);

    // Elimina il gruppo
    await this.delete(groupId);
  }

  /**
   * Ottiene la riconciliazione per una transazione sorgente
   */
  async getReconciliationBySourceTransaction(sourceTransactionId: string): Promise<ReconciliationGroup | null> {
    const repository = this.repository as ReconciliationGroupRepository;
    return await repository.findBySourceTransaction(sourceTransactionId);
  }

  /**
   * Ottiene tutte le riconciliazioni per una persona
   */
  async getReconciliationsByPerson(personId: string): Promise<ReconciliationGroup[]> {
    const repository = this.repository as ReconciliationGroupRepository;
    return await repository.findByPerson(personId);
  }

  /**
   * Calcola l'importo rimanente per una transazione
   */
  async calculateRemainingAmount(transactionId: string): Promise<number> {
    const reconciliation = await this.getReconciliationBySourceTransaction(transactionId);
    if (!reconciliation) {
      const transaction = await this.transactionRepository.getById(transactionId);
      return transaction ? Math.abs(transaction.amount) : 0;
    }

    const totalAllocated = reconciliation.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const transaction = await this.transactionRepository.getById(transactionId);
    const originalAmount = transaction ? Math.abs(transaction.amount) : 0;
    
    return Math.max(0, originalAmount - totalAllocated);
  }

  /**
   * Valida una riconciliazione multi-transazione
   */
  private async validateMultiTransactionReconciliation(
    sourceTransactionId: string,
    allocations: ReconciliationAllocation[]
  ): Promise<void> {
    if (!allocations || allocations.length === 0) {
      throw new ServiceError('Almeno un\'allocazione è richiesta', 'INVALID_ALLOCATION');
    }

    // Verifica che la transazione sorgente esista
    const sourceTransaction = await this.transactionRepository.getById(sourceTransactionId);
    if (!sourceTransaction) {
      throw new ServiceError('Transazione sorgente non trovata', 'NOT_FOUND');
    }

    // Verifica che le transazioni target esistano
    for (const allocation of allocations) {
      const targetTransaction = await this.transactionRepository.getById(allocation.targetTransactionId);
      if (!targetTransaction) {
        throw new ServiceError(`Transazione target ${allocation.targetTransactionId} non trovata`, 'NOT_FOUND');
      }

      // Verifica che l'importo allocato sia positivo
      if (allocation.amount <= 0) {
        throw new ServiceError('L\'importo allocato deve essere positivo', 'INVALID_AMOUNT');
      }

      // Verifica che le transazioni siano di tipo opposto
      if (sourceTransaction.type === targetTransaction.type) {
        throw new ServiceError('Non è possibile riconciliare transazioni dello stesso tipo', 'SAME_TYPE');
      }
    }

    // Verifica che non ci siano duplicati nelle transazioni target
    const targetIds = allocations.map(a => a.targetTransactionId);
    const uniqueTargetIds = new Set(targetIds);
    if (targetIds.length !== uniqueTargetIds.size) {
      throw new ServiceError('Transazioni target duplicate non sono consentite', 'DUPLICATE_TARGETS');
    }
  }

  /**
   * Aggiorna le transazioni target con la riconciliazione
   */
  private async updateTargetTransactions(
    allocations: ReconciliationAllocation[],
    sourceTransactionId: string
  ): Promise<void> {
    for (const allocation of allocations) {
      await this.transactionRepository.update(allocation.targetTransactionId, {
        isReconciled: true,
        parentTransactionId: sourceTransactionId,
        remainingAmount: allocation.amount
      } as Partial<Transaction>);
    }
  }
}
