import React, { memo, useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { ArrowDownIcon, ArrowUpIcon, LinkIcon, PencilIcon } from '../common';
import { formatCurrency, formatDate } from '../../constants';
import { useFinance } from '../../hooks';

/**
 * Props per il componente TransactionRow
 */
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
}

/**
 * Componente ottimizzato per la riga della transazione
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione di una transazione
 * Principio DRY: Don't Repeat Yourself - logica riutilizzabile memoizzata
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
  onSelectToLink,
  onEditClick
}) => {
  const { 
    getCategoryName, 
    getAccountById, 
    getRemainingAmount, 
    isParentTransaction 
  } = useFinance();

  // Memoizza i calcoli complessi
  const transactionData = useMemo(() => {
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const isTransfer = transaction.category === 'trasferimento';
    const toAccount = isTransfer && transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;
    const remainingAmount = getRemainingAmount(transaction);
    const isParent = isParentTransaction(transaction);
    const showRemainingAmount = transaction.isReconciled && isParent;
    const shouldBlurTransaction = transaction.isReconciled && (!isParent || remainingAmount === 0);

    return {
      isIncome,
      isTransfer,
      toAccount,
      remainingAmount,
      isParent,
      showRemainingAmount,
      shouldBlurTransaction
    };
  }, [transaction, getAccountById, getRemainingAmount, isParentTransaction]);

  // Memoizza le classi CSS
  const rowClasses = useMemo(() => {
    const { isTransfer, shouldBlurTransaction } = transactionData;
    
    return [
      "border-b border-gray-200 dark:border-gray-700",
      // Colori di background per distinguere le transazioni
      isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' : 
      transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : '',
      // Blur per transazioni collegate o principali completamente riconciliate
      shouldBlurTransaction ? 'opacity-60' : '',
      isLinkingMode ? 'transition-opacity duration-300' : '',
      isThisLinkingTx ? 'bg-blue-100 dark:bg-blue-900/50' : '',
      isLinkable ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 opacity-100' : '',
      isLinkingMode && !isLinkable && !isThisLinkingTx ? 'opacity-30' : ''
    ].join(' ');
  }, [transactionData, transaction.isReconciled, isLinkingMode, isThisLinkingTx, isLinkable]);

  const handleRowClick = () => {
    if (isLinkable) {
      onSelectToLink(transaction.id);
    }
  };

  const { isIncome, isTransfer, toAccount, remainingAmount, showRemainingAmount } = transactionData;

  return (
    <tr className={rowClasses} onClick={handleRowClick}>
      {/* Descrizione e account */}
      <td className="py-3 px-4">
        <div className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
            isTransfer ? 'bg-blue-100 dark:bg-blue-900' :
            isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          }`}>
            {isTransfer ?
              <span className="text-blue-500 text-lg">⇄</span> :
              isIncome ? 
                <ArrowDownIcon className="w-5 h-5 text-green-500" /> : 
                <ArrowUpIcon className="w-5 h-5 text-red-500" />
            }
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isTransfer ?
                `${accountName} → ${toAccount?.name || 'Account sconosciuto'}` :
                accountName
              }
            </p>
          </div>
        </div>
      </td>

      {/* Persona (solo in vista All) */}
      {isAllView && (
        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
          {personName}
        </td>
      )}

      {/* Importo */}
      <td className={`py-3 px-4 font-mono text-right ${
        isTransfer ? 'text-blue-600 dark:text-blue-400' :
        isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>
        <div className="flex flex-col items-end">
          <span>
            {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
          </span>
          {showRemainingAmount && (
            <span className={`text-xs font-medium ${
              remainingAmount > 0 
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
      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
        {getCategoryName(transaction.category)}
      </td>

      {/* Data */}
      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
        {formatDate(transaction.date)}
      </td>

      {/* Stato e azioni */}
      <td className="py-3 px-4 text-center">
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
