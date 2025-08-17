import { memo } from "react";
import { Card } from "../ui";
import { PencilIcon } from "../common";
import { Person, Account, Budget } from "../../types";
import { formatCurrency } from "../../constants";

interface UserProfileSectionProps {
  people: Person[];
  onEditPerson: (person: Person) => void;
}

interface AccountManagementProps {
  accounts: Account[];
  isAllView: boolean;
  onEditAccount: (account: Account) => void;
  onAddAccount: () => void;
  getPersonName: (id: string) => string;
  getCalculatedBalanceSync: (accountId: string) => number;
}

interface BudgetManagementProps {
  budgets: Budget[];
  isAllView: boolean;
  onEditBudget: (budget: Budget) => void;
  getPersonName: (id: string) => string;
}

/**
 * Componente per la sezione Profilo Utente
 */
export const UserProfileSection = memo<UserProfileSectionProps>(({ people, onEditPerson }) => (
  <Card>
    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Profilo Utente</h2>
    <p className="mb-6 text-gray-600 dark:text-gray-400">Gestisci i profili utente e l'aspetto.</p>
    <div className="space-y-4">
      {people.map((person) => (
        <div
          key={person.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
        >
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
            className="p-3 sm:p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
            aria-label={`Modifica ${person.name}`}
          >
            <PencilIcon className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  </Card>
));

UserProfileSection.displayName = "UserProfileSection";

/**
 * Componente per la sezione Gestione Conti
 */
export const AccountManagementSection = memo<AccountManagementProps>(
  ({ accounts, isAllView, onEditAccount, onAddAccount, getPersonName, getCalculatedBalanceSync }) => {
    // Ordina gli account per importo dal maggiore al minore
    const sortedAccounts = [...accounts].sort(
      (a, b) => getCalculatedBalanceSync(b.id) - getCalculatedBalanceSync(a.id)
    );

    return (
      <Card>
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gestione Account</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isAllView ? "Tutti gli account del gruppo" : "I tuoi account"}
              </p>
            </div>
            <button
              onClick={onAddAccount}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-sm"
            >
              Aggiungi Conto
            </button>
          </div>

          {/* Vista mobile con cards */}
          <div className="block sm:hidden space-y-3">
            {sortedAccounts.map((account) => {
              const personNames = isAllView
                ? account.personIds
                    .map((id) => getPersonName(id))
                    .filter(Boolean)
                    .join(", ")
                : null;
              return (
                <div key={account.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">{account.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{account.type}</p>
                      {isAllView && personNames && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">{personNames}</p>
                      )}
                    </div>
                    <button
                      onClick={() => onEditAccount(account)}
                      className="p-3 sm:p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      aria-label={`Modifica ${account.name}`}
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(getCalculatedBalanceSync(account.id))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista desktop con tabella */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Nome
                  </th>
                  {isAllView && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Persone
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedAccounts.map((account) => {
                  const personNames = isAllView
                    ? account.personIds
                        .map((id) => getPersonName(id))
                        .filter(Boolean)
                        .join(", ")
                    : null;
                  return (
                    <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700">
                      <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{account.name}</td>
                      {isAllView && (
                        <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{personNames || "N/D"}</td>
                      )}
                      <td className="py-4 px-4 text-gray-600 dark:text-gray-400 capitalize">{account.type}</td>
                      <td className="py-4 px-4 text-right font-mono text-gray-800 dark:text-gray-200">
                        {formatCurrency(getCalculatedBalanceSync(account.id))}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => onEditAccount(account)}
                          className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
        </div>
      </Card>
    );
  }
);

AccountManagementSection.displayName = "AccountManagementSection";

/**
 * Componente per la sezione Gestione Budget
 */
export const BudgetManagementSection = memo<BudgetManagementProps>(
  ({ budgets, isAllView, onEditBudget, getPersonName }) => (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Gestione Budget</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-400">Visualizza e modifica i budget per l'ambito selezionato.</p>

      {/* Vista mobile con cards */}
      <div className="block sm:hidden space-y-3">
        {budgets.map((budget) => (
          <div key={budget.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 dark:text-gray-200">{budget.description}</h3>
                {isAllView && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getPersonName(budget.personId) || "Sconosciuto"}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">{budget.categories.length} categorie</p>
              </div>
              <button
                onClick={() => onEditBudget(budget)}
                className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                aria-label={`Modifica ${budget.description}`}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="text-right">
              <p className="font-mono text-gray-800 dark:text-gray-200">{formatCurrency(budget.amount)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Vista desktop con tabella */}
      <div className="hidden sm:block overflow-x-auto">
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
            {budgets.map((budget) => (
              <tr
                key={budget.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">{budget.description}</td>
                {isAllView && (
                  <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                    {getPersonName(budget.personId) || "Sconosciuto"}
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
                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
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
  )
);

BudgetManagementSection.displayName = "BudgetManagementSection";
