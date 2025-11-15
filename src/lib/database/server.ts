import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Creates a Supabase client for server-side operations
 * Uses service role key for elevated permissions
 *
 * @returns Supabase client instance with full database access
 * @throws Error if environment variables are not configured
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Singleton instance of the server Supabase client
 * Reused across server components and actions for better performance
 */
export const supabaseServer = createServerClient();
