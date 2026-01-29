export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string
          name: string
          type: string
          user_ids: string[]
          group_id: string
          balance: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          user_ids?: string[]
          group_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          user_ids?: string[]
          group_id?: string
          balance?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      budgets: {
        Row: {
          id: string
          description: string
          amount: number
          type: string
          icon: string | null
          categories: Json
          user_id: string
          group_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type?: string
          icon?: string | null
          categories?: Json
          user_id: string
          group_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: string
          icon?: string | null
          categories?: Json
          user_id?: string
          group_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          key: string
          label: string
          icon: string
          color: string
          group_id: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          key: string
          label: string
          icon: string
          color: string
          group_id: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          key?: string
          label?: string
          icon?: string
          color?: string
          group_id?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      group_invitations: {
        Row: {
          id: string
          group_id: string
          invited_by_user_id: string
          email: string
          status: string
          invitation_token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          invited_by_user_id: string
          email: string
          status?: string
          invitation_token: string
          expires_at: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          invited_by_user_id?: string
          email?: string
          status?: string
          invitation_token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          user_ids: string[]
          plan: Json
          is_active: boolean
          subscription_status: string | null
          subscription_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          user_ids?: string[]
          plan?: Json
          is_active?: boolean
          subscription_status?: string | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          user_ids?: string[]
          plan?: Json
          is_active?: boolean
          subscription_status?: string | null
          subscription_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      recurring_transactions: {
        Row: {
          id: string
          description: string
          amount: number
          type: string
          account_id: string
          start_date: string
          end_date: string | null
          frequency: string
          is_active: boolean
          total_executions: number
          category: string
          transaction_ids: string[]
          due_day: number
          user_ids: string[]
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type: string
          account_id: string
          start_date: string
          end_date?: string | null
          frequency: string
          is_active?: boolean
          total_executions?: number
          category: string
          transaction_ids?: string[]
          due_day?: number
          user_ids: string[]
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: string
          account_id?: string
          start_date?: string
          end_date?: string | null
          frequency?: string
          is_active?: boolean
          total_executions?: number
          category?: string
          transaction_ids?: string[]
          due_day?: number
          user_ids?: string[]
          created_at?: string | null
          updated_at?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          description: string
          amount: number
          type: string
          category: string
          date: string
          account_id: string
          to_account_id: string | null
          user_id: string | null
          group_id: string | null
          recurring_series_id: string | null
          frequency: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          description: string
          amount: number
          type: string
          category: string
          date: string
          account_id: string
          to_account_id?: string | null
          user_id?: string | null
          group_id?: string | null
          recurring_series_id?: string | null
          frequency?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          type?: string
          category?: string
          date?: string
          account_id?: string
          to_account_id?: string | null
          user_id?: string | null
          group_id?: string | null
          recurring_series_id?: string | null
          frequency?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          currency: string
          language: string
          timezone: string
          notifications_push: boolean
          notifications_email: boolean
          notifications_budget_alerts: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          currency?: string
          language?: string
          timezone?: string
          notifications_push?: boolean
          notifications_email?: boolean
          notifications_budget_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          currency?: string
          language?: string
          timezone?: string
          notifications_push?: boolean
          notifications_email?: boolean
          notifications_budget_alerts?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          clerk_id: string | null
          name: string
          email: string
          avatar: string | null
          theme_color: string | null
          budget_start_date: number | null
          group_id: string | null
          role: string | null
          budget_periods: Json | null
          default_account_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          clerk_id?: string | null
          name: string
          email: string
          avatar?: string | null
          theme_color?: string | null
          budget_start_date?: number | null
          group_id?: string | null
          role?: string | null
          budget_periods?: Json | null
          default_account_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          clerk_id?: string | null
          name?: string
          email?: string
          avatar?: string | null
          theme_color?: string | null
          budget_start_date?: number | null
          group_id?: string | null
          role?: string | null
          budget_periods?: Json | null
          default_account_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          name: string
          symbol: string
          amount: number
          shares_acquired: number
          currency: string
          currency_rate: number
          tax_paid: number
          net_earn: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          symbol: string
          amount: number
          shares_acquired: number
          currency: string
          currency_rate?: number
          tax_paid?: number
          net_earn?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          symbol?: string
          amount?: number
          shares_acquired?: number
          currency?: string
          currency_rate?: number
          tax_paid?: number
          net_earn?: number
          created_at?: string | null
          updated_at?: string | null
        }
      }
      market_data_cache: {
        Row: {
          symbol: string
          data: Json
          last_updated: string
        }
        Insert: {
          symbol: string
          data?: Json
          last_updated?: string
        }
        Update: {
          symbol?: string
          data?: Json
          last_updated?: string
        }
      }
      available_shares: {
        Row: {
          id: string
          symbol: string
          name: string
          region: string
          asset_type: string
          exchange: string | null
          currency: string | null
          is_popular: boolean
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          symbol: string
          name: string
          region: string
          asset_type: string
          exchange?: string | null
          currency?: string | null
          is_popular?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          symbol?: string
          name?: string
          region?: string
          asset_type?: string
          exchange?: string | null
          currency?: string | null
          is_popular?: boolean
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      get_group_category_spending: {
        Args: {
          p_group_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{ category: string; spent: number; transaction_count: number }>
      }
      get_group_monthly_spending: {
        Args: {
          p_group_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{ month: string; income: number; expense: number }>
      }
      get_group_user_category_spending: {
        Args: {
          p_group_id: string
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{ user_id: string; category: string; spent: number; income: number; transaction_count: number }>
      }
    }
    Enums: {
      [_: string]: never
    }
  }
}
