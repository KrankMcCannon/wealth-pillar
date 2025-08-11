import React, { memo } from 'react';
import { Transaction } from '../../types';
import { TransactionDateGroup } from './TransactionDateGroup';

/**
 * Props per il componente TransactionGroupedTable
 */
interface TransactionGroupedTableProps {
  groupedTransactions: Array<{ date: string; transactions: Transaction[] }>;
  isAllView: boolean;
  isLinkingMode: boolean;
  linkingTx: Transaction | null;
  onLinkClick: (tx: Transaction) => void;
  onSelectToLink: (txId: string) => void;
  onEditClick: (tx: Transaction) => void;
  getAccountById: (id: string) => any;
  getPersonById: (id: string) => any;
  isTransactionLinkable: (tx: Transaction) => boolean;
  isThisLinkingTransaction: (tx: Transaction) => boolean;
}

/**
 * Componente per la visualizzazione raggruppata delle transazioni per data
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei gruppi
 * Principio DRY: Don't Repeat Yourself - riutilizza TransactionDateGroup per ogni gruppo
 */
export const TransactionGroupedTable = memo<TransactionGroupedTableProps>(({
  groupedTransactions,
  isAllView,
  isLinkingMode,
  linkingTx,
  onLinkClick,
  onSelectToLink,
  onEditClick,
  getAccountById,
  getPersonById,
  isTransactionLinkable,
  isThisLinkingTransaction
}) => {
  if (groupedTransactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        Nessuna transazione trovata per i filtri correnti.
      </div>
    );
  }

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
          getAccountById={getAccountById}
          getPersonById={getPersonById}
          isTransactionLinkable={isTransactionLinkable}
          isThisLinkingTransaction={isThisLinkingTransaction}
        />
      ))}
    </div>
  );
});

TransactionGroupedTable.displayName = 'TransactionGroupedTable';
