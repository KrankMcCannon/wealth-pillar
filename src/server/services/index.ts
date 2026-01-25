/**
 * Services Layer - Business Logic
 */

// Core Services
export { UserService } from "./user.service";
export { AccountService, type CreateAccountInput, type UpdateAccountInput } from "./account.service";
export { BudgetService, type CreateBudgetInput, type UpdateBudgetInput } from "./budget.service";
export { CategoryService, type CreateCategoryInput, type UpdateCategoryInput } from "./category.service";
export { TransactionService, type CreateTransactionInput, type UpdateTransactionInput } from "./transaction.service";

// Feature Services
export { UserPreferencesService, type UserPreferences } from "./user-preferences.service";
export { GroupService } from "./group.service";
export { GroupInvitationService, type GroupInvitation, type CreateInvitationInput } from "./group-invitation.service";
export { BudgetPeriodService } from "./budget-period.service";
export { RecurringService, RecurringService as RecurringTransactionService } from "./recurring.service";
export { FinanceLogicService } from "./finance-logic.service";
export { ReportPeriodService, type EnrichedBudgetPeriod } from "./report-period.service";
export { PageDataService } from "./page-data.service";
export { InvestmentService } from "./investment.service";
export { MarketDataService } from "./market-data-service";
export { AvailableSharesService } from "./available-shares.service";

// Shared Types
export type { BudgetProgress, UserBudgetSummary } from '@/lib/types';
export type { CategoryMetric, ReportMetrics } from './transaction.logic';
