// Core hooks
export { useFinance } from "./core/useFinance";

// Data hooks
export {
  useTransactionFilter,
  useAccountFilter,
  useBudgetFilter,
  useInvestmentFilter,
  useAllFilters,
  useAdvancedFilters,
} from "./data/useDataFilters";
export { usePersonFilter, usePersonValidation, usePersonStats } from "./data/usePersonFilter";
export { useSettingsModals, useAccountModals, usePersonModals, useBudgetModals } from "./data/useSettings";

// Feature hooks - Accounts
export { useAddAccount } from "./features/accounts/useAddAccount";
export { useEditAccount } from "./features/accounts/useEditAccount";

// Feature hooks - Auth
export { useAuthCallback } from "./features/auth/useAuthCallback";

// Feature hooks - Budgets
export {
  useBudgetState,
  useBudgetPeriods,
  useBudgetPeriodButton,
  useBudgetTransactions,
  useBudgetProgress,
  useAddBudget,
  useBudgetForm,
} from "./features/budgets";

// Feature hooks - Dashboard
export { useDashboardData } from "./features/dashboard/useDashboardData";
export { useExpenseChart } from "./features/dashboard/useExpenseChart";

// Feature hooks - Groups
export { useGroups } from "./features/groups/useGroups";
export { useGroupSettings } from "./features/groups/useGroupSettings";

// Feature hooks - Investments
export { useAddInvestment } from "./features/investments/useAddInvestment";
export { useCompoundInterest } from "./features/investments/useCompoundInterest";
export { usePortfolioSummary, useInvestmentRow } from "./features/investments/useInvestmentCalculations";
export { useInvestmentModals } from "./features/investments/useInvestmentModals";

// Feature hooks - Onboarding
export {
  useOnboarding,
  OnboardingStep,
  type OnboardingGroup,
  type OnboardingPerson,
  type OnboardingAccount,
  type OnboardingBudget,
} from "./features/onboarding/useOnboarding";
export { useOnboardingAccountsForm } from "./features/onboarding/useOnboardingAccountsForm";
export { useOnboardingBudgetsForm } from "./features/onboarding/useOnboardingBudgetsForm";
export { useOnboardingGroupForm } from "./features/onboarding/useOnboardingGroupForm";
export { useOnboardingPeopleForm } from "./features/onboarding/useOnboardingPeopleForm";
export { useOnboardingState } from "./features/onboarding/useOnboardingState";

// Feature hooks - Reports
export { useBudgetHistory } from "./features/reports/useBudgetHistory";
export { useAnnualReports, useYearSelection } from "./features/reports/useReportsData";
export { useReportsPage } from "./features/reports/useReportsPage";

// Feature hooks - Settings
export { useEditBudget } from "./features/settings/useEditBudget";
export { useEditPerson } from "./features/settings/useEditPerson";

// Feature hooks - Transactions
export { useAddTransaction } from "./features/transactions/useAddTransaction";
export { useEditTransaction } from "./features/transactions/useEditTransaction";
export { useTransactionFilters } from "./features/transactions/useTransactionFilters";
export { useTransactionLinking } from "./features/transactions/useTransactionLinking";
export { useTransactionVisual, useTransactionRowClasses } from "./features/transactions/useTransactionVisual";

// UI hooks
export { useModal, useMultipleModals, useModalWithData } from "./ui/useModal";
export { useModalForm, useAccountForm, usePersonForm } from "./ui/useModalForm";
export {
  useResponsive,
  useBreakpoint,
  useWindowSize,
  useDarkMode,
  useMediaQuery,
  useOrientation,
} from "./ui/useResponsive";
export { useTransactionDisplay } from "./ui/useTransactionDisplay";

// Utility hooks
export { useAsync, useCrud, useLoadingState } from "./utils/useAsync";
export {
  validateAccountForm,
  validateBudgetForm,
  validateEditBudgetForm,
  validatePersonForm,
} from "./utils/validators";
