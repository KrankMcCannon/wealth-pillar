import React from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { Account, Budget, Transaction, TransactionType, Person } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency, getCurrentBudgetPeriod } from '../../constants';

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
    const { periodStart, periodEnd } = getCurrentBudgetPeriod(person);
    const { getCategoryName, getEffectiveTransactionAmount } = useFinance();
    
    const currentSpent = transactions
        .filter(t => {
            if (t.type !== 'spesa') return false;
            if (t.category === 'trasferimento') return false; // Esclude i trasferimenti dal budget
            const transactionDate = new Date(t.date);
            return transactionDate >= periodStart && transactionDate <= periodEnd &&
                   budget.categories.includes(t.category);
        })
        .reduce((sum, t) => sum + getEffectiveTransactionAmount(t), 0);
    
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
                    className={`h-2 rounded-full transition-all duration-300 ${
                        percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
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

const RecentTransactionItem: React.FC<{ transaction: Transaction, accountName: string, personName?: string, getCategoryName: (categoryId: string) => string, getAccountById: (id: string) => Account | undefined }> = ({ transaction, accountName, personName, getCategoryName, getAccountById }) => {
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const isTransfer = transaction.category === 'trasferimento';
    const toAccount = isTransfer && transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;
    
    return (
        <li className={`flex items-center justify-between py-3 ${transaction.isReconciled ? 'opacity-60' : ''}`}>
            <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isTransfer ? 'bg-blue-100 dark:bg-blue-900' : 
                    isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                }`}>
                    <span className={`text-xl ${
                        isTransfer ? 'text-blue-500' : 
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
                        {transaction.isReconciled && <span className="text-blue-500 ml-2">(Riconciliato)</span>}
                    </p>
                </div>
            </div>
            <div className={`font-semibold ${
                isTransfer ? 'text-blue-600 dark:text-blue-400' :
                isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
                {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
            </div>
        </li>
    );
};

export const Dashboard: React.FC = () => {
    const { people, accounts, transactions, budgets, getAccountById, selectedPersonId, getPersonById, categories, getCalculatedBalance, getCategoryName, getEffectiveTransactionAmount } = useFinance();
    
    const isAllView = selectedPersonId === 'all';
    const selectedPerson = !isAllView ? people.find(p => p.id === selectedPersonId) : null;

    const displayedAccounts = isAllView ? accounts : accounts.filter(acc => acc.personIds.includes(selectedPersonId));
    
    const displayedTransactions = (isAllView 
        ? transactions 
        : transactions.filter(tx => {
            const account = getAccountById(tx.accountId);
            let belongsToUser = account?.personIds.includes(selectedPersonId);
            
            // Per i trasferimenti, include anche se l'account di destinazione appartiene all'utente
            if (tx.category === 'trasferimento' && tx.toAccountId) {
                const toAccount = getAccountById(tx.toAccountId);
                belongsToUser = belongsToUser || (toAccount?.personIds.includes(selectedPersonId) || false);
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
            const total = displayedTransactions
                .filter(t => t.category === category.id && t.type === TransactionType.SPESA)
                .reduce((sum, t) => sum + getEffectiveTransactionAmount(t), 0);
            return { name: category.name, value: total };
        })
        .filter(item => item.value > 0);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

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
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Panoramica Budget Mensile</h2>
                 <div className="space-y-4">
                {displayedBudgets.length > 0 ? displayedBudgets.map(budget => {
                    const person = isAllView ? getPersonById(budget.personId) : null;
                    const budgetTransactions = isAllView 
                    ? transactions.filter(t => {
                        const account = getAccountById(t.accountId);
                        return account?.personIds.includes(budget.personId);
                    })
                    : displayedTransactions;
                    
                    return (
                    <div key={budget.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        {isAllView && person && (
                        <div className="flex items-center mb-2">
                            <img src={person.avatar} alt={person.name} className="w-6 h-6 rounded-full mr-2" />
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">{person.name}</p>
                        </div>
                        )}
                        <BudgetProgress 
                        budget={budget} 
                        transactions={budgetTransactions} 
                        person={person || selectedPerson!}
                        />
                    </div>
                    );
                }) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">Nessun budget mensile impostato per questa vista.</p>
                )}
                </div>
            </Card>
            <Card>
                <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Ripartizione Spese</h2>
                {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie data={expenseData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" labelLine={false}>
                        {expenseData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">Nessuna spesa per questo mese.</div>
                )}
            </Card>
            </div>

            <Card>
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Transazioni Recenti</h2>
            {recentTransactions.length > 0 ? (
                <ul>
                {recentTransactions.map(tx => {
                    const account = getAccountById(tx.accountId);
                    const personNames = isAllView && account 
                    ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
                    : undefined;
                    return <RecentTransactionItem key={tx.id} transaction={tx} accountName={account?.name || 'Sconosciuto'} personName={personNames} getCategoryName={getCategoryName} getAccountById={getAccountById} />;
                })}
                </ul>
            ) : (
                <p className="text-gray-500 dark:text-gray-400">Nessuna transazione per questo utente.</p>
            )}
            </Card>
        </div>
    );
};