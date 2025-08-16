import { memo } from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { useTransactionVisual } from '../../hooks/features/transactions/useTransactionVisual';
import { CategoryUtils } from '../../lib/utils/category.utils';
import { useFinance } from '../../hooks/core/useFinance';

/**
 * Props per RecentTransactionItem
 */
interface RecentTransactionItemProps {
  transaction: Transaction;
  accountName: string;
}

/**
 * Componente RecentTransactionItem
 */
export const RecentTransactionItem = memo<RecentTransactionItemProps>(({ transaction, accountName }) => {
  const {
    transactionData,
    personInitials,
    iconColor,
    backgroundColor,
    directionArrow,
    amountColor
  } = useTransactionVisual(transaction);
  const { categories, hasAvailableAmount } = useFinance();

  return (
    <li className={`flex items-center justify-between py-3 rounded-lg px-3 ${transactionData.isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' :
        transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : ''
      } ${transactionData.shouldBlurTransaction ? 'opacity-60' : ''}`}>
      <div className="flex items-center">
        {/* Cerchio con iniziali e freccia sporgente */}
        <div className="relative">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${backgroundColor}`}>
            <span className="text-xs font-bold text-gray-800 dark:text-white">
              {personInitials}
            </span>
          </div>
          {/* Freccia sporgente alla base */}
          <div className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center ${backgroundColor} border border-white dark:border-gray-800`}>
            <span className={`text-xs ${iconColor}`}>
              {directionArrow}
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
              {CategoryUtils.getCategoryDisplayName(transaction.category, categories)}
            </p>
          </div>
        </div>
      </div>
      <div className={`text-right font-semibold ${amountColor}`}>
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
