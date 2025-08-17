export interface BudgetPeriodData {
  startDate: string; // Data di inizio del periodo (es. "2025-07-01")
  endDate?: string; // Data di fine del periodo (es. "2025-07-31") - opzionale finché non completato
  isCompleted: boolean; // Se il periodo è stato marcato come completato
}

export interface BudgetCalculationData {
  currentSpent: number; // Importo speso nel periodo corrente
  percentage: number; // Percentuale di utilizzo del budget (0-100)
  remaining: number; // Importo rimanente
  periodStart: Date; // Data di inizio del periodo
  periodEnd: Date; // Data di fine del periodo
  progressColor: string; // Classe CSS per il colore della barra di progresso
  isCompleted: boolean; // Se il periodo è completato
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  userId: string; // ID del proprietario del gruppo (utente Clerk che l'ha creato)
  isActive: boolean; // Se il gruppo è attivo
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string;
  budgetPeriods?: BudgetPeriodData[]; // Periodi di budget con stato di completamento
  groupId: string; // ID del gruppo a cui appartiene la persona (obbligatorio)
  role: "owner" | "admin" | "member"; // Ruolo della persona nel gruppo (obbligatorio)
  createdAt: string;
  updatedAt: string;
}

export enum TransactionType {
  ENTRATA = "entrata",
  SPESA = "spesa",
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
  type: "stipendio" | "risparmio" | "contanti" | "investimenti";
  personIds: string[];
  groupId: string; // Associazione al gruppo
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
  period: "monthly" | "annually";
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
  groupId: string; // Associazione al gruppo
}

// Onboarding types
export interface OnboardingGroup {
  name: string;
  description?: string;
}

export interface OnboardingPerson {
  name: string;
  avatar: string;
  themeColor: string;
  budgetStartDate: string;
}

export interface OnboardingAccount {
  name: string;
  type: "stipendio" | "risparmio" | "contanti" | "investimenti";
  personId: string;
}

export interface OnboardingBudget {
  description: string;
  amount: number;
  categories: string[];
  personId: string;
}
