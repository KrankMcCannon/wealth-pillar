import React, { memo } from 'react';
import type { Budget } from '../../types';
import { formatCurrency, formatDate } from '../../constants';
import { useBudgetProgress } from '../../hooks/features/dashboard/useBudgetProgress';

/**
 * Props per BudgetProgress
 */
interface BudgetProgressProps {
    budget: Budget;
}

/**
 * Componente UI puro per visualizzare il progresso di un budget
 * Separazione responsabilità: solo presentazione, logica delegata all'hook
 */
export const BudgetProgress = memo<BudgetProgressProps>(({ budget }) => {
    const { budgetData, budgetStatus } = useBudgetProgress(budget);

    if (!budgetData || !budgetStatus) {
        return null;
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800 dark:text-white">
                    {budget.description}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(budgetData.periodStart)} - {formatDate(budgetData.periodEnd)}
                </span>
            </div>

            <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                    Spesi: {formatCurrency(budgetData.currentSpent)}
                </span>
                <span className={`font-medium ${budgetData.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Rimanenti: {formatCurrency(budgetData.remaining)}
                </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${budgetData.progressColor}`}
                    style={{ width: `${Math.min(budgetData.percentage, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Budget: {formatCurrency(budget.amount)}</span>
                <span>{budgetData.percentage.toFixed(1)}%</span>
            </div>

            {budgetStatus.isNearLimit && (
                <div className={`text-xs font-medium ${
                    budgetStatus.isOverspent ? 'text-red-600' : 'text-orange-600'
                }`}>
                    {budgetStatus.statusMessage}
                </div>
            )}
        </div>
    );
});

BudgetProgress.displayName = 'BudgetProgress';
