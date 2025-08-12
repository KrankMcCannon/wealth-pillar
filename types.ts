export interface BudgetPeriodData {
  startDate: string; // Data di inizio del periodo (es. "2025-07-01")
  endDate?: string; // Data di fine del periodo (es. "2025-07-31") - opzionale finché non completato
  isCompleted: boolean; // Se il periodo è stato marcato come completato
}

export interface Person {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string;
  budgetPeriods?: BudgetPeriodData[]; // Periodi di budget con stato di completamento
}

export enum TransactionType {
  ENTRATA = 'entrata',
  SPESA = 'spesa',
}

export type Category = string;

export interface CategoryOption {
  id: string;
  name: string;
  label: string;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  type: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
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
  parentTransactionId?: string; // Parent transaction for reconciliation
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