import { memo } from "react";
import { Transaction, TransactionType } from "../../types";
import { formatCurrency, formatDate } from "../../constants";
import { useTransactions } from "../../hooks";
import { CategoryUtils } from "../../lib/utils/category.utils";
import { useFinance } from "../../hooks/core/useFinance";

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
  const { getTransactionRowClasses } = useTransactions();
  const { categories } = useFinance();
  
  const isIncome = transaction.type === TransactionType.ENTRATA;
  const isTransfer = CategoryUtils.isTransfer(transaction);
  const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  const backgroundColor = 'bg-gray-100 dark:bg-gray-700';
  const personInitials = 'U'; // Default user initial

  return (
    <li
      className={`flex items-center justify-between py-2 lg:py-3 rounded-lg px-2 lg:px-3 ${
        isTransfer
          ? "bg-blue-50 dark:bg-blue-900/20"
          : transaction.isReconciled
          ? "bg-green-50 dark:bg-green-900/20"
          : ""
      }`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {/* Cerchio con avatar/iniziali e freccia sporgente */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center ${backgroundColor} overflow-hidden`}
          >
            <span className="text-base lg:text-lg font-bold text-gray-800 dark:text-white">{personInitials}</span>
          </div>
          {/* Freccia sporgente alla base */}
          <div
            className={`absolute -right-1 -bottom-1 w-4 h-4 lg:w-5 lg:h-5 rounded-full flex items-center justify-center ${backgroundColor} border border-white dark:border-gray-800`}
          >
            <span className="text-xs">{isIncome ? '↑' : '↓'}</span>
          </div>
        </div>

        <div className="ml-2 lg:ml-3 flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{transaction.description}</p>
          <div className="flex flex-wrap items-center gap-1 lg:gap-2 mt-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(transaction.date)}</p>
            <span className="text-xs text-gray-400 hidden sm:inline">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{accountName}</p>
            <span className="text-xs text-gray-400 hidden sm:inline">•</span>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {CategoryUtils.getCategoryDisplayName(transaction.category, categories)}
            </p>
          </div>
        </div>
      </div>
      <div className={`text-right font-semibold ${amountColor} flex-shrink-0 ml-2`}>
        <span className="text-sm lg:text-base">
          {isTransfer ? "" : isIncome ? "+" : "-"}
          {formatCurrency(Math.abs(transaction.amount))}
        </span>
      </div>
    </li>
  );
});

RecentTransactionItem.displayName = "RecentTransactionItem";
