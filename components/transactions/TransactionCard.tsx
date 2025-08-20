import { memo } from "react";
import { Transaction } from "../../types";
import { formatDate } from "../../constants";
import { useFinance } from "../../hooks/core/useFinance";
import { TransactionType } from "../../types";
import { TransactionActionMenu } from './TransactionActionMenu';
import { ReconciliationModal } from "./ReconciliationModal";
import { TransactionAmount, TransactionStatusChip, TransactionAvatar } from './TransactionVisuals';
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
    const { getCategoryName } = useFinance();
    const isTransfer = transaction.category === 'trasferimento';
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const showRemainingAmount = false;
    const remainingAmount = 0;
    const transferData: any = { toAccount: { name: '' } };
    const personInitials = personName ? personName.charAt(0).toUpperCase() : '?';
    

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

    // visuals moved to TransactionVisuals (DRY)

    // Menu items per le azioni
    const reconciliationCount = reconciliation ? reconciliation.allocations.length : 0;

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
            <TransactionAvatar initials={personInitials} isIncome={isIncome} isTransfer={isTransfer} />

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
                  <TransactionAmount
                    amount={transaction.amount}
                    isTransfer={isTransfer}
                    isIncome={isIncome}
                    remainingAmount={remainingAmount}
                    showRemainingAmount={showRemainingAmount}
                    fullyReconciled={isFullyReconciled(transaction)}
                    align="right"
                  />
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
                  <TransactionStatusChip
                    isReconciled={!!transaction.isReconciled}
                    fullyReconciled={isFullyReconciled(transaction)}
                  />

                  {/* Azioni */}
                  {!isLinkingMode && (
                    <TransactionActionMenu
                      transaction={transaction}
                      isTransfer={isTransfer}
                      reconciliationCount={reconciliationCount}
                      onOpenReconcile={openReconciliationModal}
                      onEdit={onEditClick}
                      onDelete={onDeleteClick}
                    />
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
