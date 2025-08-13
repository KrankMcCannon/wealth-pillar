// === Indice Centralizzato degli Hook ===
// Struttura riorganizzata seguendo principi di Clean Architecture

// === Core Hooks ===
// Hook fondamentali per la gestione dei dati principali
export { useFinance } from './core/useFinance';

// === Features Hooks ===
// Hook per funzionalità specifiche
export * from './features/groups';

// === UI Hooks ===
// Hook per gestione interfaccia utente e interazioni
export * from './ui/useModal';
export * from './ui/useModalForm';
export * from './ui/useResponsive';
export * from './ui/useTransactionDisplay';

// === Data Hooks ===
// Hook per gestione e filtro dei dati
export * from './data/useDataFilters';
export * from './data/usePersonFilter';
export * from './data/useSettings';

// === Features Hooks ===
// Hook organizzati per funzionalità specifiche

// Features - Auth
export { useAuthCallback } from './features/auth/useAuthCallback';

// Features - Onboarding
export { useOnboarding } from './features/onboarding/useOnboarding';
export { useOnboardingState } from './features/onboarding/useOnboardingState';

// Dashboard
// Features - Dashboard
export { useDashboardData } from './features/dashboard/useDashboardData';
export { useExpenseChart } from './features/dashboard/useExpenseChart';

// Investimenti
// Features - Investments
export { useCompoundInterest } from './features/investments/useCompoundInterest';
export { useInvestmentRow, usePortfolioSummary } from './features/investments/useInvestmentCalculations';
export { useInvestmentModals } from './features/investments/useInvestmentModals';

// Report e Analisi
export * from './features/reports/useReportsData';

// Transazioni
export * from './features/transactions/useTransactionFilters';
export * from './features/transactions/useTransactionLinking';

// Features - Accounts
export { useAddAccount } from './features/accounts/useAddAccount';
export { useEditAccount } from './features/accounts/useEditAccount';

// Features - Budgets
export { useAddBudget } from './features/budgets/useAddBudget';

// Features - Budget
export { useBudgetData } from './features/budget/useBudgetData';
export { useBudgetPeriods } from './features/budget/useBudgetPeriods';
export { useBudgetTransactions } from './features/budget/useBudgetTransactions';

// Features - Reports
export { useBudgetHistory } from './features/reports/useBudgetHistory';
export { useAnnualReports } from './features/reports/useReportsData';

// Features - Investments
export { useAddInvestment } from './features/investments/useAddInvestment';

// Features - Settings
export { useEditBudget } from './features/settings/useEditBudget';
export { useEditPerson } from './features/settings/useEditPerson';

// Features - Transactions
export { useAddTransaction } from './features/transactions/useAddTransaction';
export { useEditTransaction } from './features/transactions/useEditTransaction';

// === Utility Hooks ===
// Hook di utilità generale
export * from './utils/useAsync';

/**
 * === Guida alla Nuova Struttura ===
 * 
 * /hooks/
 * ├── /core/           - Hook fondamentali (useFinance, etc.)
 * ├── /ui/             - Hook per UI (modali, responsive, form)
 * ├── /data/           - Hook per gestione dati (filtri, persone, settings)
 * ├── /features/       - Hook per funzionalità specifiche
 * │   ├── /auth/       - Autenticazione
 * │   ├── /dashboard/  - Dashboard
 * │   ├── /investments/- Investimenti
 * │   ├── /reports/    - Report e analisi
 * │   └── /transactions/ - Transazioni
 * └── /utils/          - Hook di utilità generale
 * 
 * Principi di organizzazione:
 * - ✅ Separazione per responsabilità (core, ui, data, features)
 * - ✅ Raggruppamento logico delle funzionalità
 * - ✅ Struttura scalabile per nuove features
 * - ✅ Import chiari e ordinati
 * - ✅ Facilità di manutenzione e debugging
 */

