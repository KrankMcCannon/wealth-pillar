// === Indice Centralizzato degli Hook ===
// Struttura riorganizzata seguendo principi di Clean Architecture

// === Core Hooks ===
// Hook fondamentali per la gestione dei dati principali
export { useFinance } from './core/useFinance';

// === UI Hooks ===
// Hook per gestione interfaccia utente e interazioni
export * from './ui/useModal';
export * from './ui/useModalForm';
export * from './ui/useResponsive';

// === Data Hooks ===
// Hook per gestione e filtro dei dati
export * from './data/useDataFilters';
export * from './data/usePersonFilter';
export * from './data/useSettings';

// === Features Hooks ===
// Hook organizzati per funzionalità specifiche

// Autenticazione
export * from './features/auth/useAuthCallback';

// Dashboard
export * from './features/dashboard/useDashboardData';

// Investimenti
export * from './features/investments/useCompoundInterest';
export * from './features/investments/useInvestmentModals';

// Report e Analisi
export * from './features/reports/useReportsData';

// Transazioni
export * from './features/transactions/useTransactionFilters';
export * from './features/transactions/useTransactionLinking';

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

