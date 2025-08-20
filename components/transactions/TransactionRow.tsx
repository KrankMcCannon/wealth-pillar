import { memo } from "react";
import { Transaction, TransactionType } from "../../types";
import { formatDate } from "../../constants";
import { useFinance } from "../../hooks/core/useFinance";
import { TransactionActionMenu } from './TransactionActionMenu';
import { ReconciliationModal } from "./ReconciliationModal";
import { TransactionAmount, TransactionStatusChip, TransactionAvatar } from './TransactionVisuals';
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
    const { getCategoryName } = useFinance();
    const isTransfer = transaction.category === 'trasferimento';
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const showRemainingAmount = false;
    const remainingAmount = 0;
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
    const reconciliationCount = reconciliation ? reconciliation.allocations.length : 0;

    return (
      <>
        <tr className={getRowClasses()}>
          {/* Descrizione e account */}
          <td className="w-2/5 py-3 px-4">
            <div className="flex items-center">
              <div className="mr-3">
                <TransactionAvatar initials={personInitials} isIncome={isIncome} isTransfer={isTransfer} />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {accountName}
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
          <td className={`w-1/6 py-3 px-4`}>
            <TransactionAmount
              amount={transaction.amount}
              isTransfer={isTransfer}
              isIncome={isIncome}
              remainingAmount={remainingAmount}
              showRemainingAmount={showRemainingAmount}
              fullyReconciled={isFullyReconciled(transaction)}
              align="right"
            />
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
