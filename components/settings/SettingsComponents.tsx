import React, { memo } from 'react';
import { Card } from '../ui/Card';
import { PencilIcon } from '../Icons';
import { Person, Account, Budget } from '../../types';
import { formatCurrency } from '../../constants';

/**
 * Props per la sezione Profilo Utente
 */
interface UserProfileSectionProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
}

/**
 * Props per la sezione Gestione Conti
 */
interface AccountManagementProps {
  accounts: Account[];
  isAllView: boolean;
  onEditAccount: (account: Account) => void;
  onAddAccount: () => void;
  getPersonName: (id: string) => string;
  getCalculatedBalance: (accountId: string) => number;
}

/**
 * Props per la sezione Gestione Budget
 */
interface BudgetManagementProps {
  budgets: Budget[];
  isAllView: boolean;
  onEditBudget: (budget: Budget) => void;
  getPersonName: (id: string) => string;
}

/**
 * Componente per la sezione Profilo Utente
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei profili utente
 */
export const UserProfileSection = memo<UserProfileSectionProps>(({
  people,
  onEditPerson,
}) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Profilo Utente</h2>
    <p className="mb-6 text-gray-600 dark:text-gray-400">Gestisci i profili utente e l'aspetto.</p>
    <div className="space-y-4">
      {people.map(person => (
        <div key={person.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center">
            <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full" />
            <div className="ml-4">
              <p className="font-semibold text-lg text-gray-900 dark:text-white">{person.name}</p>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Colore Tema:</span>
                <div 
                  className="w-5 h-5 rounded-full ml-2 border border-gray-300 dark:border-gray-600" 
                  style={{ backgroundColor: person.themeColor }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => onEditPerson(person)}
            className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            aria-label={`Modifica ${person.name}`}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  </Card>
));

UserProfileSection.displayName = 'UserProfileSection';

/**
 * Componente per la sezione Gestione Conti
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei conti
 */
export const AccountManagementSection = memo<AccountManagementProps>(({
  accounts,
  isAllView,
  onEditAccount,
  onAddAccount,
  getPersonName,
  getCalculatedBalance,
}) => (
  <Card>
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestione Conti</h2>
      <button
        onClick={onAddAccount}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Aggiungi Conto
      </button>
    </div>
    <p className="mb-6 text-gray-600 dark:text-gray-400">Visualizza e modifica i conti per l'ambito selezionato.</p>

    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b-2 border-gray-200 dark:border-gray-600">
          <tr>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Nome Conto</th>
            {isAllView && <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Persona</th>}
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Tipo</th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Saldo</th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map(account => {
            const personNames = isAllView
              ? account.personIds.map(id => getPersonName(id)).filter(Boolean).join(', ')
              : null;
            return (
              <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{account.name}</td>
                {isAllView && <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{personNames || 'N/D'}</td>}
                <td className="py-4 px-4 text-gray-600 dark:text-gray-400 capitalize">{account.type}</td>
                <td className="py-4 px-4 text-right font-mono text-gray-800 dark:text-gray-200">
                  {formatCurrency(getCalculatedBalance(account.id))}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => onEditAccount(account)}
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                    aria-label={`Modifica ${account.name}`}
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </Card>
));

AccountManagementSection.displayName = 'AccountManagementSection';

/**
 * Componente per la sezione Gestione Budget
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione dei budget
 */
export const BudgetManagementSection = memo<BudgetManagementProps>(({
  budgets,
  isAllView,
  onEditBudget,
  getPersonName,
}) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Gestione Budget</h2>
    <p className="mb-6 text-gray-600 dark:text-gray-400">Visualizza e modifica i budget per l'ambito selezionato.</p>

    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="border-b-2 border-gray-200 dark:border-gray-600">
          <tr>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Descrizione</th>
            {isAllView && <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Persona</th>}
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Importo</th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Categorie</th>
            <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map(budget => (
            <tr key={budget.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">{budget.description}</td>
              {isAllView && (
                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                  {getPersonName(budget.personId) || 'Sconosciuto'}
                </td>
              )}
              <td className="py-4 px-4 text-right font-mono text-gray-800 dark:text-gray-200">
                {formatCurrency(budget.amount)}
              </td>
              <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                <span className="text-sm">{budget.categories.length} categorie</span>
              </td>
              <td className="py-4 px-4 text-center">
                <button
                  onClick={() => onEditBudget(budget)}
                  className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  aria-label={`Modifica ${budget.description}`}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
));

BudgetManagementSection.displayName = 'BudgetManagementSection';
