import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { Transaction, TransactionType } from '../../types';
import { ArrowDownIcon, ArrowUpIcon, LinkIcon } from '../Icons';
import { formatCurrency, formatDate, getInitialDateRange } from '../../constants';

const TransactionRow: React.FC<{ 
    transaction: Transaction; 
    accountName: string; 
    personName?: string;
    isAllView: boolean;
    onLinkClick: (tx: Transaction) => void;
    linkingTx: Transaction | null;
    onSelectToLink: (txId: string) => void;
}> = ({ transaction, accountName, personName, isAllView, onLinkClick, linkingTx, onSelectToLink }) => {
    const { getCategoryName, getAccountById } = useFinance();
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const isTransfer = transaction.category === 'trasferimento';
    const isLinkingMode = !!linkingTx;
    const isThisLinkingTx = linkingTx?.id === transaction.id;
    
    // Per i trasferimenti, non permettere la riconciliazione
    const isLinkable = isLinkingMode && !isThisLinkingTx && linkingTx?.type !== transaction.type && !transaction.isReconciled && !isTransfer;

    // Ottieni il nome dell'account di destinazione per i trasferimenti
    const toAccount = isTransfer && transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

    const rowClasses = [
        "border-b border-gray-200 dark:border-gray-700",
        transaction.isReconciled ? 'opacity-50 bg-gray-50 dark:bg-gray-800/50' : '',
        isLinkingMode ? 'transition-opacity duration-300' : '',
        isThisLinkingTx ? 'bg-blue-100 dark:bg-blue-900/50' : '',
        isLinkable ? 'cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 opacity-100' : '',
        isLinkingMode && !isLinkable && !isThisLinkingTx ? 'opacity-30' : ''
    ].join(' ');

    const handleRowClick = () => {
        if (isLinkable) {
            onSelectToLink(transaction.id);
        }
    }

    return (
        <tr className={rowClasses} onClick={handleRowClick}>
            <td className="py-3 px-4">
                <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        isTransfer ? 'bg-blue-100 dark:bg-blue-900' : 
                        isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                    }`}>
                       {isTransfer ? 
                        <span className="text-blue-500 text-lg">⇄</span> :
                        isIncome ? <ArrowDownIcon className="w-5 h-5 text-green-500" /> : <ArrowUpIcon className="w-5 h-5 text-red-500" />
                       }
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{transaction.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isTransfer ? 
                                `${accountName} → ${toAccount?.name || 'Account sconosciuto'}` : 
                                accountName
                            }
                        </p>
                    </div>
                </div>
            </td>
            {isAllView && <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{personName}</td>}
            <td className={`py-3 px-4 font-mono text-right ${
                isTransfer ? 'text-blue-600 dark:text-blue-400' :
                isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
                {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
            </td>
            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{getCategoryName(transaction.category)}</td>
            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(transaction.date)}</td>
            <td className="py-3 px-4 text-center">
                 {isTransfer ? (
                    <div className="flex items-center justify-center text-blue-600 dark:text-blue-400" title="Trasferimento">
                        <span className="text-xs font-semibold">Trasferimento</span>
                    </div>
                ) : transaction.isReconciled ? (
                    <div className="flex items-center justify-center text-green-600 dark:text-green-400" title="Riconciliato">
                        <LinkIcon className="w-5 h-5" />
                        <span className="ml-2 text-xs font-semibold">Riconciliato</span>
                    </div>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onLinkClick(transaction); }}
                        className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
                        aria-label="Reconcile transaction"
                        disabled={isLinkingMode || isTransfer}
                    >
                        <LinkIcon className="w-5 h-5" />
                    </button>
                )}
            </td>
        </tr>
    );
};

