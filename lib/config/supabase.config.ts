/**
 * Supabase Client Configuration
 * Following SOLID principles for clean architecture
 */

// Types for Supabase configuration
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Environment validation
export const validateSupabaseConfig = (): SupabaseConfig => {
  const url = (import.meta as any).env.VITE_SUPABASE_URL;
  const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      '🔥 Missing Supabase configuration! Please check your environment variables:\n' +
      '• VITE_SUPABASE_URL (your Supabase project URL)\n' +
      '• VITE_SUPABASE_ANON_KEY (your Supabase anon key)\n\n' +
      '💡 Create a .env.local file in your project root with these variables.\n' +
      '📚 See lib/supabase/README.md for setup instructions.'
    );
  }

  // Basic URL validation
  try {
    new URL(url);
  } catch {
    throw new Error(
      `❌ Invalid Supabase URL: "${url}"\n` +
      '✅ Expected format: https://your-project.supabase.co'
    );
  }

  // Basic anon key validation (should be a JWT-like string)
  if (anonKey.length < 100 || !anonKey.includes('.')) {
    throw new Error(
      `❌ Invalid Supabase anon key format.\n` +
      '✅ Expected a JWT token from your Supabase dashboard.'
    );
  }

  return { url, anonKey };
};

// Singleton pattern for configuration
let config: SupabaseConfig | null = null;

export const getSupabaseConfig = (): SupabaseConfig => {
  if (!config) {
    config = validateSupabaseConfig();
  }
  return config;
};

// Test connection function
export const testSupabaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    const { getSupabaseClient } = await import('../supabase/client');
    const supabase = getSupabaseClient();
    
    // Test basic connection with a simple query
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1);
    
    if (error) {
      return {
        success: false,
        message: `❌ Database connection failed: ${error.message}`,
        details: error
      };
    }
    
    return {
      success: true,
      message: '✅ Supabase connection successful!',
      details: { connected: true, tablesAccessible: true }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `❌ Connection test failed: ${error.message}`,
      details: error
    };
  }
};
