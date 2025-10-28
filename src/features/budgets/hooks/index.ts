/**
 * Budgets Hooks Barrel Export
 * Public API for all budget-related custom hooks
 */

// New consolidated hooks
export { useBudgetsData, isSectionReady } from './useBudgetsData';
export type { BudgetsDataState, BudgetsDataSection } from './useBudgetsData';

export { useBudgetsState } from './useBudgetsState';
export type { BudgetsPageState, BudgetsPageActions } from './useBudgetsState';

// Keep existing hooks for backward compatibility (they may be used elsewhere)
export { useBudgetsController } from './use-budgets-controller';
export { useBudgetFormController } from './use-budget-form-controller';
