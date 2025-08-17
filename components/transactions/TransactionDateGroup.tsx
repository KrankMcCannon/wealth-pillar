import { memo } from 'react';
import { Transaction } from '../../types';
import { formatDate } from '../../constants';
import { TransactionRow } from './TransactionRow';

interface TransactionDateGroupProps {
  date: string;
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
 * Componente per visualizzare un gruppo di transazioni per data
 */
export const TransactionDateGroup = memo<TransactionDateGroupProps>(({
  date,
  transactions,
  isAllView,
  isLinkingMode,
  onLinkClick,
  onSelectToLink,
  onEditClick,
  getAccountById,
  getPersonById,
  isTransactionLinkable,
  isThisLinkingTransaction
}) => {
  const formattedDate = formatDate(date);

  return (
    <div className="mb-6">
      {/* Header del gruppo con data */}
      <div className="mb-3">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">
          {formattedDate}
        </h3>
      </div>

      {/* Tabella delle transazioni per questo giorno */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="w-2/5 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Descrizione
              </th>
              {isAllView && (
                <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Persona
                </th>
              )}
              <th className="w-1/6 px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Importo
              </th>
              <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Categoria
              </th>
              <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Stato / Azioni
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map(transaction => {
              const account = getAccountById(transaction.accountId);
              const accountName = account?.name || 'Account sconosciuto';
              const person = account ? getPersonById(account.personIds[0]) : null;
              const personName = person?.name || 'Persona sconosciuta';

              return (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  accountName={accountName}
                  personName={personName}
                  isAllView={isAllView}
                  isLinkingMode={isLinkingMode}
                  isThisLinkingTx={isThisLinkingTransaction(transaction)}
                  isLinkable={isTransactionLinkable(transaction)}
                  onLinkClick={onLinkClick}
                  onSelectToLink={onSelectToLink}
                  onEditClick={onEditClick}
                  showDate={false}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

TransactionDateGroup.displayName = 'TransactionDateGroup';
