export type RoleType = 'superadmin' | 'admin' | 'member';
export type AccountType = 'payroll' | 'savings' | 'cash' | 'investments';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionFrequencyType = 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
export type BudgetType = 'monthly' | 'annually';
export type PlanType = 'premium' | 'free';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid' | 'chart';

export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

export interface Plan {
  type: PlanType;
  name: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  user_ids: string[];
  plan: Plan;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme_color: string;
  budget_start_date: number;
  group_id: string;
  role: RoleType;
  budget_periods: BudgetPeriod[];
  clerk_id?: string; // Clerk user ID for authentication integration
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  user_ids: string[];
  group_id: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  user_id: string;
  account_id: string;
  to_account_id?: string | null;
  frequency?: TransactionFrequencyType;
  recurring_series_id?: string | null; // Link to recurring series if this transaction is generated from one
  group_id?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

/**
 * RecurringTransactionSeries - Template for recurring transactions
 * This entity represents the configuration for recurring transactions,
 * while individual Transaction records represent the actual executed transactions.
 */
export interface RecurringTransactionSeries {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: TransactionFrequencyType;
  user_id: string;
  account_id: string;
  transaction_ids?: string[]; // elenco id transazioni generate

  // Pianificazione
  start_date: string | Date;
  end_date?: string | Date | null;
  due_date: string | Date;

  // Stato e conteggio esecuzioni generate
  is_active: boolean;
  total_executions: number;

  created_at: string | Date;
  updated_at: string | Date;
}

export interface BudgetPeriod {
  id: string;
  user_id: string;
  start_date: string | Date;
  end_date: string | Date | null;
  total_spent: number;
  total_saved: number;
  category_spending: Record<string, number>;
  is_active: boolean;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Budget {
  id: string;
  description: string;
  amount: number;
  type: BudgetType;
  icon?: string;
  categories: string[];
  user_id: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface Category {
  id: string;
  label: string;
  key: string;
  icon: string;
  color: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface InvestmentHolding {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string | Date;
  group_id: string;
  created_at: string | Date;
  updated_at: string | Date;
}

export interface EnhancedHolding extends InvestmentHolding {
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface PortfolioData {
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  holdings: EnhancedHolding[];
}

export interface FilterState {
  member: string;
  budget: string;
  category: string;
  dateRange: string;
  type: string;
  minAmount: string;
  maxAmount: string;
}

export const AccountTypeMap: Record<AccountType, string> = {
  'payroll': 'Conto Corrente',
  'savings': 'Conto Risparmio',
  'cash': 'Contanti',
  'investments': 'Investimenti'
};
