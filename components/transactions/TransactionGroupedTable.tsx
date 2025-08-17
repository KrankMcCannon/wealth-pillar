import { memo } from "react";
import { Transaction } from "../../types";
import { TransactionDateGroup } from "./TransactionDateGroup";
import { TransactionGroupedCards } from "./TransactionGroupedCards";
import { useBreakpoint } from "../../hooks/ui/useResponsive";

interface TransactionGroupedTableProps {
  groupedTransactions: Array<{ date: string; transactions: Transaction[] }>;
  isAllView: boolean;
  isLinkingMode: boolean;
  linkingTx: Transaction | null;
  onLinkClick: (tx: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onEditClick: (tx: Transaction) => void;
  onDeleteClick?: (tx: Transaction) => void;
  getAccountById: (id: string) => any;
  getPersonById: (id: string) => any;
  isTransactionLinkable: (tx: Transaction) => boolean;
  isThisLinkingTransaction: (tx: Transaction) => boolean;
}

/**
 * Componente per la visualizzazione raggruppata delle transazioni per data
 */
export const TransactionGroupedTable = memo<TransactionGroupedTableProps>(
  ({
    groupedTransactions,
    isAllView,
    isLinkingMode,
    linkingTx,
    onLinkClick,
    onSelectToLink,
    onEditClick,
    onDeleteClick,
    getAccountById,
    getPersonById,
    isTransactionLinkable,
    isThisLinkingTransaction,
  }) => {
    const { isMobile, isTablet } = useBreakpoint();
    const isMobileView = isMobile || isTablet;

    if (groupedTransactions.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          Nessuna transazione trovata per i filtri correnti.
        </div>
      );
    }

    // Vista mobile/tablet con cards
    if (isMobileView) {
      return (
        <TransactionGroupedCards
          groupedTransactions={groupedTransactions}
          isAllView={isAllView}
          isLinkingMode={isLinkingMode}
          linkingTx={linkingTx}
          onLinkClick={onLinkClick}
          onSelectToLink={onSelectToLink}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          getAccountById={getAccountById}
          getPersonById={getPersonById}
          isTransactionLinkable={isTransactionLinkable}
          isThisLinkingTransaction={isThisLinkingTransaction}
        />
      );
    }

    // Vista desktop con tabella
    return (
      <div className="space-y-6">
        {groupedTransactions.map(({ date, transactions }) => (
          <TransactionDateGroup
            key={date}
            date={date}
            transactions={transactions}
            isAllView={isAllView}
            isLinkingMode={isLinkingMode}
            linkingTx={linkingTx}
            onLinkClick={onLinkClick}
            onSelectToLink={onSelectToLink}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
            getAccountById={getAccountById}
            getPersonById={getPersonById}
            isTransactionLinkable={isTransactionLinkable}
            isThisLinkingTransaction={isThisLinkingTransaction}
          />
        ))}
      </div>
    );
  }
);

TransactionGroupedTable.displayName = "TransactionGroupedTable";
