import React, { useState, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { Account, Budget, Transaction, TransactionType, Person } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency, getCurrentBudgetPeriod } from '../../constants';

// Hook per la gestione della responsività
const useWindowSize = () => {
    const [windowSize, setWindowSize] = useState({
        width: typeof window !== 'undefined' ? window.innerWidth : 1024,
        height: typeof window !== 'undefined' ? window.innerHeight : 768,
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowSize;
};

const AccountCard: React.FC<{ account: Account, balance: number, personName?: string }> = ({ account, balance, personName }) => (
    <Card>
        <h3 className="font-semibold text-gray-500 dark:text-gray-400">{account.name}</h3>
        {personName && <p className="text-xs text-blue-400 dark:text-blue-500">{personName}</p>}
        <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{formatCurrency(balance)}</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 capitalize mt-1">{account.type} Account</p>
    </Card>
);

function BudgetProgress({ budget, transactions, person }: {
    budget: Budget;
    transactions: Transaction[];
    person: Person;
}) {
    const { getCategoryName, getEffectiveTransactionAmount, getAccountById, getPersonById, getRemainingAmount } = useFinance();
    
    // Ottieni la persona del budget, non quella passata come parametro
    const budgetPerson = getPersonById(budget.personId) || person;
    const { periodStart, periodEnd } = getCurrentBudgetPeriod(budgetPerson);

    const currentSpent = transactions
        .filter(t => {
            if (t.type !== 'spesa') return false;
            if (t.category === 'trasferimento') return false;
            
            // Verifica che la transazione appartenga alla persona del budget
            const account = getAccountById(t.accountId);
            if (!account?.personIds?.includes?.(budget.personId)) return false;
            
            const transactionDate = new Date(t.date);
            const isInPeriod = transactionDate >= periodStart && transactionDate <= periodEnd;
            const isInCategory = budget.categories.includes(t.category);
            
            return isInPeriod && isInCategory;
        })
        .reduce((sum, t) => {
            const amount = t.isReconciled ? getRemainingAmount(t) : getEffectiveTransactionAmount(t);
            return sum + amount;
        }, 0);

    const percentage = budget.amount > 0 ? (currentSpent / budget.amount) * 100 : 0;
    const remaining = budget.amount - currentSpent;

    const formatDate = (date: Date) =>
        date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    const categoryNames = budget.categories.map(catId => getCategoryName(catId)).join(', ');

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800 dark:text-white">{budget.description}</h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(periodStart)} - {formatDate(periodEnd)}
                </span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                    Spesi: {formatCurrency(currentSpent)}
                </span>
                <span className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rimanenti: {formatCurrency(remaining)}
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Budget: {formatCurrency(budget.amount)}</span>
                <span>{percentage.toFixed(1)}%</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
                Categorie: {categoryNames}
            </div>
        </div>
    );
}

const RecentTransactionItem: React.FC<{ 
    transaction: Transaction, 
    accountName: string, 
    personName?: string, 
    getCategoryName: (categoryId: string) => string, 
    getAccountById: (id: string) => Account | undefined,
    getRemainingAmount: (transaction: Transaction) => number,
    hasAvailableAmount: (transaction: Transaction) => boolean,
    isParentTransaction: (transaction: Transaction) => boolean
}> = ({ 
    transaction, 
    accountName, 
    personName, 
    getCategoryName, 
    getAccountById, 
    getRemainingAmount, 
    hasAvailableAmount, 
    isParentTransaction 
}) => {
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const isTransfer = transaction.category === 'trasferimento';
    const toAccount = isTransfer && transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;
    
    // Calcola l'importo rimanente e determina se mostrarlo
    const remainingAmount = getRemainingAmount(transaction);
    const isParent = isParentTransaction(transaction);
    const showRemainingAmount = transaction.isReconciled && (isParent || remainingAmount > 0);
    
    // Determina se la transazione deve essere leggermente blurrata
    const shouldBlurTransaction = transaction.isReconciled && (!isParent || remainingAmount === 0);

    return (
        <li className={`flex items-center justify-between py-3 rounded-lg px-3 ${
            isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' : 
            transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : ''
        } ${shouldBlurTransaction ? 'opacity-60' : ''}`}>
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isTransfer ? 'bg-blue-100 dark:bg-blue-900' :
                        isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                    <span className={`text-xl ${isTransfer ? 'text-blue-500' :
                            isIncome ? 'text-green-500' : 'text-red-500'
                        }`}>
                        {isTransfer ? '⇄' : (isIncome ? '↓' : '↑')}
                    </span>
                </div>
                <div className="ml-4">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{transaction.description}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isTransfer ?
                            `${accountName} → ${toAccount?.name || 'Account sconosciuto'}` :
                            `${accountName}${personName ? ` · ${personName}` : ''} · ${getCategoryName(transaction.category)}`
                        }
                        {transaction.isReconciled && (
                            <span className="text-blue-500 ml-2">
                                ({hasAvailableAmount(transaction) ? 'Disponibile' : 
                                  remainingAmount > 0 ? 'Parziale' : 'Completato'})
                            </span>
                        )}
                    </p>
                </div>
            </div>
            <div className={`font-semibold ${isTransfer ? 'text-blue-600 dark:text-blue-400' :
                    isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                <div className="flex flex-col items-end">
                    <span>
                        {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
                    </span>
                    {showRemainingAmount && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                            {hasAvailableAmount(transaction) ? 'Disponibile' : 'Rimanente'}: {formatCurrency(remainingAmount)}
                        </span>
                    )}
                </div>
            </div>
        </li>
    );
};

export const Dashboard: React.FC = () => {
    const { width } = useWindowSize();
    const isMobile = width < 768;
    
    // Rileva se il tema è dark mode
    const [isDarkMode, setIsDarkMode] = useState(false);
    
    useEffect(() => {
        const checkDarkMode = () => {
            const isDark = document.documentElement.classList.contains('dark') || 
                          window.matchMedia('(prefers-color-scheme: dark)').matches;
            setIsDarkMode(isDark);
        };
        
        // Controlla inizialmente
        checkDarkMode();
        
        // Observer per cambiamenti del tema
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Media query listener per preferenze sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', checkDarkMode);
        
        return () => {
            observer.disconnect();
            mediaQuery.removeEventListener('change', checkDarkMode);
        };
    }, []);
    
    const { 
        people, 
        accounts, 
        transactions, 
        budgets, 
        getAccountById, 
        selectedPersonId, 
        getPersonById, 
        categories, 
        getCalculatedBalance, 
        getCategoryName, 
        getEffectiveTransactionAmount, 
        getRemainingAmount, 
        hasAvailableAmount, 
        isParentTransaction 
    } = useFinance();

    const isAllView = selectedPersonId === 'all';
    const selectedPerson = !isAllView ? people.find(p => p.id === selectedPersonId) : null;

    const displayedAccounts = isAllView ? accounts : accounts.filter(acc => acc.personIds.includes(selectedPersonId));

    const displayedTransactions = (isAllView
        ? transactions
        : transactions.filter(tx => {
            const account = getAccountById(tx.accountId);
            let belongsToUser = account?.personIds.includes(selectedPersonId);

            if (tx.category === 'trasferimento') {
                return belongsToUser;
            }

            return belongsToUser;
        })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const displayedBudgets = (isAllView
        ? budgets
        : budgets.filter(b => b.personId === selectedPersonId)
    ).filter(b => b.period === 'monthly');

    const recentTransactions = displayedTransactions.slice(0, 5);

    const expenseData = categories
        .filter(cat => !['stipendio', 'rimborso', 'investimenti', 'entrata', 'trasferimento'].includes(cat.id))
        .map(category => {
            // Trova le transazioni che appartengono a questa categoria
            const categoryTransactions = displayedTransactions
                .filter(t => {
                    // Confronto diretto tra il nome della categoria e la categoria della transazione
                    return t.category === category.name && t.type === TransactionType.SPESA;
                });
                
            // Calcola il totale per il grafico delle spese usando l'importo effettivo reale
            const total = categoryTransactions.reduce((sum, t) => {
                const amount = getEffectiveTransactionAmount(t);
                return sum + amount;
            }, 0);
            
            return { name: category.label || category.name, value: total };
        })
        .filter(item => item.value > 0)
        .sort((a, b) => b.value - a.value); // Ordina per valore decrescente

    // Palette colori moderna e accessibile - ispirata ai design system moderni
    const COLORS = [
        '#6366F1', // Indigo - primario
        '#EC4899', // Pink - vibrante
        '#10B981', // Emerald - successo
        '#F59E0B', // Amber - attenzione
        '#8B5CF6', // Violet - lusso
        '#06B6D4', // Cyan - freschezza
        '#EF4444', // Red - urgenza
        '#84CC16', // Lime - energia
        '#F97316', // Orange - calore
        '#14B8A6', // Teal - equilibrio
        '#3B82F6', // Blue - fiducia
        '#F43F5E'  // Rose - passione
    ];

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {selectedPerson ? `Dashboard di ${selectedPerson.name}` : 'Dashboard Generale'}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedAccounts.map(acc => {
                    const personNames = isAllView
                        ? acc.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
                        : undefined;
                    const calculatedBalance = getCalculatedBalance(acc.id);
                    return <AccountCard key={acc.id} account={acc} balance={calculatedBalance} personName={personNames} />;
                })}
            </div>

            {/* Sezione Budget */}
            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Panoramica Budget Mensile</h2>
                <div className="space-y-4">
                    {displayedBudgets.length > 0 ? displayedBudgets.map(budget => {
                        // Nel caso della vista "all", non duplicare i budget
                        const budgetPerson = getPersonById(budget.personId);
                        return (
                            <div key={budget.id}>
                                {isAllView && budgetPerson && <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-2">{budgetPerson.name}</h3>}
                                <BudgetProgress 
                                    budget={budget} 
                                    transactions={transactions} 
                                    person={budgetPerson || selectedPerson!} 
                                />
                            </div>
                        );
                    }) : (
                        <p className="text-gray-500 dark:text-gray-400">Nessun budget mensile trovato.</p>
                    )}
                </div>
            </Card>

            {/* Sezione Ripartizione Spese */}
            <Card>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Ripartizione Spese</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {expenseData.length > 0 && (
                            <span className="font-medium">
                                {formatCurrency(expenseData.reduce((sum, item) => sum + item.value, 0))} totale
                            </span>
                        )}
                    </div>
                </div>
                
                {expenseData.length > 0 ? (
                    <div className="w-full">
                        {/* Layout responsive: grafico sopra, lista sotto */}
                        <div className="space-y-8">
                            {/* Grafico a torta centrato */}
                            <div className="flex justify-center">
                                <div className="relative w-full max-w-md">
                                    <ResponsiveContainer 
                                        width="100%" 
                                        height={isMobile ? 280 : 320}
                                        className="mx-auto"
                                    >
                                        <PieChart>
                                            <Pie 
                                                data={expenseData} 
                                                dataKey="value" 
                                                nameKey="name" 
                                                cx="50%" 
                                                cy="50%" 
                                                innerRadius={isMobile ? 50 : 70}
                                                outerRadius={isMobile ? 100 : 130}
                                                paddingAngle={3}
                                                animationBegin={0}
                                                animationDuration={1000}
                                                stroke="none"
                                            >
                                                {expenseData.map((_, index) => (
                                                    <Cell 
                                                        key={`cell-${index}`} 
                                                        fill={COLORS[index % COLORS.length]}
                                                        style={{
                                                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                formatter={(value: number) => [formatCurrency(value), 'Spesa']}
                                                contentStyle={{
                                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.96)' : 'rgba(31, 41, 55, 0.96)',
                                                    color: isDarkMode ? '#1f2937' : '#f9fafb',
                                                    border: isDarkMode ? '1px solid #e5e7eb' : '1px solid #374151',
                                                    borderRadius: '12px',
                                                    boxShadow: isDarkMode 
                                                        ? '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)' 
                                                        : '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                                                    backdropFilter: 'blur(16px)',
                                                    fontSize: '14px',
                                                    padding: '12px 16px',
                                                    fontWeight: '500'
                                                }}
                                                labelStyle={{ 
                                                    fontWeight: '600',
                                                    marginBottom: '4px',
                                                    color: isDarkMode ? '#374151' : '#f3f4f6'
                                                }}
                                                itemStyle={{
                                                    color: isDarkMode ? '#6b7280' : '#d1d5db',
                                                    fontWeight: '500'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    
                                    {/* Indicatore totale al centro del grafico */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center transform -translate-y-1">
                                            <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-800 dark:text-white leading-tight`}>
                                                {formatCurrency(expenseData.reduce((sum, item) => sum + item.value, 0))}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
                                                Spese totali
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Lista categorie migliorata - Layout a griglia */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                                    Dettaglio Categorie ({expenseData.length})
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {expenseData.map((item, index) => {
                                        const total = expenseData.reduce((sum, d) => sum + d.value, 0);
                                        const percentage = ((item.value / total) * 100);
                                        return (
                                            <div 
                                                key={item.name}
                                                className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200"
                                            >
                                                <div className="flex items-center flex-1 min-w-0">
                                                    <div 
                                                        className="w-3 h-3 rounded-full mr-2 flex-shrink-0 shadow-sm"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                                                            {item.name}
                                                        </p>
                                                        <div className="flex items-center mt-1">
                                                            <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-1 mr-1">
                                                                <div 
                                                                    className="h-1 rounded-full transition-all duration-500"
                                                                    style={{ 
                                                                        width: `${percentage}%`,
                                                                        backgroundColor: COLORS[index % COLORS.length]
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                                {percentage.toFixed(0)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-2">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                                                        {formatCurrency(item.value)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                            <svg className="w-10 h-10 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">
                            Nessuna spesa registrata
                        </h3>
                        <p className="text-sm text-center max-w-sm leading-relaxed">
                            Inizia ad aggiungere transazioni per visualizzare la ripartizione delle tue spese in questo grafico interattivo
                        </p>
                    </div>
                )}
            </Card>

            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Transazioni Recenti</h2>
                {recentTransactions.length > 0 ? (
                    <ul>
                        {recentTransactions.map(tx => {
                            const account = getAccountById(tx.accountId);
                            const personNames = isAllView && account
                                ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
                                : undefined;
                            return (
                                <RecentTransactionItem 
                                    key={tx.id} 
                                    transaction={tx} 
                                    accountName={account?.name || 'Sconosciuto'} 
                                    personName={personNames} 
                                    getCategoryName={getCategoryName} 
                                    getAccountById={getAccountById} 
                                    getRemainingAmount={getRemainingAmount} 
                                    hasAvailableAmount={hasAvailableAmount} 
                                    isParentTransaction={isParentTransaction} 
                                />
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">Nessuna transazione per questo utente.</p>
                )}
            </Card>
        </div>
    );
};
