import React, { memo, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { useFinance } from '../../hooks';
import { formatCurrency } from '../../constants';

/**
 * Props per RecentTransactionItem
 */
interface RecentTransactionItemProps {
  transaction: Transaction;
  accountName: string;
  personName?: string;
  isAllView: boolean;
}

/**
 * Componente RecentTransactionItem ottimizzato
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione di una transazione
 * Principio DRY: Don't Repeat Yourself - logica riutilizzabile
 */
export const RecentTransactionItem = memo<RecentTransactionItemProps>(({ 
  transaction, 
  accountName, 
  personName, 
  isAllView 
}) => {
  const { 
    getCategoryName, 
    getRemainingAmount, 
    hasAvailableAmount, 
    isParentTransaction 
  } = useFinance();

  // Memoized calculations per ottimizzare le performance
  const transactionData = useMemo(() => {
    const isTransfer = transaction.category === 'trasferimento';
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const remainingAmount = getRemainingAmount(transaction);
    const isParent = isParentTransaction(transaction);
    const showRemainingAmount = transaction.isReconciled && remainingAmount > 0;
    const shouldBlurTransaction = transaction.isReconciled && (!isParent || remainingAmount === 0);

    return {
      isTransfer,
      isIncome,
      remainingAmount,
      isParent,
      showRemainingAmount,
      shouldBlurTransaction,
      categoryName: getCategoryName(transaction.category)
    };
  }, [transaction, getCategoryName, getRemainingAmount, hasAvailableAmount, isParentTransaction]);

  const getIconColor = () => {
    if (transactionData.isTransfer) return 'text-blue-500';
    return transactionData.isIncome ? 'text-green-500' : 'text-red-500';
  };

  const getBackgroundColor = () => {
    if (transactionData.isTransfer) return 'bg-blue-100 dark:bg-blue-900';
    return transactionData.isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
  };

  const getTransactionIcon = () => {
    if (transactionData.isTransfer) return '↔️';
    return transactionData.isIncome ? '💰' : '💸';
  };

  const getAmountColor = () => {
    if (transactionData.isTransfer) return 'text-blue-600 dark:text-blue-400';
    return transactionData.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <li className={`flex items-center justify-between py-3 rounded-lg px-3 ${
      transactionData.isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' : 
      transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : ''
    } ${transactionData.shouldBlurTransaction ? 'opacity-60' : ''}`}>
      <div className="flex items-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor()}`}>
          <span className={`text-xl ${getIconColor()}`}>
            {getTransactionIcon()}
          </span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {transaction.description}
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accountName}
            </p>
            {isAllView && personName && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  {personName}
                </p>
              </>
            )}
            <span className="text-xs text-gray-400">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {transactionData.categoryName}
            </p>
          </div>
        </div>
      </div>
      <div className={`text-right font-semibold ${getAmountColor()}`}>
        <div className="flex flex-col items-end">
          <span>
            {transactionData.isTransfer ? '' : (transactionData.isIncome ? '+' : '-')} 
            {formatCurrency(transaction.amount)}
          </span>
          {transactionData.showRemainingAmount && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              {hasAvailableAmount(transaction) ? 'Disponibile' : 'Rimanente'}: 
              {formatCurrency(transactionData.remainingAmount)}
            </span>
          )}
        </div>
      </div>
    </li>
  );
});

RecentTransactionItem.displayName = 'RecentTransactionItem';
