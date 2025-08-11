import { useMemo } from 'react';
import { CategoryUtils } from '../../lib/utils/category.utils';
import { TransactionStateCalculator } from '../../lib/utils/transaction.utils';
import { Transaction } from '../../types';
import { useFinance } from '../core/useFinance';

/**
 * Hook riutilizzabile per calcolare i dati di visualizzazione delle transazioni
 * Elimina la duplicazione di logica tra TransactionRow e RecentTransactionItem
 */
export const useTransactionDisplay = (transaction: Transaction) => {
  const { 
    getCategoryName, 
    getAccountById, 
    getRemainingAmount, 
    isParentTransaction 
  } = useFinance();

  // Memoizza tutti i calcoli di stato della transazione
  const transactionState = useMemo(() => 
    TransactionStateCalculator.calculateTransactionData(
      transaction, 
      getRemainingAmount, 
      isParentTransaction
    ), 
    [transaction, getRemainingAmount, isParentTransaction]
  );

  // Memoizza le proprietà visive
  const visualProperties = useMemo(() => {
    const isTransfer = CategoryUtils.isTransfer(transaction);
    const baseVisual = TransactionStateCalculator.calculateVisualProperties(transaction);
    
    // Override per trasferimenti
    if (isTransfer) {
      return {
        ...baseVisual,
        iconColor: 'text-blue-500',
        backgroundColor: 'bg-blue-100 dark:bg-blue-900',
        amountColor: 'text-blue-600 dark:text-blue-400',
        icon: '↔️'
      };
    }
    
    return baseVisual;
  }, [transaction]);

  // Memoizza i dati dell'account di destinazione per trasferimenti
  const transferData = useMemo(() => {
    const isTransfer = CategoryUtils.isTransfer(transaction);
    
    if (!isTransfer || !transaction.toAccountId) {
      return null;
    }
    
    const toAccount = getAccountById(transaction.toAccountId);
    return {
      toAccount,
      toAccountName: toAccount?.name || 'Account sconosciuto'
    };
  }, [transaction, getAccountById]);

  // Dati combinati per la visualizzazione
  const displayData = useMemo(() => ({
    ...transactionState,
    ...visualProperties,
    isTransfer: CategoryUtils.isTransfer(transaction),
    categoryName: getCategoryName(transaction.category),
    transferData
  }), [transactionState, visualProperties, transaction, getCategoryName, transferData]);

  return displayData;
};
