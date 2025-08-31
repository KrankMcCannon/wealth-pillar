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

// Calculated/derived types for UI
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

// Account type mappings to English for UI
export const AccountTypeMap = {
  'stipendio': 'Salary',
  'risparmio': 'Savings', 
  'contanti': 'Cash',
  'investimenti': 'Investments'
} as const;

// Transaction type mappings
export const TransactionTypeMap = {
  'entrata': 'Income',
  'spesa': 'Expense'
} as const;

// Common categories in Italian (as per database)
export const CommonCategories = [
  'Alimentari',
  'Trasporti', 
  'Intrattenimento',
  'Bollette',
  'Salute',
  'Shopping',
  'Viaggi',
  'Educazione',
  'Casa',
  'Stipendio'
] as const;

// Budget periods
export const BudgetPeriods = {
  'monthly': 'Mensile',
  'annually': 'Annuale'
} as const;