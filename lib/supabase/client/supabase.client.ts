/**
 * Supabase Client
 * Implements Singleton pattern and Dependency Injection principles
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../../config';
import type { Database } from '../types/database.types';

// Singleton instance
let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Get Supabase client instance (Singleton pattern)
 * @returns SupabaseClient instance
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (!supabaseInstance) {
    const config = getSupabaseConfig();
    
    supabaseInstance = createClient<Database>(
      config.url,
      config.anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        global: {
          headers: {
            'X-Client-Info': 'wealth-pillar-v1.0.0'
          }
        }
      }
    );
  }

  return supabaseInstance;
};

/**
 * Create a new Supabase client instance (for testing or specific use cases)
 * @returns New SupabaseClient instance
 */
export const createSupabaseClient = (): SupabaseClient<Database> => {
  const config = getSupabaseConfig();
  
  return createClient<Database>(
    config.url,
    config.anonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );
};

// Default export for convenience
export default getSupabaseClient;

// Utility functions
export const resetSupabaseClient = (): void => {
  supabaseInstance = null;
};

export const getSupabaseUrl = (): string => {
  const config = getSupabaseConfig();
  return config.url;
};

export const isSupabaseConfigured = (): boolean => {
  try {
    getSupabaseConfig();
    return true;
  } catch {
    return false;
  }
};
