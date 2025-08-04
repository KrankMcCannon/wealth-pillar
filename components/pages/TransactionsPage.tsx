import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../hooks/useFinance';
import { Card } from '../ui/Card';
import { Transaction, TransactionType } from '../../types';
import { ArrowDownIcon, ArrowUpIcon, LinkIcon, PencilIcon } from '../Icons';
import { formatCurrency, formatDate, getInitialDateRange } from '../../constants';
import { EditTransactionModal } from '../EditTransactionModal';

const TransactionRow: React.FC<{
    transaction: Transaction;
    accountName: string;
    personName?: string;
    isAllView: boolean;
    onLinkClick: (tx: Transaction) => void;
    linkingTx: Transaction | null;
    onSelectToLink: (txId: string) => void;
    onEditClick: (tx: Transaction) => void;
}> = ({ transaction, accountName, personName, isAllView, onLinkClick, linkingTx, onSelectToLink, onEditClick }) => {
    const { getCategoryName, getAccountById, getRemainingAmount, hasAvailableAmount, isParentTransaction } = useFinance();
    const isIncome = transaction.type === TransactionType.ENTRATA;
    const isTransfer = transaction.category === 'trasferimento';
    const isLinkingMode = !!linkingTx;
    const isThisLinkingTx = linkingTx?.id === transaction.id;

    // Per i trasferimenti, non permettere la riconciliazione
    const isLinkable = isLinkingMode && !isThisLinkingTx && linkingTx?.type !== transaction.type && !transaction.isReconciled && !isTransfer;

    // Ottieni il nome dell'account di destinazione per i trasferimenti
    const toAccount = isTransfer && transaction.toAccountId ? getAccountById(transaction.toAccountId) : null;

    // Calcola l'importo rimanente e determina se mostrarlo
    const remainingAmount = getRemainingAmount(transaction);
    const isParent = isParentTransaction(transaction);
    const showRemainingAmount = transaction.isReconciled && isParent;
    
    // Determina se la transazione deve essere leggermente blurrata
    // - Transazioni collegate (non parent) sono sempre blurrate
    // - Transazioni parent sono blurrate solo se remainingAmount = 0
    const shouldBlurTransaction = transaction.isReconciled && (!isParent || remainingAmount === 0);

    const rowClasses = [
        "border-b border-gray-200 dark:border-gray-700",
        // Colori di background per distinguere le transazioni
        isTransfer ? 'bg-blue-50 dark:bg-blue-900/20' : 
        transaction.isReconciled ? 'bg-green-50 dark:bg-green-900/20' : '',
        // Blur per transazioni collegate o principali completamente riconciliate
        shouldBlurTransaction ? 'opacity-60' : '',
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
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isTransfer ? 'bg-blue-100 dark:bg-blue-900' :
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
            <td className={`py-3 px-4 font-mono text-right ${isTransfer ? 'text-blue-600 dark:text-blue-400' :
                    isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                <div className="flex flex-col items-end">
                    <span>
                        {isTransfer ? '' : (isIncome ? '+' : '-')} {formatCurrency(transaction.amount)}
                    </span>
                    {showRemainingAmount && (
                        <span className={`text-xs font-medium ${
                            remainingAmount > 0 
                                ? 'text-orange-600 dark:text-orange-400' 
                                : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {remainingAmount > 0 
                                ? `Disponibile: ${formatCurrency(remainingAmount)}`
                                : 'Completamente riconciliato'
                            }
                        </span>
                    )}
                </div>
            </td>
            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{getCategoryName(transaction.category)}</td>
            <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{formatDate(transaction.date)}</td>
            <td className="py-3 px-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                    {/* Icona di modifica sempre visibile */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onEditClick(transaction); }}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                        aria-label="Modifica transazione"
                        title="Modifica transazione"
                    >
                        <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Stato riconciliazione */}
                    {isTransfer ? (
                        <div className="flex items-center text-blue-600 dark:text-blue-400" title="Trasferimento">
                            <span className="text-xs font-semibold">Trasferimento</span>
                        </div>
                    ) : transaction.isReconciled ? (
                        <div className="flex items-center text-green-600 dark:text-green-400" title={`Riconciliato${hasAvailableAmount(transaction) ? ' (Con importo disponibile)' : remainingAmount > 0 ? ' (Con rimanente)' : ' (Completamente riconciliato)'}`}>
                            <LinkIcon className="w-4 h-4" />
                            <span className="ml-1 text-xs font-semibold">
                                {hasAvailableAmount(transaction) ? 'Disponibile' : 
                                 remainingAmount > 0 ? 'Parziale' : 
                                 'Completato'}
                            </span>
                        </div>
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); onLinkClick(transaction); }}
                            className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
                            aria-label="Riconcilia transazione"
                            title="Riconcilia transazione"
                            disabled={isLinkingMode || isTransfer}
                        >
                            <LinkIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
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
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);

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

    const handleEditTransaction = (tx: Transaction) => {
        setEditingTx(tx);
    }

    const handleCloseEditModal = () => {
        setEditingTx(null);
    }

    const handleSelectToLink = (targetTxId: string) => {
        if (linkingTx) {
            if (window.confirm(`Are you sure you want to reconcile "${linkingTx.description}" with "${transactions.find(t => t.id === targetTxId)?.description}"?`)) {
                linkTransactions(linkingTx.id, targetTxId);
                setLinkingTx(null);
            }
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Tutte le Transazioni</h1>

            <Card>
                <div className="p-6 space-y-6">
                    {/* Header della sezione filtri */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Filtri e Ricerca</h2>
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setTypeFilter('all');
                                setCategoryFilter('all');
                                const resetDateRange = getInitialDateRange(selectedPersonId, people);
                                setDateRange(resetDateRange);
                            }}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline transition-colors"
                        >
                            Reset Filtri
                        </button>
                    </div>
                    
                    {/* Barra di ricerca migliorata */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cerca per descrizione, categoria, account o persona..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                    
                    {/* Filtri organizzati in sezioni */}
                    <div className="space-y-4">
                        {/* Filtri tipo e categoria */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Tipo Transazione
                                </label>
                                <div className="relative">
                                    <select
                                        id="type-filter"
                                        value={typeFilter}
                                        onChange={e => setTypeFilter(e.target.value as 'all' | TransactionType)}
                                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 appearance-none cursor-pointer"
                                    >
                                        <option value="all">🎯 Tutti i Tipi</option>
                                        <option value={TransactionType.ENTRATA}>💰 Entrate</option>
                                        <option value={TransactionType.SPESA}>💸 Spese</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Categoria
                                </label>
                                <div className="relative">
                                    <select
                                        id="category-filter"
                                        value={categoryFilter}
                                        onChange={e => setCategoryFilter(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700 appearance-none cursor-pointer"
                                    >
                                        <option value="all">📋 Tutte le Categorie</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>
                                                {getCategoryName(cat)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Filtri data */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Periodo di Riferimento
                                </label>
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>
                                        {filteredTransactions.length} transazion{filteredTransactions.length !== 1 ? 'i' : 'e'} trovate
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label htmlFor="start-date" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Data Inizio
                                    </label>
                                    <input
                                        type="date"
                                        id="start-date"
                                        value={dateRange.startDate}
                                        onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label htmlFor="end-date" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                                        Data Fine
                                    </label>
                                    <input
                                        type="date"
                                        id="end-date"
                                        value={dateRange.endDate}
                                        onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        className="block w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        {/* Indicatori dei filtri attivi */}
                        {(searchTerm || typeFilter !== 'all' || categoryFilter !== 'all') && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Filtri attivi:</span>
                                {searchTerm && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                        🔍 "{searchTerm}"
                                    </span>
                                )}
                                {typeFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                        {typeFilter === TransactionType.ENTRATA ? '💰' : '💸'} {typeFilter === TransactionType.ENTRATA ? 'Entrate' : 'Spese'}
                                    </span>
                                )}
                                {categoryFilter !== 'all' && (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                        📋 {getCategoryName(categoryFilter)}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {linkingTx && (
                <Card>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                        <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                        Modalità Riconciliazione Attiva
                                    </h3>
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        Seleziona una transazione da riconciliare con{' '}
                                        <span className="font-medium px-2 py-1 bg-blue-200 dark:bg-blue-800 rounded-md">
                                            "{linkingTx.description}"
                                        </span>
                                    </p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                        💡 Clicca su una transazione di tipo opposto per collegarla
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={handleCancelLink} 
                                className="flex-shrink-0 p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
                                aria-label="Annulla riconciliazione"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </Card>
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
                                    onEditClick={handleEditTransaction}
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

            {/* Modal di modifica transazione */}
            {editingTx && (
                <EditTransactionModal
                    isOpen={!!editingTx}
                    onClose={handleCloseEditModal}
                    transaction={editingTx}
                />
            )}
        </div>
    );
};