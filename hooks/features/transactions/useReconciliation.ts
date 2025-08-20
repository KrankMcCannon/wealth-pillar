import { useUser } from '@clerk/clerk-react';
import { useCallback, useRef, useState } from 'react';
import { useClerkSupabaseClient } from '../../../lib/supabase/client';
import { ServiceFactory } from '../../../lib/supabase/services/service-factory';
import { Person, ReconciliationGroup, Transaction } from '../../../types';

/**
 * Hook unificato per gestire la riconciliazione
 * Principio SRP: Single Responsibility - gestisce solo la logica di riconciliazione
 */
export const useReconciliation = () => {
  console.log('useReconciliation: Hook created/recreated');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceTransaction, setSourceTransaction] = useState<Transaction | null>(null);
  const [reconciliation, setReconciliation] = useState<ReconciliationGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Cache per evitare chiamate duplicate
  const transactionsCache = useRef<Record<string, Transaction[]>>({});
  
  // Ottieni il client Supabase e l'userId
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const userId = user?.id;

  /**
   * Apre il modale di riconciliazione
   */
  const openReconciliationModal = useCallback((transaction: Transaction) => {
    setSourceTransaction(transaction);
    setIsModalOpen(true);
    loadReconciliation(transaction);
  }, []);

  /**
   * Chiude il modale di riconciliazione
   */
  const closeReconciliationModal = useCallback(() => {
    setIsModalOpen(false);
    setSourceTransaction(null);
    setReconciliation(null);
  }, []);

  /**
   * Carica i dati di riconciliazione per una transazione
   */
  const loadReconciliation = useCallback(async (transaction: Transaction) => {
    if (!transaction.isReconciled) {
      setReconciliation(null);
      return;
    }

    setIsLoading(true);
    try {
      const reconciliationService = ServiceFactory.createReconciliationService();
      const reconciliationData = await reconciliationService.getReconciliationBySourceTransaction(transaction.id);
      setReconciliation(reconciliationData);
    } catch (error) {
      console.error('Errore nel caricamento della riconciliazione:', error);
      setReconciliation(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carica le persone disponibili
   */
  const loadPersons = useCallback(async (): Promise<Person[]> => {
    if (!supabase || !userId) return [];
    
    try {
      const financeService = ServiceFactory.createFinanceService(supabase, userId);
      const persons = await financeService.getPeopleByUserGroup();
      return persons || [];
    } catch (error) {
      console.error('Errore nel caricamento delle persone:', error);
      return [];
    }
  }, [supabase, userId]);

  /**
   * Carica le transazioni disponibili per una persona
   */
  const loadTransactionsForPerson = useCallback(async (personId: string): Promise<Transaction[]> => {
    if (!sourceTransaction || !supabase || !userId) {
      console.log('Missing required data for loadTransactionsForPerson:', { sourceTransaction: !!sourceTransaction, supabase: !!supabase, userId });
      return [];
    }

    // Cache per evitare chiamate duplicate
    const cacheKey = `${personId}-${sourceTransaction.id}`;
    if (transactionsCache.current[cacheKey]) {
      console.log('Using cached transactions for person:', personId);
      return transactionsCache.current[cacheKey];
    }

    try {
      console.log('Loading transactions for person:', personId, 'sourceTransaction:', sourceTransaction.id);
      setIsLoading(true);
      const transactionService = ServiceFactory.createTransactionService();
      const financeService = ServiceFactory.createFinanceService(supabase, userId);
      
      // Ottieni tutti gli account della persona
      const accounts = await financeService.accounts.getAccountsByPerson(personId);
      console.log('Accounts found for person:', accounts.length);
      const accountIds = accounts.map(acc => acc.id);

      // Ottieni tutte le transazioni degli account della persona
      const allTransactions = await Promise.all(
        accountIds.map(async accountId => {
          const transactions = await transactionService.findByFilters({ accountId });
          console.log(`Transactions for account ${accountId}:`, transactions.length);
          return transactions;
        })
      );

      // Filtra le transazioni disponibili per riconciliazione
      const flatTransactions = allTransactions.flat();
      console.log('Total transactions found:', flatTransactions.length);
      
      const availableTransactions = flatTransactions.filter(tx => {
        if (tx.id === sourceTransaction.id) {
          console.log('Filtering out source transaction:', tx.id);
          return false;
        }
        if (tx.category === 'trasferimento') {
          console.log('Filtering out transfer transaction:', tx.id);
          return false;
        }
        if (tx.isReconciled && tx.remainingAmount === 0) {
          console.log('Filtering out fully reconciled transaction:', tx.id);
          return false;
        }
        
        const sourceType = sourceTransaction.amount > 0 ? 'income' : 'expense';
        const txType = tx.amount > 0 ? 'income' : 'expense';
        
        const isOppositeType = sourceType !== txType;
        if (!isOppositeType) {
          console.log('Filtering out same type transaction:', tx.id, { sourceType, txType });
        }
        
        return isOppositeType;
      });

      console.log('Available transactions for reconciliation:', availableTransactions.length);
      
      // Cache il risultato
      transactionsCache.current[cacheKey] = availableTransactions;
      
      return availableTransactions;
    } catch (error) {
      console.error('Errore nel caricamento delle transazioni:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [sourceTransaction, supabase, userId]);

  /**
   * Esegue la riconciliazione
   */
  const executeReconciliation = useCallback(async (
    allocations: { targetTransactionId: string; amount: number; personId?: string }[]
  ) => {
    if (!sourceTransaction || allocations.length === 0) return;

    try {
      setIsLoading(true);
      const reconciliationService = ServiceFactory.createReconciliationService();
      
      await reconciliationService.createMultiTransactionReconciliation(
        sourceTransaction.id,
        allocations
      );

      closeReconciliationModal();
      return true;
    } catch (error) {
      console.error('Errore nell\'esecuzione della riconciliazione:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [sourceTransaction, closeReconciliationModal]);

  /**
   * Determina se una transazione è completamente riconciliata
   */
  const isFullyReconciled = useCallback((transaction: Transaction): boolean => {
    if (!transaction.isReconciled) return false;
    
    if (reconciliation) {
      const totalAllocated = reconciliation.allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
      const originalAmount = Math.abs(transaction.amount);
      return totalAllocated === originalAmount;
    }
    
    return transaction.isReconciled;
  }, [reconciliation]);

  return {
    // Stato
    isModalOpen,
    sourceTransaction,
    reconciliation,
    isLoading,

    // Azioni
    openReconciliationModal,
    closeReconciliationModal,
    loadPersons,
    loadTransactionsForPerson,
    executeReconciliation,
    isFullyReconciled
  };
};
