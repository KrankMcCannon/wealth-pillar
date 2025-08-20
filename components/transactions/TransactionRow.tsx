import { memo } from "react";
import { Transaction } from "../../types";
import { LinkIcon, PencilIcon, TrashIcon, ChevronDownIcon } from "../common";
import { formatCurrency, formatDate } from "../../constants";
import { useTransactions } from "../../hooks";
import { DropdownMenu } from "../ui";
import { ReconciliationModal } from "./ReconciliationModal";
import { useReconciliation } from "../../hooks/features/transactions/useReconciliation";

interface TransactionRowProps {
  transaction: Transaction;
  accountName: string;
  personName?: string;
  isAllView?: boolean;
  isLinkingMode?: boolean;
  isThisLinkingTx?: boolean;
  isLinkable?: boolean;
  onLinkClick: (transaction: Transaction) => void;
  onEditClick: (transaction: Transaction) => void;
  onDeleteClick?: (transaction: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onAdvancedReconciliationClick?: (tx: Transaction) => void;
  showDate?: boolean;
}

/**
 * Componente per la riga della transazione
 */
export const TransactionRow = memo<TransactionRowProps>(
  ({
    transaction,
    accountName,
    personName,
    isAllView,
    isLinkingMode,
    isThisLinkingTx,
    isLinkable,
    onLinkClick,
    onEditClick,
    onDeleteClick,
    onAdvancedReconciliationClick,
    showDate = true,
  }) => {
    const { getTransactionVisual, getCategoryName } = useTransactions();
    const { transactionData, personAvatarIcon, personInitials, iconColor, backgroundColor, directionArrow } = getTransactionVisual(transaction);
    const { isTransfer, isIncome, showRemainingAmount, remainingAmount, transferData } = transactionData;
    
    // Hook per la riconciliazione
    const {
      isModalOpen,
      sourceTransaction,
      reconciliation,
      isLoading,
      openReconciliationModal,
      closeReconciliationModal,
      loadPersons,
      loadTransactionsForPerson,
      executeReconciliation,
      isFullyReconciled
    } = useReconciliation();

    // Determina le classi della riga basate sulla riconciliazione
    const getRowClasses = () => {
      const baseClasses = "transition-all duration-200";
      
      if (isLinkingMode && isLinkable) {
        return `${baseClasses} hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer`;
      }
      
      if (isThisLinkingTx) {
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30`;
      }
      
      // Blur solo se completamente riconciliata
      if (isFullyReconciled(transaction)) {
        return `${baseClasses} opacity-60`;
      }
      
      return baseClasses;
    };

    // Menu items per le azioni
    const getMenuItems = () => {
      const items = [];

      // Aggiungi opzione per mostrare transazioni riconciliate se esistono
      if (reconciliation && reconciliation.allocations.length > 0) {
        const count = reconciliation.allocations.length;
        const reconciledText = count === 1 
          ? 'Mostra transazione riconciliata' 
          : `Mostra ${count} transazioni riconciliate`;
        
        items.push({
          label: reconciledText,
          onClick: () => {
            // TODO: Implementare visualizzazione transazioni riconciliate
            console.log('Mostra transazioni riconciliate:', reconciliation);
          },
          icon: <ChevronDownIcon className="w-4 h-4" />,
          className: "text-blue-600 dark:text-blue-400",
        });
      }

      // Aggiungi opzioni di riconciliazione se non è riconciliata
      if (!transaction.isReconciled && !isTransfer) {
        items.push({
          label: "Riconcilia",
          onClick: () => openReconciliationModal(transaction),
          icon: <LinkIcon className="w-4 h-4" />,
          className: "text-purple-600 dark:text-purple-400",
        });
      }

      // Aggiungi opzioni standard
      items.push({
        label: "Modifica transazione",
        onClick: () => onEditClick(transaction),
        icon: <PencilIcon className="w-4 h-4" />,
      });

      if (onDeleteClick) {
        items.push({
          label: "Elimina transazione",
          onClick: () => onDeleteClick(transaction),
          icon: <TrashIcon className="w-4 h-4" />,
          className: "text-red-600 dark:text-red-400",
        });
      }

      return items;
    };

    return (
      <>
        <tr className={getRowClasses()}>
          {/* Descrizione e account */}
          <td className="w-2/5 py-3 px-4">
            <div className="flex items-center">
              {/* Cerchio con iniziali e freccia sporgente */}
              <div className="relative mr-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${backgroundColor} overflow-hidden`}>
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
              {/* Mostra importo rimanente solo se non è completamente riconciliata */}
              {showRemainingAmount && !isFullyReconciled(transaction) && remainingAmount > 0 && (
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                  Disponibile: {formatCurrency(remainingAmount)}
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
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isFullyReconciled(transaction)
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
                }`}>
                  {isFullyReconciled(transaction) ? '✓ Completamente riconciliato' : '✓ Parzialmente riconciliato'}
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  Aperto
                </span>
              )}

              {/* Azioni */}
              {!isLinkingMode && (
                <DropdownMenu items={getMenuItems()} />
              )}
            </div>
          </td>
        </tr>

        {/* Modale per la riconciliazione */}
        <ReconciliationModal
          isOpen={isModalOpen}
          onClose={closeReconciliationModal}
          sourceTransaction={sourceTransaction}
          onReconciliationComplete={() => {
            // TODO: Refresh dei dati
            console.log('Riconciliazione completata');
          }}
          loadPersons={loadPersons}
          loadTransactionsForPerson={loadTransactionsForPerson}
          executeReconciliation={executeReconciliation}
          isLoading={isLoading}
        />
      </>
    );
  }
);

TransactionRow.displayName = "TransactionRow";
