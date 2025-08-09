import React, { useState } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { PencilIcon } from '../Icons';
import { Account, Person, Budget } from '../../types';
import { EditAccountModal } from '../EditAccountModal';
import { AddAccountModal } from '../AddAccountModal';
import { EditPersonModal } from '../EditPersonModal';
import { EditBudgetModal } from '../EditBudgetModal';
import { AuthSettingsCard } from '../AuthSettingsCard';
import { formatCurrency } from '../../constants';

export const SettingsPage: React.FC = () => {
    const { people, accounts, budgets, selectedPersonId, getPersonById, getCalculatedBalance } = useFinance();
    const [isEditAccountModalOpen, setIsEditAccountModalOpen] = useState(false);
    const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const [isEditPersonModalOpen, setIsEditPersonModalOpen] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

    const [isEditBudgetModalOpen, setIsEditBudgetModalOpen] = useState(false);
    const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

    const isAllView = selectedPersonId === 'all';
    const displayedAccounts = isAllView
        ? accounts
        : accounts.filter(acc => acc.personIds.includes(selectedPersonId));

    const displayedPeople = isAllView
        ? people
        : people.filter(p => p.id === selectedPersonId);

    const handleEditAccountClick = (account: Account) => {
        setSelectedAccount(account);
        setIsEditAccountModalOpen(true);
    }

    const handleEditPersonClick = (person: Person) => {
        setSelectedPerson(person);
        setIsEditPersonModalOpen(true);
    }

    const handleEditBudgetClick = (budget: Budget) => {
        setSelectedBudget(budget);
        setIsEditBudgetModalOpen(true);
    };

    const displayedBudgets = isAllView
        ? budgets
        : budgets.filter(b => b.personId === selectedPersonId);

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Impostazioni</h1>

                {/* Sezione Autenticazione */}
                <AuthSettingsCard />

                <Card>
                    <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Profilo Utente</h2>
                    <p className="mb-6 text-gray-600 dark:text-gray-400">Gestisci i profili utente e l'aspetto.</p>
                    <div className="space-y-4">
                        {displayedPeople.map(person => (
                            <div key={person.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <div className="flex items-center">
                                    <img src={person.avatar} alt={person.name} className="w-12 h-12 rounded-full" />
                                    <div className="ml-4">
                                        <p className="font-semibold text-lg text-gray-900 dark:text-white">{person.name}</p>
                                        <div className="flex items-center mt-1">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">Colore Tema:</span>
                                            <div className="w-5 h-5 rounded-full ml-2 border border-gray-300 dark:border-gray-600" style={{ backgroundColor: person.themeColor }}></div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEditPersonClick(person)}
                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                    aria-label={`Modifica ${person.name}`}
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestione Conti</h2>
                        <button
                            onClick={() => setIsAddAccountModalOpen(true)}
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
                                {displayedAccounts.map(account => {
                                    const personNames = isAllView
                                        ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
                                        : null;
                                    return (
                                        <tr key={account.id} className="border-b border-gray-200 dark:border-gray-700">
                                            <td className="py-4 px-4 font-medium text-gray-900 dark:text-gray-100">{account.name}</td>
                                            {isAllView && <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{personNames || 'N/D'}</td>}
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400 capitalize">{account.type}</td>
                                            <td className="py-4 px-4 text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(getCalculatedBalance(account.id))}</td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleEditAccountClick(account)}
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
                                {displayedBudgets.map(budget => {
                                    const person = isAllView ? getPersonById(budget.personId) : undefined;
                                    return (
                                        <tr key={budget.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <td className="py-4 px-4 font-medium text-gray-800 dark:text-gray-200">{budget.description}</td>
                                            {isAllView && (
                                                <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                                    {person ? person.name : 'Sconosciuto'}
                                                </td>
                                            )}
                                            <td className="py-4 px-4 text-right font-mono text-gray-800 dark:text-gray-200">{formatCurrency(budget.amount)}</td>
                                            <td className="py-4 px-4 text-gray-600 dark:text-gray-400">
                                                <span className="text-sm">{budget.categories.length} categorie</span>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <button
                                                    onClick={() => handleEditBudgetClick(budget)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                                    aria-label={`Modifica ${budget.description}`}
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
            </div>
            <EditAccountModal
                isOpen={isEditAccountModalOpen}
                onClose={() => setIsEditAccountModalOpen(false)}
                account={selectedAccount}
            />
            <AddAccountModal
                isOpen={isAddAccountModalOpen}
                onClose={() => setIsAddAccountModalOpen(false)}
            />
            <EditPersonModal
                isOpen={isEditPersonModalOpen}
                onClose={() => setIsEditPersonModalOpen(false)}
                person={selectedPerson}
            />
            <EditBudgetModal
                isOpen={isEditBudgetModalOpen}
                onClose={() => setIsEditBudgetModalOpen(false)}
                budget={selectedBudget}
            />
        </>
    );
};