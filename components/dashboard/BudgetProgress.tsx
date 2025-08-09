import React, { memo, useMemo } from 'react';
import { Budget, Transaction, Person, TransactionType } from '../../types';
import { useFinance } from '../../hooks/useFinance';
import { formatCurrency, getCurrentBudgetPeriod } from '../../constants';

/**
 * Props per BudgetProgress
 */
interface BudgetProgressProps {
    budget: Budget;
    transactions: Transaction[];
    person: Person;
}

/**
 * Componente BudgetProgress ottimizzato
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione del progresso budget
 * Principio DRY: Don't Repeat Yourself - logica riutilizzabile
 */
export const BudgetProgress = memo<BudgetProgressProps>(({ budget, transactions, person }) => {
    const {
        getCategoryName,
        getEffectiveTransactionAmount,
        getPersonById,
        getAccountById,
        getRemainingAmount
    } = useFinance();

    // Memoized calculations per ottimizzare le performance
    const budgetData = useMemo(() => {
        const budgetPerson = getPersonById(budget.personId) || person;
        const { periodStart, periodEnd } = getCurrentBudgetPeriod(budgetPerson);

        const currentSpent = transactions
            .filter(t => {
                const account = getAccountById(t.accountId);
                const isInAccount = account.personIds.includes(budget.personId);
                const txDate = new Date(t.date);
                const isInPeriod = txDate >= periodStart && txDate <= periodEnd;
                const isInCategory = budget.categories.includes(t.category);
                const isSpesa = t.type === TransactionType.SPESA;
                const isTransfer = t.category === 'trasferimento';
                return isInPeriod && isInCategory && isSpesa && !isTransfer && isInAccount;
            })
            .reduce((sum, t) => {
                const amount = t.isReconciled ? getRemainingAmount(t) : getEffectiveTransactionAmount(t);
                return sum + amount;
            }, 0);

        const percentage = budget.amount > 0 ? (currentSpent / budget.amount) * 100 : 0;
        const remaining = budget.amount - currentSpent;

        return {
            currentSpent,
            percentage,
            remaining,
            periodStart,
            periodEnd,
            categoryNames: budget.categories.map(catId => getCategoryName(catId)).join(', ')
        };
    }, [budget, transactions, person, getCategoryName, getEffectiveTransactionAmount, getPersonById, getRemainingAmount]);

    const formatDate = (date: Date) =>
        date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

    const getProgressColor = () => {
        if (budgetData.percentage > 100) return 'bg-red-500';
        if (budgetData.percentage > 80) return 'bg-yellow-500';
        return 'bg-green-500';
    };

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
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                    style={{ width: `${Math.min(budgetData.percentage, 100)}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Budget: {formatCurrency(budget.amount)}</span>
                <span>{budgetData.percentage.toFixed(1)}%</span>
            </div>

            <div className="text-xs text-gray-500 dark:text-gray-400">
                Categorie: {budgetData.categoryNames}
            </div>
        </div>
    );
});

BudgetProgress.displayName = 'BudgetProgress';
