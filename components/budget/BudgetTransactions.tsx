import React, { memo } from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { useBudgetTransactions } from '../../hooks/features/budgets/useBudgetTransactions';

interface BudgetTransactionsProps {
  transactions: Transaction[];
  budgetAmount: number;
  currentSpent: number;
}

/**
 * Componente presentazionale per mostrare le transazioni associate a un budget
 * Tutta la logica è delegata al hook useBudgetTransactions
 */
export const BudgetTransactions = memo<BudgetTransactionsProps>(({ 
  transactions, 
  budgetAmount, 
  currentSpent 
}) => {
  const { transactionsWithData, totalSpent, transactionCount } = useBudgetTransactions({ 
    transactions 
  });

  if (transactionCount === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Nessuna transazione di spesa in questo periodo di budget
        </p>
      </div>
    );
  }

  const remainingAmount = budgetAmount - currentSpent;

  return (
    <div className="space-y-4">
      {/* Header con riepilogo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-gray-800 dark:text-white">
            Transazioni Associate ({transactionCount})
          </h4>
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Totale speso: {formatCurrency(totalSpent)}
            </div>
            <div className={`text-sm font-medium ${
              remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              Rimanenti: {formatCurrency(remainingAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Lista transazioni */}
      <div className="space-y-2">
        {transactionsWithData.map((transaction) => (
          <div
            key={transaction.id}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-medium text-gray-800 dark:text-white">
                  {transaction.description}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {transaction.accountName} • {transaction.category}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {formatDate(transaction.date)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-red-600 dark:text-red-400">
                  -{formatCurrency(transaction.effectiveAmount)}
                </div>
                {transaction.effectiveAmount !== transaction.amount && (
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    (Orig: {formatCurrency(transaction.amount)})
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

BudgetTransactions.displayName = 'BudgetTransactions';
