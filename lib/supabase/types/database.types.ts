/**
 * Database Types for Supabase
 * Generated types for type-safe database operations
 */

// Base types for the application
export interface Database {
  public: {
    Tables: {
      people: {
        Row: {
          id: string;
          name: string;
          avatar: string;
          theme_color: string;
          budget_start_date: string;
          budget_periods: any[] | null; // JSON array di BudgetPeriodData
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          avatar?: string;
          theme_color?: string;
          budget_start_date: string;
          budget_periods?: any[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar?: string;
          theme_color?: string;
          budget_start_date?: string;
          budget_periods?: any[] | null;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          type: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
          balance: number;
          initial_balance: number;
          person_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
          balance?: number;
          initial_balance: number;
          person_ids: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'stipendio' | 'risparmio' | 'contanti' | 'investimenti';
          balance?: number;
          initial_balance?: number;
          person_ids?: string[];
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
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
          linked_transaction_id: string | null; // Deprecated field
          remaining_amount: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          type: 'entrata' | 'spesa';
          category: string;
          date: string;
          account_id: string;
          to_account_id?: string | null;
          is_reconciled?: boolean;
          parent_transaction_id?: string | null;
          linked_transaction_id?: string | null;
          remaining_amount?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          type?: 'entrata' | 'spesa';
          category?: string;
          date?: string;
          account_id?: string;
          to_account_id?: string | null;
          is_reconciled?: boolean;
          parent_transaction_id?: string | null;
          linked_transaction_id?: string | null;
          remaining_amount?: number | null;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          description: string;
          amount: number;
          period: 'monthly' | 'annually';
          categories: string[];
          person_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description?: string;
          amount: number;
          period: 'monthly' | 'annually';
          categories: string[];
          person_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          period?: 'monthly' | 'annually';
          categories?: string[];
          person_id?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          updated_at?: string;
        };
      };
      investment_holdings: {
        Row: {
          id: string;
          person_id: string;
          name: string;
          symbol: string;
          quantity: number;
          purchase_price: number;
          current_price: number;
          purchase_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          person_id: string;
          name: string;
          symbol: string;
          quantity: number;
          purchase_price: number;
          current_price: number;
          purchase_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          person_id?: string;
          name?: string;
          symbol?: string;
          quantity?: number;
          purchase_price?: number;
          current_price?: number;
          purchase_date?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Utility types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
