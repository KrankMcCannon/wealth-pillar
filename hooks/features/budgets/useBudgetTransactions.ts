import { useMemo } from "react";
import { Transaction } from "../../../types";
import { BudgetService } from "../../../lib/services/budget.service";
import { useFinance } from "../../core/useFinance";

interface UseBudgetTransactionsProps {
  transactions: Transaction[];
}

/**
 * Hook semplificato per le transazioni del budget
 * Utilizza il BudgetService per i calcoli
 */
export const useBudgetTransactions = ({ transactions }: UseBudgetTransactionsProps) => {
  const { getAccountById, getEffectiveTransactionAmount } = useFinance();

  // Calcola i dati derivati per ogni transazione
  const transactionsWithData = useMemo(() => {
    return transactions
      .map((transaction) => {
        const account = getAccountById(transaction.accountId);
        const effectiveAmount = getEffectiveTransactionAmount(transaction);

        return {
          ...transaction,
          accountName: account?.name || "Conto sconosciuto",
          effectiveAmount: Math.abs(effectiveAmount),
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, getAccountById, getEffectiveTransactionAmount]);

  // Calcola il totale speso usando il service
  const totalSpent = useMemo(() => {
    return BudgetService.calculateTotalSpent(transactions, getEffectiveTransactionAmount);
  }, [transactions, getEffectiveTransactionAmount]);

  return {
    transactionsWithData,
    totalSpent,
    transactionCount: transactions.length,
  };
};
