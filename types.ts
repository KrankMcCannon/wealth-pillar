export interface Person {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string; // ISO date string for when this person's monthly budget cycle starts (e.g., "2025-08-01")
}

export enum TransactionType {
  ENTRATA = 'entrata',
  SPESA = 'spesa',
}

// Category is now a string ID that corresponds to categories from the database
export type Category = string;

export interface CategoryOption {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'checking' | 'savings' | 'cash' | 'investment';
  personIds: string[]; // Cambiato da personId a personIds array
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO 8601 format
  type: TransactionType;
  category: Category;
  accountId: string;
  toAccountId?: string; // Solo per trasferimenti tra account
  isReconciled?: boolean;
  linkedTransactionId?: string;
}

export interface Budget {
  id: string;
  description: string; // Changed from category to description
  categories: string[]; // Array of category IDs that belong to this budget
  amount: number;
  period: 'monthly' | 'annually';
  personId: string;
}

export interface InvestmentHolding {
    id: string;
    personId: string;
    name: string;
    symbol: string;
    quantity: number;
    purchasePrice: number;
    currentPrice: number;
    purchaseDate: string; // ISO 8601 format
}