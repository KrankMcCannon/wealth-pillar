import { memo } from "react";
import { Transaction } from "../../types";
import { TransactionCard } from "./TransactionCard";
import { formatDate } from "../../constants";
import { GroupHeader } from "./GroupHeader";

interface TransactionGroupedCardsProps {
  groupedTransactions: Array<{ date: string; transactions: Transaction[] }>;
  isAllView: boolean;
  isLinkingMode: boolean;
  linkingTx: Transaction | null;
  onLinkClick: (tx: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick?: (tx: Transaction) => void;
  onAdvancedReconciliationClick?: (tx: Transaction) => void;
  getAccountById: (id: string) => any;
  getPersonById: (id: string) => any;
  isTransactionLinkable: (tx: Transaction) => boolean;
  isThisLinkingTransaction: (tx: Transaction) => boolean;
}

/**
 * Componente per mostrare le transazioni raggruppate per data in formato card (mobile)
 */
export const TransactionGroupedCards = memo<TransactionGroupedCardsProps>(
  ({
    groupedTransactions,
    isAllView,
    isLinkingMode,
    onLinkClick,
    onSelectToLink,
    onEditClick,
    onDeleteClick,
    onAdvancedReconciliationClick,
    getAccountById,
    getPersonById,
    isTransactionLinkable,
    isThisLinkingTransaction,
  }) => {
    if (groupedTransactions.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Nessuna transazione trovata</h3>
          <p className="text-gray-500 dark:text-gray-400">Prova a modificare i filtri di ricerca</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {groupedTransactions.map(({ date, transactions }) => (
          <div key={date} className="space-y-3">
            <GroupHeader title={formatDate(date)} count={transactions.length} variant="rich" />

            {/* Cards delle transazioni */}
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const account = getAccountById(transaction.accountId);
                const person = isAllView ? getPersonById(account?.personIds?.[0]) : null;

                return (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    accountName={account?.name || "Account sconosciuto"}
                    personName={person?.name}
                    isAllView={isAllView}
                    isLinkingMode={isLinkingMode}
                    isThisLinkingTx={isThisLinkingTransaction(transaction)}
                    isLinkable={isTransactionLinkable(transaction)}
                    onLinkClick={onLinkClick}
                    onSelectToLink={onSelectToLink}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onAdvancedReconciliationClick={onAdvancedReconciliationClick}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

TransactionGroupedCards.displayName = "TransactionGroupedCards";
