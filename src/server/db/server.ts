'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

// Ensure this runs only on the server
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Check if we are in a build phase or misconfiguration
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'Missing env.SUPABASE_SERVICE_ROLE_KEY. Ensure this is not running on the client.'
    );
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseKey) {
  throw new Error('Supabase keys missing.');
}

/**
 * Database Server Client
 *
 */
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey);
