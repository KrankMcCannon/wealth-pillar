import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a single supabase client for all operations
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Export the client for external use
export default supabase;