export const TransactionsPage: React.FC = () => {
    const { transactions, getAccountById, selectedPersonId, getPersonById, linkTransactions, people, getCategoryName } = useFinance();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
    const [linkingTx, setLinkingTx] = useState<Transaction | null>(null);

    const [dateRange, setDateRange] = useState(() => getInitialDateRange(selectedPersonId, people));

    const isAllView = selectedPersonId === 'all';
    
    // Update date range when selected person changes
    useEffect(() => {
        const newDateRange = getInitialDateRange(selectedPersonId, people);
        setDateRange(newDateRange);
    }, [selectedPersonId, people]); // Add people as dependency to catch budget start date changes
    
    const personTransactions = useMemo(() => (isAllView
        ? transactions
        : transactions.filter(t => {
            const account = getAccountById(t.accountId);
            let belongsToUser = account?.personIds.includes(selectedPersonId);
            
            // Per i trasferimenti, include anche se l'account di destinazione appartiene all'utente
            if (t.category === 'trasferimento' && t.toAccountId) {
                const toAccount = getAccountById(t.toAccountId);
                belongsToUser = belongsToUser || (toAccount?.personIds.includes(selectedPersonId) || false);
            }
            
            return belongsToUser;
        })
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), 
    [transactions, selectedPersonId, getAccountById, isAllView]);
    
    const availableCategories = useMemo(() => {
        return [...new Set(personTransactions.map(t => t.category))].sort();
    }, [personTransactions]);

    const filteredTransactions = useMemo(() => {
        const start = new Date(dateRange.startDate);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(dateRange.endDate);
        end.setUTCHours(23, 59, 59, 999);

        let filtered = personTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= start && txDate <= end;
        });

        if (typeFilter !== 'all') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        if (searchTerm.trim() !== '') {
            const lowercasedFilter = searchTerm.toLowerCase();
            filtered = filtered.filter(t => {
                const account = getAccountById(t.accountId);
                const personNames = account 
                    ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(' ')
                    : '';
                const categoryName = getCategoryName(t.category);
                return (
                    t.description.toLowerCase().includes(lowercasedFilter) ||
                    t.category.toLowerCase().includes(lowercasedFilter) ||
                    categoryName.toLowerCase().includes(lowercasedFilter) ||
                    account?.name.toLowerCase().includes(lowercasedFilter) ||
                    (isAllView && personNames.toLowerCase().includes(lowercasedFilter))
                );
            });
        }
        
        // Ordina sempre per data dalla più recente alla meno recente
        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    }, [personTransactions, typeFilter, categoryFilter, searchTerm, dateRange, getAccountById, isAllView, getPersonById]);

    const handleStartLink = (tx: Transaction) => {
        setLinkingTx(tx);
    }
    
    const handleCancelLink = () => {
        setLinkingTx(null);
    }

    const handleSelectToLink = (targetTxId: string) => {
        if (linkingTx) {
            if(window.confirm(`Are you sure you want to reconcile "${linkingTx.description}" with "${transactions.find(t=>t.id===targetTxId)?.description}"?`)){
                linkTransactions(linkingTx.id, targetTxId);
                setLinkingTx(null);
            }
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tutte le Transazioni</h1>
            
            <Card className="p-4 space-y-4">
            <input
                type="text"
                placeholder="Cerca transazioni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                <label htmlFor="type-filter" className="sr-only">Filtra per tipo</label>
                <select 
                    id="type-filter" 
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value as 'all' | TransactionType)}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Tutti i Tipi</option>
                    <option value={TransactionType.ENTRATA}>Entrata</option>
                    <option value={TransactionType.SPESA}>Spesa</option>
                </select>
                </div>
                 <div>
                <label htmlFor="category-filter" className="sr-only">Filtra per categoria</label>
                <select 
                    id="category-filter"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Tutte le Categorie</option>
                    {availableCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                </div>
                <div>
                <label htmlFor="start-date" className="sr-only">Data Inizio</label>
                <input
                    type="date"
                    id="start-date"
                    value={dateRange.startDate}
                    onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                </div>
                <div>
                <label htmlFor="end-date" className="sr-only">Data Fine</label>
                <input
                    type="date"
                    id="end-date"
                    value={dateRange.endDate}
                    onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                </div>
            </div>
            </Card>

            {linkingTx && (
            <div className="bg-blue-100 dark:bg-blue-900/70 border border-blue-400 text-blue-800 dark:text-blue-200 px-4 py-3 rounded-lg relative" role="alert">
                <strong className="font-bold">Modalità Riconciliazione: </strong>
                <span className="block sm:inline">Seleziona una transazione da riconciliare con "{linkingTx.description}".</span>
                <button onClick={handleCancelLink} className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold">
                Annulla
                </button>
            </div>
            )}

            <Card className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="border-b-2 border-gray-200 dark:border-gray-600">
                <tr>
                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Descrizione</th>
                    {isAllView && <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Persona</th>}
                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Importo</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Categoria</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300">Data</th>
                    <th className="py-3 px-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Stato</th>
                </tr>
                </thead>
                <tbody>
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(tx => {
                    const account = getAccountById(tx.accountId);
                    const personNames = account 
                        ? account.personIds.map(id => getPersonById(id)?.name).filter(Boolean).join(', ')
                        : null;
                    return <TransactionRow 
                            key={tx.id} 
                            transaction={tx} 
                            accountName={account?.name || 'Sconosciuto'} 
                            personName={personNames}
                            isAllView={isAllView}
                            onLinkClick={handleStartLink}
                            linkingTx={linkingTx}
                            onSelectToLink={handleSelectToLink}
                        />;
                    })
                ) : (
                    <tr>
                    <td colSpan={isAllView ? 7 : 6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                        Nessuna transazione trovata per i filtri correnti.
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
            </Card>
        </div>
    );
};