/**
 * TypeScript types based on the database schema
 * Aligned with the Supabase database structure
 */

// Core entity types based on database schema
export interface Group {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  name: string;
  avatar: string;
  theme_color: string;
  budget_start_date: string;
  budget_periods: string[] | null;
  group_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  type: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
  balance: number;
  initial_balance: number;
  person_ids: string[];
  group_id: string;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'entrata' | 'spesa';
  category: string;
  date: string;
  account_id: string;
  to_account_id: string | null;
  is_reconciled: boolean;
  parent_transaction_id: string | null;
  linked_transaction_id: string | null;
  remaining_amount: number | null;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  description: string;
  amount: number;
  period: 'monthly' | 'annually';
  categories: string[];
  person_id: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentHolding {
  id: string;
  person_id: string;
  name: string;
  symbol: string;
  quantity: number;
  purchase_price: number;
  current_price: number;
  purchase_date: string;
  group_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccountWithBalance extends Account {
  total_value?: number;
  gain_loss?: number;
  gain_loss_percent?: number;
}

export interface TransactionWithAccount extends Transaction {
  account?: Account;
  to_account?: Account;
}

export interface BudgetWithSpent extends Budget {
  spent_amount?: number;
  remaining_amount?: number;
  percentage_used?: number;
}

// Italian localization mappings - consistent with dummy data
export const AccountTypeMap = {
  'stipendio': 'Stipendio',
  'risparmio': 'Risparmio',
  'contanti': 'Contanti',
  'investimenti': 'Investimenti'
} as const;

export const TransactionTypeMap = {
  'entrata': 'Entrata',
  'spesa': 'Spesa'
} as const;

// Comprehensive category list matching dummy data
export const CommonCategories = [
  'Alimentari',
  'Trasporti',
  'Intrattenimento',
  'Bollette',
  'Salute',
  'Shopping',
  'Viaggi',
  'Educazione',
  'Casa & Giardino',
  'Stipendio'
] as const;

export const BudgetPeriods = {
  'monthly': 'Mensile',
  'annually': 'Annuale'
} as const;

// Type-safe category and account type definitions
export type AccountType = keyof typeof AccountTypeMap;
export type TransactionType = keyof typeof TransactionTypeMap;
export type CategoryName = typeof CommonCategories[number];
export type BudgetPeriod = keyof typeof BudgetPeriods;

// Enhanced transaction interface with Italian typing
export interface EnhancedTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: CategoryName | string;
  date: string;
  account: string;
  icon?: string;
}

export interface ExpenseData {
  category: string;
  amount: number;
  color: string;
}

export interface IncomeData {
  month: string;
  amount: number;
}

export interface BudgetData {
  category: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
}

export interface MemberData {
  id: string;
  name: string;
  avatar: string;
  color: string;
  accounts: {
    stipendio: number;
    risparmio: number;
    contanti: number;
    investimenti: number;
  };
  budgets: BudgetData[];
  transactions: TransactionPageTransaction[];
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

export type PlanType = 'superadmin' | 'admin' | 'member' | 'free';
export type RoleType = 'superadmin' | 'admin' | 'member';

export interface Plan {
  type: PlanType;
  name: string;
  description: string;
  features: string[];
  maxMembers?: number;
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: RoleType;
  joinDate: string;
  isActive: boolean;
}

export interface DashboardBankAccount {
  id: number;
  name: string;
  type: string;
  owner: string;
  balance: number;
  icon: string;
  color: string;
}

export interface DashboardBudget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  color: string;
  icon: string;
  categories: Array<{
    name: string;
    transactions: number;
    amount: number;
  }>;
}

export interface UpcomingTransaction {
  id: number;
  title: string;
  bankAccount: string;
  daysRemaining: number;
  amount: number;
  icon: string;
  memberId?: string;
}

export interface RecurrentTransaction {
  id: number;
  title: string;
  category: string;
  amount: number;
  frequency: string;
  nextDate: string;
  icon: string;
  account: string;
  memberId?: string;
}

export interface BudgetPageBudget {
  id: number;
  name: string;
  amount: number;
  spent: number;
  color: string;
  icon: string;
}

// Updated daily expense data with Italian properties
export interface DailyExpenseData {
  day: string;
  alimentari: number;
  intrattenimento: number;
  shopping: number;
}

export interface BudgetCategory {
  name: CategoryName | string;
  color: string;
}

export interface BudgetPageTransaction {
  id: number;
  title: string;
  category: CategoryName | string;
  amount: number;
  date: string;
}

// Consolidated transaction interface for consistency
export interface TransactionPageTransaction {
  id: number;
  title: string;
  category: CategoryName | string;
  description?: string;
  amount: number;
  type: 'income' | 'expense'; // Keep for compatibility with existing code
  date: string;
  icon: string;
  account?: string;
}

// Improved chart data interface with Italian structure
export interface ChartData {
  expense: number[];
  income: number[];
  dailyExpenses: DailyExpenseData[];
}

export interface BudgetPeriodData {
  start_date: string;
  end_date: string;
  is_current: boolean;
}

// Icon mapping for consistent UI
export const CategoryIcons: Record<string, string> = {
  'Alimentari': '🛒',
  'Trasporti': '🚗',
  'Intrattenimento': '🎬',
  'Bollette': '🏠',
  'Salute': '🏥',
  'Shopping': '🛍️',
  'Viaggi': '✈️',
  'Educazione': '📚',
  'Casa & Giardino': '🏡',
  'Stipendio': '💰'
};

// Status types for better state management
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid' | 'chart';

// Enhanced error interface
export interface AppError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
}

export interface BudgetCardProps {
  budget: BudgetWithSpent;
  variant?: 'compact' | 'detailed';
  className?: string;
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