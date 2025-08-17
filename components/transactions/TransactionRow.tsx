import { memo } from 'react';
import { Transaction } from '../../types';
import { LinkIcon, PencilIcon } from '../common';
import { formatCurrency, formatDate } from '../../constants';
import { useTransactionVisual, useTransactionRowClasses } from '../../hooks/features/transactions/useTransactionVisual';
import { useFinance } from '../../hooks/core/useFinance';

interface TransactionRowProps {
  transaction: Transaction;
  accountName: string;
  personName?: string;
  isAllView: boolean;
  isLinkingMode: boolean;
  isThisLinkingTx: boolean;
  isLinkable: boolean;
  onLinkClick: (tx: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onEditClick: (tx: Transaction) => void;
  showDate?: boolean;
}

/**
 * Componente per la riga della transazione
 */
export const TransactionRow = memo<TransactionRowProps>(({
  transaction,
  accountName,
  personName,
  isAllView,
  isLinkingMode,
  isThisLinkingTx,
  isLinkable,
  onLinkClick,
  onEditClick,
  showDate = true,
}) => {
  const {
    transactionData,
    personInitials,
    iconColor,
    backgroundColor,
    directionArrow,
  } = useTransactionVisual(transaction);
  const rowClasses = useTransactionRowClasses({
    transaction,
    transactionData,
    isLinkingMode,
    isThisLinkingTx,
    isLinkable
  });
  const { getCategoryName } = useFinance();

  const {
    isTransfer,
    isIncome,
    showRemainingAmount,
    remainingAmount,
    transferData
  } = transactionData;

  return (
    <tr className={rowClasses}>
      {/* Descrizione e account */}
      <td className="w-2/5 py-3 px-4">
        <div className="flex items-center">
          {/* Cerchio con iniziali e freccia sporgente (stesso design di RecentTransactionItem) */}
          <div className="relative mr-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${backgroundColor}`}>
              <span className="text-xs font-bold text-gray-800 dark:text-white">
                {personInitials}
              </span>
            </div>
            {/* Freccia sporgente alla base */}
            <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full flex items-center justify-center ${backgroundColor} border border-white dark:border-gray-800`}>
              <span className={`text-xs ${iconColor}`}>
                {directionArrow}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTransfer ?
                `${accountName} → ${transferData.toAccount.name || 'Account sconosciuto'}` :
                accountName}
            </p>
          </div>
        </div>
      </td>

      {/* Persona (solo in vista All) */}
      {isAllView && (
        <td className="w-1/6 py-3 px-4 text-gray-600 dark:text-gray-400">
          {personName}
        </td>
      )}

      {/* Importo */}
      <td className={`w-1/6 py-3 px-4 font-mono text-right ${isTransfer ? 'text-blue-600 dark:text-blue-400' :
        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
        <div className="flex flex-col items-end">
          <span>
            {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
          </span>
          {showRemainingAmount && (
            <span className={`text-xs font-medium ${remainingAmount > 0
              ? 'text-orange-600 dark:text-orange-400'
              : 'text-gray-500 dark:text-gray-400'
              }`}>
              {remainingAmount > 0
                ? `Disponibile: ${formatCurrency(remainingAmount)}`
                : 'Completamente riconciliato'
              }
            </span>
          )}
        </div>
      </td>

      {/* Categoria */}
      <td className="w-1/6 py-3 px-4 text-gray-600 dark:text-gray-400">
        {getCategoryName(transaction.category)}
      </td>

      {/* Data (solo se showDate è true) */}
      {showDate && (
        <td className="w-1/6 py-3 px-4 text-gray-600 dark:text-gray-400">
          {formatDate(transaction.date)}
        </td>
      )}

      {/* Stato e azioni */}
      <td className="w-1/6 py-3 px-4 text-center">
        <div className="flex items-center justify-center space-x-2">
          {/* Stato riconciliazione */}
          {transaction.isReconciled ? (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
              ✓ Riconciliato
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              Aperto
            </span>
          )}

          {/* Azioni */}
          {!isLinkingMode && (
            <div className="flex space-x-1">
              {!transaction.isReconciled && !isTransfer && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLinkClick(transaction);
                  }}
                  className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                  title="Riconcilia transazione"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(transaction);
                }}
                className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Modifica transazione"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

TransactionRow.displayName = 'TransactionRow';
