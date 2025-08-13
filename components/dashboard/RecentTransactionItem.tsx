import React, { memo } from 'react';
import { Transaction } from '../../types';
import { useFinance } from '../../hooks';
import { formatCurrency, formatDate } from '../../constants';
import { useTransactionDisplay } from '../../hooks/ui/useTransactionDisplay';
import { CategoryUtils } from '../../lib/utils/category.utils';

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
}) => {
  const { hasAvailableAmount, getAccountById, getPersonById, categories: categoryOptions } = useFinance();

  // Usa il nuovo hook centralizzato per i calcoli della transazione
  const transactionData = useTransactionDisplay(transaction);

  // Calcola le iniziali della persona
  const getPersonInitials = () => {
    const account = getAccountById(transaction.accountId);
    if (!account || account.personIds.length === 0) return '?';

    const person = getPersonById(account.personIds[0]);
    if (!person) return '?';

    return person.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getIconColor = () => {
    if (transactionData.isTransfer) return 'text-blue-500';
    return transactionData.isIncome ? 'text-green-500' : 'text-red-500';
  };

  const getBackgroundColor = () => {
    if (transactionData.isTransfer) return 'bg-blue-100 dark:bg-blue-900';
    return transactionData.isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900';
  };

  const getDirectionArrow = () => {
    if (transactionData.isTransfer) return '⇄'; // Freccia bidirezionale più elegante
    return transactionData.isIncome ? '→' : '←';
  };

  const getAmountColor = () => {
    if (transactionData.isTransfer) return 'text-blue-600 dark:text-blue-400';
    return transactionData.isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <li className={`flex items-center justify-between py-3 rounded-lg px-3 ${transactionData.isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' :
        transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : ''
      } ${transactionData.shouldBlurTransaction ? 'opacity-60' : ''}`}>
      <div className="flex items-center">
        {/* Cerchio con iniziali e freccia sporgente */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBackgroundColor()}`}>
            <span className="text-xs font-bold text-gray-800 dark:text-white">
              {getPersonInitials()}
            </span>
          </div>
          {/* Freccia sporgente alla base */}
          <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center ${getBackgroundColor()} border border-white dark:border-gray-800`}>
            <span className={`text-xs ${getIconColor()}`}>
              {getDirectionArrow()}
            </span>
          </div>
        </div>

        <div className="ml-3">
          <p className="text-sm font-medium text-gray-800 dark:text-white">
            {transaction.description}
          </p>
          <div className="flex items-center space-x-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(transaction.date)}
            </p>
            <span className="text-xs text-gray-400">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {accountName}
            </p>
            <span className="text-xs text-gray-400">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {CategoryUtils.getCategoryDisplayName(transaction.category, categoryOptions)}
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
