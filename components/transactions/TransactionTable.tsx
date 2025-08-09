import React, { memo } from 'react';
import { Transaction } from '../../types';
import { TransactionRow } from './TransactionRow';

/**
 * Props per il componente TransactionTable
 */
interface TransactionTableProps {
  transactions: Transaction[];
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
 * Componente per la tabella delle transazioni
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione della tabella
 * Principio DRY: Don't Repeat Yourself - riutilizza TransactionRow per ogni riga
 */
export const TransactionTable = memo<TransactionTableProps>(({
  transactions,
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
  if (transactions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        Nessuna transazione trovata per i filtri correnti.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b-2 border-gray-200 dark:border-gray-600">
          <tr>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
              Descrizione
            </th>
            {isAllView && (
              <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
                Persona
              </th>
            )}
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">
              Importo
            </th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
              Categoria
            </th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">
              Data
            </th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">
              Stato
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => {
            const account = getAccountById(tx.accountId);
            const personNames = account
              ? account.personIds.map((id: string) => getPersonById(id)?.name).filter(Boolean).join(', ')
              : null;
            
            return (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                accountName={account?.name || 'Sconosciuto'}
                personName={personNames}
                isAllView={isAllView}
                isLinkingMode={isLinkingMode}
                isThisLinkingTx={isThisLinkingTransaction(tx)}
                isLinkable={isTransactionLinkable(tx)}
                onLinkClick={onLinkClick}
                onSelectToLink={onSelectToLink}
                onEditClick={onEditClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

TransactionTable.displayName = 'TransactionTable';
