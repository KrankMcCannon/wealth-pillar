import { memo } from "react";
import { Transaction } from "../../types";
import { LinkIcon, PencilIcon, TrashIcon, ChevronDownIcon } from "../common";
import { formatCurrency, formatDate } from "../../constants";
import { useTransactions } from "../../hooks";
import { DropdownMenu } from "../ui";
import { ReconciliationModal } from "./ReconciliationModal";
import { useReconciliation } from "../../hooks/features/transactions/useReconciliation";

interface TransactionCardProps {
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
  onDeleteClick?: (tx: Transaction) => void;
  onAdvancedReconciliationClick?: (tx: Transaction) => void;
}

/**
 * Componente card per la transazione (vista mobile)
 */
export const TransactionCard = memo<TransactionCardProps>(
  ({
    transaction,
    accountName,
    personName,
    isAllView,
    isLinkingMode,
    isThisLinkingTx,
    isLinkable,
    onLinkClick,
    onSelectToLink,
    onEditClick,
    onDeleteClick,
    onAdvancedReconciliationClick,
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

    // Determina le classi della card basate sulla riconciliazione
    const getCardClasses = () => {
      const baseClasses = "rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3 transition-all duration-300";
      
      if (isLinkingMode && isLinkable) {
        return `${baseClasses} hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer`;
      }
      
      if (isThisLinkingTx) {
        return `${baseClasses} ring-2 ring-blue-500`;
      }
      
      // Blur solo se completamente riconciliata
      if (isFullyReconciled(transaction)) {
        return `${baseClasses} opacity-60`;
      }
      
      return `${baseClasses} bg-white dark:bg-gray-800`;
    };

    const getStatusColor = () => {
      if (transaction.isReconciled) {
        return isFullyReconciled(transaction)
          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
          : "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300";
      }
      return "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300";
    };

    const getAmountColor = () => {
      if (isTransfer) return "text-blue-600 dark:text-blue-400";
      if (isIncome) return "text-green-600 dark:text-green-400";
      return "text-red-600 dark:text-red-400";
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
        <div
          className={getCardClasses()}
          onClick={() => {
            if (isLinkingMode && isLinkable) {
              onSelectToLink(transaction.id);
            }
          }}
        >
          {/* Header con avatar e descrizione */}
          <div className="flex items-start space-x-3">
            {/* Cerchio con avatar/iniziali e freccia sporgente */}
            <div className="relative flex-shrink-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${backgroundColor} overflow-hidden`}
              >
                {personAvatarIcon ? (
                  <span className="text-lg font-bold text-gray-800 dark:text-white">{personAvatarIcon}</span>
                ) : (
                  <span className="text-lg font-bold text-gray-800 dark:text-white">{personInitials}</span>
                )}
              </div>
              {/* Freccia sporgente alla base */}
              <div
                className={`absolute -right-1 -bottom-1 w-5 h-5 rounded-full flex items-center justify-center ${backgroundColor} border border-white dark:border-gray-800`}
              >
                <span className={`text-xs ${iconColor}`}>{directionArrow}</span>
              </div>
            </div>

            {/* Contenuto principale */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {transaction.description}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isTransfer
                      ? `${accountName} → ${transferData.toAccount.name || "Account sconosciuto"}`
                      : accountName}
                  </p>
                  {isAllView && personName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{personName}</p>
                  )}
                </div>

                {/* Importo */}
                <div className="flex-shrink-0 ml-3 text-right">
                  <p className={`text-sm font-semibold ${getAmountColor()}`}>
                    {isTransfer ? "" : isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
                  </p>
                  {/* Mostra importo rimanente solo se non è completamente riconciliata */}
                  {showRemainingAmount && !isFullyReconciled(transaction) && remainingAmount > 0 && (
                    <p className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      Disponibile: {formatCurrency(remainingAmount)}
                    </p>
                  )}
                </div>
              </div>

              {/* Metadati */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getCategoryName(transaction.category)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                  </span>
                </div>

                {/* Stato e azioni */}
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {transaction.isReconciled 
                      ? (isFullyReconciled(transaction) ? '✓ Completamente riconciliato' : '✓ Parzialmente riconciliato')
                      : 'Aperto'
                    }
                  </span>

                  {/* Azioni */}
                  {!isLinkingMode && (
                    <DropdownMenu items={getMenuItems()} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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

TransactionCard.displayName = "TransactionCard";
