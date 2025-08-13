import { useMemo } from 'react';
import { Transaction } from '../../../types';
import { useFinance } from '../../core/useFinance';

interface UseBudgetTransactionsProps {
  transactions: Transaction[];
}

/**
 * Hook per gestire la logica delle transazioni associate al budget
 * Calcola i dati derivati per la visualizzazione
 */
export const useBudgetTransactions = ({ transactions }: UseBudgetTransactionsProps) => {
  const { getAccountById, getEffectiveTransactionAmount } = useFinance();

  // Calcola i dati derivati per ogni transazione
  const transactionsWithData = useMemo(() => {
    return transactions.map(transaction => {
      const account = getAccountById(transaction.accountId);
      const effectiveAmount = getEffectiveTransactionAmount(transaction);
      
      return {
        ...transaction,
        accountName: account?.name || 'Conto sconosciuto',
        effectiveAmount: Math.abs(effectiveAmount),
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, getAccountById, getEffectiveTransactionAmount]);

  // Calcola il totale speso
  const totalSpent = useMemo(() => {
    return transactionsWithData.reduce((sum, tx) => sum + tx.effectiveAmount, 0);
  }, [transactionsWithData]);

  return {
    transactionsWithData,
    totalSpent,
    transactionCount: transactions.length
  };
};
