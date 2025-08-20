// Core hooks
export { useFinance } from "./core/useFinance";

// === CONSOLIDATED HOOKS ===

// Entity Management (Accounts, Budgets, People)
export { useAccountManagement, useBudgetManagement, usePersonManagement } from "./entities/useEntityManagement";

// Feature Consolidations
export { useBudgets, BudgetPeriod } from "./features/useBudgets";
export { useTransactions } from "./features/useTransactions";
export { useInvestments } from "./features/useInvestments";
export { useOnboarding, OnboardingStep } from "./features/useOnboarding";
export { useReports, ReportType } from "./features/useReports";

// === SPECIALIZED HOOKS ===
// Specialized hooks that remain separate for specific use cases

// Data filters (still useful for specific use cases)
export {
  useAccountFilter,
  useAdvancedFilters,
  useAllFilters,
  useBudgetFilter,
  useInvestmentFilter,
  useTransactionFilter,
} from "./data/useDataFilters";
export { usePersonFilter, usePersonStats, usePersonValidation } from "./data/useDataFilters";
export { useAccountModals, useBudgetModals, usePersonModals, useSettingsModals } from "./data/useSettings";

// Specialized feature hooks
export { useAuthCallback } from "./features/auth/useAuthCallback";
export { useGroups } from "./features/groups/useGroups";
export { useGroupSettings } from "./features/groups/useGroupSettings";
export { useExpenseChart, useHomeData, useAccountOrdering } from "./features/home/home.hooks";
export { useReconciliation } from "./features/transactions/useReconciliation";

// UI hooks
export { useModal, useModalWithData, useMultipleModals } from "./ui/useModal";
export { useAccountForm, useModalForm, usePersonForm } from "./ui/useModalForm";
export {
  useBreakpoint,
  useDarkMode,
  useMediaQuery,
  useOrientation,
  useResponsive,
  useWindowSize,
} from "./ui/useResponsive";
export {
  validateAccountForm,
  validateBudgetForm,
  validateEditBudgetForm,
  validatePersonForm,
} from "./utils/validators";
