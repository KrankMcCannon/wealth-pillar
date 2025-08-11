import React, { memo, useState } from 'react';
import type { Budget, Person } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { useBudgetData } from '../../hooks/features/budget/useBudgetData';
import { BudgetExceptionButton } from '../budget/BudgetExceptionButton';
import { ChevronDownIcon, ChevronUpIcon } from '../common/Icons';
import { useFinance } from '../../hooks/core/useFinance';
import { CategoryUtils } from '../../lib/utils/category.utils';

/**
 * Props per BudgetProgress
 */
interface BudgetProgressProps {
    budgets: Budget[];
    people: Person[];
    selectedPersonId?: string;
}

/**
 * Componente unificato per visualizzare budget con categorie e transazioni
 * Layout: categorie a sinistra, transazioni a destra, eccezioni globali per persona
 */
export const BudgetProgress = memo<BudgetProgressProps>(({
    budgets,
    people,
    selectedPersonId
}) => {
    const { categories: categoryOptions } = useFinance();
    const { budgetDataByPerson, selectedPersonData, hasData } = useBudgetData({
        budgets,
        selectedPersonId
    });

    const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());

    if (!hasData) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                    Nessun budget trovato.
                </p>
            </div>
        );
    }

    const toggleBudgetExpansion = (budgetId: string) => {
        setExpandedBudgets(prev => {
            const newSet = new Set(prev);
            if (newSet.has(budgetId)) {
                newSet.delete(budgetId);
            } else {
                newSet.add(budgetId);
            }
            return newSet;
        });
    };

    const dataToRender = selectedPersonData ? [selectedPersonData] : budgetDataByPerson;

    return (
        <div className="space-y-6">
            {/* Header con bottone eccezioni globale */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                    Panoramica Budget
                    {selectedPersonData && ` - ${selectedPersonData.person.name}`}
                </h2>
                <BudgetExceptionButton
                    people={people}
                    defaultPersonId={selectedPersonId}
                />
            </div>

            {/* Budget per persona */}
            {dataToRender.map(personData => (
                <div key={personData.person.id} className="space-y-4">
                    {/* Nome persona (solo se non è vista singola) */}
                    {!selectedPersonId && (
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-blue-600 dark:text-blue-400">
                                {personData.person.name}
                            </h3>
                            {personData.hasActiveException && (
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                    📅 Eccezione attiva
                                </span>
                            )}
                        </div>
                    )}

                    {/* Riepilogo totali persona */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600 dark:text-gray-400">
                                Totale speso: {formatCurrency(personData.totalSpent)}
                            </span>
                            <span className="text-gray-600 dark:text-gray-400">
                                Budget totale: {formatCurrency(personData.totalBudgetAmount)}
                            </span>
                        </div>
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${personData.totalSpent > personData.totalBudgetAmount
                                            ? 'bg-red-500'
                                            : personData.totalSpent > personData.totalBudgetAmount * 0.8
                                                ? 'bg-orange-500'
                                                : 'bg-green-500'
                                        }`}
                                    style={{
                                        width: `${Math.min(
                                            (personData.totalSpent / personData.totalBudgetAmount) * 100,
                                            100
                                        )}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Budget individuali */}
                    {personData.budgets.map(({ budget, data, transactions, categories }) => {
                        const isExpanded = expandedBudgets.has(budget.id);

                        return (
                            <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                {/* Header del budget */}
                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-medium text-gray-800 dark:text-white">
                                            {budget.description}
                                        </h4>
                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(data.periodStart)} - {formatDate(data.periodEnd)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-600 dark:text-gray-300">
                                            Spesi: {formatCurrency(data.currentSpent)}
                                        </span>
                                        <span className={`font-medium ${data.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            Rimanenti: {formatCurrency(data.remaining)}
                                        </span>
                                    </div>

                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${data.progressColor}`}
                                            style={{ width: `${Math.min(data.percentage, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                        <span>Budget: {formatCurrency(budget.amount)}</span>
                                        <span>{data.percentage.toFixed(1)}%</span>
                                    </div>

                                    {data.hasException && (
                                        <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-2">
                                            📅 Periodo eccezionale
                                            {data.exceptionReason && `: ${data.exceptionReason}`}
                                        </div>
                                    )}

                                    {/* Toggle per mostrare dettagli */}
                                    <button
                                        onClick={() => toggleBudgetExpansion(budget.id)}
                                        className="flex items-center justify-center w-full mt-3 p-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        <span className="mr-2">
                                            {isExpanded ? 'Nascondi dettagli' : 'Mostra dettagli'}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronUpIcon className="w-4 h-4" />
                                        ) : (
                                            <ChevronDownIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>

                                {/* Dettagli espandibili */}
                                {isExpanded && (
                                    <div className="p-4">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Categorie a sinistra */}
                                            <div>
                                                <h5 className="font-medium text-gray-800 dark:text-white mb-3">
                                                    Categorie ({categories.length})
                                                </h5>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {categories
                                                        .sort((a, b) => {
                                                            const aCount = transactions.filter(t => t.category === a).length;
                                                            const bCount = transactions.filter(t => t.category === b).length;
                                                            return bCount - aCount; // Ordinamento decrescente
                                                        })
                                                        .map(category => (
                                                        <div
                                                            key={category}
                                                            className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                                        >
                                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                                {CategoryUtils.getCategoryDisplayName(category, categoryOptions)}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {transactions.filter(t => t.category === category).length} tx
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Transazioni a destra */}
                                            <div>
                                                <h5 className="font-medium text-gray-800 dark:text-white mb-3">
                                                    Transazioni ({transactions.length})
                                                </h5>
                                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                                    {transactions.length > 0 ? (
                                                        transactions
                                                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                            .map(transaction => (
                                                                <div
                                                                    key={transaction.id}
                                                                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="font-medium text-gray-800 dark:text-white truncate">
                                                                            {transaction.description}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                {CategoryUtils.getCategoryDisplayName(transaction.category, categoryOptions)} • {formatDate(transaction.date)}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right ml-2">
                                                                        <div className="font-medium text-red-600 dark:text-red-400">
                                                                            -{formatCurrency(Math.abs(transaction.amount))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                                                            Nessuna transazione in questo periodo
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
});

BudgetProgress.displayName = 'BudgetProgress';
