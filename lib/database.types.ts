// Database types for Supabase - Generated from your database schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar: string;
          theme_color: string;
          budget_start_date: number;
          group_id: string;
          role: 'superadmin' | 'admin' | 'member';
          budget_periods: unknown; // jsonb
          clerk_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar: string;
          theme_color: string;
          budget_start_date: number;
          group_id: string;
          role: 'superadmin' | 'admin' | 'member';
          budget_periods?: unknown;
          clerk_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          avatar?: string;
          theme_color?: string;
          budget_start_date?: number;
          group_id?: string;
          role?: 'superadmin' | 'admin' | 'member';
          budget_periods?: unknown;
          clerk_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string;
          user_ids: string[];
          plan: unknown; // jsonb
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          user_ids: string[];
          plan: unknown;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          user_ids?: string[];
          plan?: unknown;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          type: 'payroll' | 'savings' | 'cash' | 'investments';
          user_ids: string[];
          group_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'payroll' | 'savings' | 'cash' | 'investments';
          user_ids: string[];
          group_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'payroll' | 'savings' | 'cash' | 'investments';
          user_ids?: string[];
          group_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          description: string;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          category: string;
          date: string;
          user_id: string | null;
          account_id: string;
          to_account_id: string | null;
          group_id: string | null;
          recurring_series_id: string | null;
          frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          category: string;
          date: string;
          user_id?: string | null;
          account_id: string;
          to_account_id?: string | null;
          group_id?: string | null;
          recurring_series_id?: string | null;
          frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          type?: 'income' | 'expense' | 'transfer';
          category?: string;
          date?: string;
          user_id?: string | null;
          account_id?: string;
          to_account_id?: string | null;
          group_id?: string | null;
          recurring_series_id?: string | null;
          frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          label: string;
          key: string;
          icon: string;
          color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          key: string;
          icon: string;
          color: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          key?: string;
          icon?: string;
          color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          description: string;
          amount: number;
          type: 'monthly' | 'annually';
          icon: string | null;
          categories: string[];
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          description: string;
          amount: number;
          type: 'monthly' | 'annually';
          icon?: string | null;
          categories: string[];
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          description?: string;
          amount?: number;
          type?: 'monthly' | 'annually';
          icon?: string | null;
          categories?: string[];
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          name: string;
          description: string;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          category: string;
          frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          user_id: string;
          account_id: string;
          to_account_id: string | null;
          start_date: string;
          end_date: string | null;
          next_due_date: string;
          day_of_month: number | null;
          day_of_week: number | null;
          month_of_year: number | null;
          is_active: boolean;
          is_paused: boolean;
          pause_until: string | null;
          last_executed_date: string | null;
          total_executions: number;
          failed_executions: number;
          auto_execute: boolean;
          notify_before_days: number;
          tags: string[] | null;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          amount: number;
          type: 'income' | 'expense' | 'transfer';
          category: string;
          frequency: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          user_id: string;
          account_id: string;
          to_account_id?: string | null;
          start_date: string;
          end_date?: string | null;
          next_due_date: string;
          day_of_month?: number | null;
          day_of_week?: number | null;
          month_of_year?: number | null;
          is_active?: boolean;
          is_paused?: boolean;
          pause_until?: string | null;
          last_executed_date?: string | null;
          total_executions?: number;
          failed_executions?: number;
          auto_execute?: boolean;
          notify_before_days?: number;
          tags?: string[] | null;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          amount?: number;
          type?: 'income' | 'expense' | 'transfer';
          category?: string;
          frequency?: 'once' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
          user_id?: string;
          account_id?: string;
          to_account_id?: string | null;
          start_date?: string;
          end_date?: string | null;
          next_due_date?: string;
          day_of_month?: number | null;
          day_of_week?: number | null;
          month_of_year?: number | null;
          is_active?: boolean;
          is_paused?: boolean;
          pause_until?: string | null;
          last_executed_date?: string | null;
          total_executions?: number;
          failed_executions?: number;
          auto_execute?: boolean;
          notify_before_days?: number;
          tags?: string[] | null;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_transactions_by_user: {
        Args: {
          p_user_id: string;
          p_limit?: number;
          p_offset?: number;
          p_start_date?: string;
          p_end_date?: string;
          p_category?: string;
          p_type?: string;
          p_account_id?: string;
        };
        Returns: {
          id: string;
          description: string;
          amount: number;
          type: string;
          category: string;
          date: string;
          user_id: string;
          account_id: string;
          to_account_id: string;
          group_id: string;
          recurring_series_id: string;
          frequency: string;
          created_at: string;
          updated_at: string;
        }[];
      };
      calculate_account_balance: {
        Args: {
          p_account_id: string;
          p_end_date?: string;
        };
        Returns: number;
      };
      get_monthly_spending_by_category: {
        Args: {
          p_user_id: string;
          p_year: number;
          p_month: number;
        };
        Returns: {
          category: string;
          total_amount: number;
          transaction_count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}