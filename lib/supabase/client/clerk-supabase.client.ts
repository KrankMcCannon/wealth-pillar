/**
 * Clerk + Supabase Integration
 * Following the official Clerk documentation pattern
 * https://clerk.com/docs/integrations/databases/supabase
 */

import { useSession, useUser } from '@clerk/clerk-react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useMemo } from 'react';
import { getSupabaseConfig } from '../../config';
import type { Database } from '../types/database.types';

/**
 * Create a Clerk-authenticated Supabase client
 * This function creates a Supabase client that injects the Clerk session token
 * into request headers for proper authentication with RLS policies
 */
export function createClerkSupabaseClient(getToken: () => Promise<string | null>): SupabaseClient<Database> {
  const config = getSupabaseConfig();
  
  return createClient<Database>(
    config.url,
    config.anonKey,
    {
      global: {
        headers: {
          'X-Client-Info': 'wealth-pillar-clerk-v1.0.0'
        }
      },
      auth: {
        persistSession: false
      },
      accessToken: getToken
    }
  );
}

/**
 * React hook to get a Clerk-authenticated Supabase client
 * This hook ensures that the Supabase client is properly authenticated
 * with the current Clerk session
 */
export function useClerkSupabaseClient(): SupabaseClient<Database> | null {
  const { session } = useSession();
  const { user } = useUser();

  const client = useMemo(() => {
    if (!session || !user) return null;

    return createClerkSupabaseClient(async () => {
      return await session.getToken();
    });
  }, [session, user]);

  return client;
}

/**
 * Create a server-side Clerk-authenticated Supabase client
 * For use in server-side rendering or API routes
 */
export function createClerkSupabaseClientSSR(token: string): SupabaseClient<Database> {
  const config = getSupabaseConfig();
  
  return createClient<Database>(
    config.url,
    config.anonKey,
    {
      global: {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Client-Info': 'wealth-pillar-clerk-ssr-v1.0.0'
        }
      },
      auth: {
        persistSession: false
      }
    }
  );
}
