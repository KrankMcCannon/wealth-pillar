export type RoleType = 'superadmin' | 'admin' | 'member';
export type AccountType = 'payroll' | 'savings' | 'cash' | 'investments';
export type TransactionType = 'income' | 'expense' | 'recurrent' | 'transfer';
export type TransactionStatusType = 'not_reconciled' | 'partly_reconciled' | 'reconciled';
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
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  theme_color: string;
  budget_start_date: number;
  budget_periods: BudgetPeriod[] | null;
  group_id: string;
  role: RoleType;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  user_ids: string[];
  group_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: Date;
  user_id: string;
  account_id: string;
  to_account_id: string | null;
  status: TransactionStatusType;
  linked_transaction_ids: string[] | [];
  frequency?: TransactionFrequencyType;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetPeriod {
  start_date: Date;
  end_date: Date;
}

export interface Budget {
  id: string;
  description: string;
  amount: number;
  type: BudgetType;
  icon?: string;
  categories: string[];
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  label: string;
  key: string;
  icon: string;
  color: string;
  created_at: Date;
  updated_at: Date;
}

export interface InvestmentHolding {
  id: string;
  user_id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: Date;
  group_id: string;
  created_at: Date;
  updated_at: Date;
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