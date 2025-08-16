// === Core Hooks ===
export { useFinance } from './core/useFinance';

// === UI Hooks ===
export { useModal, useModalWithData, useMultipleModals } from './ui/useModal';
export { useAccountForm, useModalForm, usePersonForm } from './ui/useModalForm';
export { useBreakpoint, useDarkMode, useMediaQuery, useResponsive, useWindowSize } from './ui/useResponsive';
export { useTransactionDisplay } from './ui/useTransactionDisplay';

// === Data Hooks ===
export { useAccountFilter, useAdvancedFilters, useAllFilters, useBudgetFilter, useInvestmentFilter, useTransactionFilter } from './data/useDataFilters';
export { usePersonFilter, usePersonStats, usePersonValidation } from './data/usePersonFilter';
export { useAccountModals, useBudgetModals, usePersonModals, useSettingsModals } from './data/useSettings';

// === Features Hooks ===
// Accounts
export { useAddAccount } from './features/accounts/useAddAccount';
export { useEditAccount } from './features/accounts/useEditAccount';

// Auth
export { useAuthCallback } from './features/auth/useAuthCallback';

// Budgets
export { useAddBudget } from './features/budgets/useAddBudget';
export { useBudgetData } from './features/budgets/useBudgetData';
export { useBudgetPeriodButton } from './features/budgets/useBudgetPeriodButton';
export { useBudgetPeriods } from './features/budgets/useBudgetPeriods';
export { useBudgetProgress } from './features/budgets/useBudgetProgress';
export { useBudgetTransactions } from './features/budgets/useBudgetTransactions';

// Dashboard
export { useDashboardData } from './features/dashboard/useDashboardData';
export { useExpenseChart } from './features/dashboard/useExpenseChart';

// Groups
export { useGroups } from './features/groups/useGroups';
export { useGroupSettings } from './features/groups/useGroupSettings';

// Investments
export { useAddInvestment } from './features/investments/useAddInvestment';
export { useCompoundInterest } from './features/investments/useCompoundInterest';
export { useInvestmentRow, usePortfolioSummary } from './features/investments/useInvestmentCalculations';
export { useInvestmentModals } from './features/investments/useInvestmentModals';

// Onboarding
export { useOnboarding } from './features/onboarding/useOnboarding';
export { useOnboardingState } from './features/onboarding/useOnboardingState';

// Reports
export { useBudgetHistory } from './features/reports/useBudgetHistory';
export { useAnnualReports, useYearSelection } from './features/reports/useReportsData';
export { useReportsPage } from './features/reports/useReportsPage';

// Settings
export { useEditBudget } from './features/settings/useEditBudget';
export { useEditPerson } from './features/settings/useEditPerson';

// Transactions
export { useAddTransaction } from './features/transactions/useAddTransaction';
export { useEditTransaction } from './features/transactions/useEditTransaction';
export { useTransactionFilters } from './features/transactions/useTransactionFilters';
export { useTransactionLinking } from './features/transactions/useTransactionLinking';
export { useTransactionRowClasses, useTransactionVisual } from './features/transactions/useTransactionVisual';

// === Utility Hooks ===
// Hook di utilità generale
export { useAsync } from './utils/useAsync';
export { validateAccountForm, validateBudgetForm, validateEditBudgetForm, validatePersonForm } from './utils/validators';

