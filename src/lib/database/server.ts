import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cached Supabase client instance
 * Lazy-loaded to ensure environment variables are available
 */
let cachedClient: SupabaseClient<Database> | null = null;

/**
 * Creates a Supabase client for server-side operations
 * Uses service role key for elevated permissions
 *
 * @returns Supabase client instance with full database access
 * @throws Error if environment variables are not configured
 */
function createServerClient() {
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
 * Lazy-loaded singleton instance of the server Supabase client
 * Creates the client on first access to ensure environment variables are loaded
 * Reused across server components and actions for better performance
 */
export const supabaseServer = new Proxy({} as SupabaseClient<Database>, {
  get: (target, prop) => {
    if (!cachedClient) {
      cachedClient = createServerClient();
    }
    return cachedClient[prop as keyof SupabaseClient<Database>];
  },
});
