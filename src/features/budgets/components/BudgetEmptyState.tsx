/**
 * BudgetEmptyState Component
 * Shown when no budgets are available
 */

'use client';

import { budgetStyles } from '../theme/budget-styles';
import { ShoppingCart } from 'lucide-react';
import React from 'react';

export interface BudgetEmptyStateProps {
  onCreateBudget?: () => void;
}

export function BudgetEmptyState({ onCreateBudget }: BudgetEmptyStateProps) {
  return (
    <div className={budgetStyles.emptyState.container}>
      <div className={budgetStyles.emptyState.icon}>
        <ShoppingCart className={budgetStyles.emptyState.iconContent} />
      </div>
      <h3 className={budgetStyles.emptyState.title}>Nessun budget disponibile</h3>
      <p className={budgetStyles.emptyState.text}>Crea il tuo primo budget per iniziare</p>
      {onCreateBudget && (
        <button
          onClick={onCreateBudget}
          className="mt-4 text-primary font-semibold hover:underline"
        >
          Crea budget →
        </button>
      )}
    </div>
  );
}
