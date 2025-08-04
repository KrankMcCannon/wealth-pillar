export interface Person {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string;
}

export enum TransactionType {
  ENTRATA = 'entrata',
  SPESA = 'spesa',
}

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
  personIds: string[];
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO 8601 format
  type: TransactionType;
  category: Category;
  accountId: string;
  toAccountId?: string;
  isReconciled?: boolean;
  linkedTransactionId?: string;
  remainingAmount?: number; // Importo rimanente dopo riconciliazione
  createdAt?: string; // Timestamp di creazione per determinare l'ordine
}

export interface Budget {
  id: string;
  description: string;
  categories: string[];
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