import { revalidatePath } from 'next/cache';

/**
 * Segment paths (senza prefisso locale — coerente con `revalidatePath` in App Router + next-intl).
 */
export const APP_ROUTE = {
  transactions: '/transactions',
  accounts: '/accounts',
  home: '/home',
  budgets: '/budgets',
  reports: '/reports',
  investments: '/investments',
} as const;

/** Dopo mutazioni sulle transazioni: liste, saldi, report e budget collegati. */
export const TRANSACTION_MUTATION_PATHS = [
  APP_ROUTE.transactions,
  APP_ROUTE.accounts,
  APP_ROUTE.home,
  APP_ROUTE.budgets,
  APP_ROUTE.reports,
] as const;

/** Dopo creazione/aggiornamento/cancellazione account. */
export const ACCOUNT_MUTATION_PATHS = [APP_ROUTE.accounts, APP_ROUTE.home] as const;

/** Dopo mutazioni sui budget (card, importi, ecc.). */
export const BUDGET_MUTATION_PATHS = [APP_ROUTE.budgets, APP_ROUTE.home] as const;

/** Dopo mutazioni sui periodi budget (allineamento a budget-period-actions). */
export const BUDGET_PERIOD_MUTATION_PATHS = [APP_ROUTE.budgets, APP_ROUTE.reports] as const;

export const INVESTMENT_MUTATION_PATHS = [APP_ROUTE.investments] as const;

export function revalidatePaths(paths: readonly string[]): void {
  for (const p of paths) {
    revalidatePath(p);
  }
}

export function revalidateTransactionRelatedPaths(): void {
  revalidatePaths(TRANSACTION_MUTATION_PATHS);
}

export function revalidateAccountRelatedPaths(): void {
  revalidatePaths(ACCOUNT_MUTATION_PATHS);
}

export function revalidateBudgetRelatedPaths(): void {
  revalidatePaths(BUDGET_MUTATION_PATHS);
}

export function revalidateBudgetPeriodRelatedPaths(): void {
  revalidatePaths(BUDGET_PERIOD_MUTATION_PATHS);
}

export function revalidateInvestmentRelatedPaths(): void {
  revalidatePaths(INVESTMENT_MUTATION_PATHS);
}
