import { QueryClient } from '@tanstack/react-query';

/**
 * Stale time configurations - how long data is considered fresh before refetch
 * Exported for use in hooks and components
 */
export const QUERY_STALE_TIMES = {
  // Reference data - rarely changes
  reference: 15 * 60 * 1000,  // 15 minutes
  users: 10 * 60 * 1000,       // 10 minutes
  categories: 30 * 60 * 1000,   // 30 minutes

  // Financial core data - frequently changes
  transactions: 30 * 1000,       // 30 seconds
  accounts: 2 * 60 * 1000,       // 2 minutes
  budgets: 2 * 60 * 1000,        // 2 minutes

  // Computed/derived data
  financial: 2 * 60 * 1000,      // 2 minutes
  dashboard: 2 * 60 * 1000,      // 2 minutes
  budgetPeriods: 1 * 60 * 1000,  // 1 minute
  budgetAnalysis: 30 * 1000,      // 30 seconds
  financialSummary: 1 * 60 * 1000, // 1 minute
  accountBalances: 2 * 60 * 1000,  // 2 minutes
  spendingTrends: 1 * 60 * 1000,  // 1 minute

  // Recurring transactions
  recurringSeries: 2 * 60 * 1000,      // 2 minutes
  recurringStats: 1 * 60 * 1000,       // 1 minute
  recurringDashboard: 1 * 60 * 1000,   // 1 minute

  // Investment data
  investments: 5 * 60 * 1000,     // 5 minutes
  portfolioData: 5 * 60 * 1000,   // 5 minutes

  // Upcoming/aggregated views
  upcomingTransactions: 2 * 60 * 1000,       // 2 minutes
} as const;

/**
 * Garbage collection times - how long to keep unused data in cache
 */
export const QUERY_GC_TIMES = {
  reference: 60 * 60 * 1000,         // 1 hour
  users: 30 * 60 * 1000,             // 30 minutes
  categories: 60 * 60 * 1000,        // 1 hour
  transactions: 5 * 60 * 1000,       // 5 minutes
  accounts: 10 * 60 * 1000,          // 10 minutes
  budgets: 10 * 60 * 1000,           // 10 minutes
  financial: 5 * 60 * 1000,          // 5 minutes
  dashboard: 5 * 60 * 1000,          // 5 minutes
  budgetPeriods: 5 * 60 * 1000,      // 5 minutes
  budgetAnalysis: 3 * 60 * 1000,     // 3 minutes
  financialSummary: 5 * 60 * 1000,   // 5 minutes
  accountBalances: 10 * 60 * 1000,   // 10 minutes
  spendingTrends: 5 * 60 * 1000,     // 5 minutes
  recurringSeries: 10 * 60 * 1000,   // 10 minutes
  recurringStats: 5 * 60 * 1000,     // 5 minutes
  recurringDashboard: 5 * 60 * 1000, // 5 minutes
  investments: 10 * 60 * 1000,       // 10 minutes
  portfolioData: 5 * 60 * 1000,      // 5 minutes
  upcomingTransactions: 10 * 60 * 1000, // 10 minutes
} as const;

/**
 * Create optimized QueryClient configuration
 * Query configuration with data type awareness
 * Optimized for financial application with smart cache strategies
 */
function createQueryConfig() {
  return {
    defaultOptions: {
      queries: {
        // Global retry strategy for financial reliability
        retry: (failureCount: number, error: unknown) => {
          // Never retry client errors (4xx)
          const errorObj = error as Record<string, unknown>;
          if (errorObj && 'status' in errorObj && typeof errorObj.status === 'number') {
            if (errorObj.status >= 400 && errorObj.status < 500) {
              return false;
            }
          }
          // Retry up to 3 times for server errors
          return failureCount < 3;
        },

        // Exponential backoff with jitter
        retryDelay: (attemptIndex: number) => {
          const baseDelay = Math.min(1000 * Math.pow(2, attemptIndex), 30000);
          // Add jitter to prevent thundering herd
          return baseDelay + Math.random() * 1000;
        },

        // Disable aggressive refetching - use manual or invalidation instead
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        refetchOnMount: false,

        // Handle errors gracefully
        throwOnError: false,

        // Network mode for offline support
        networkMode: 'online' as const,

        // Stale while revalidate enabled by default
        staleTime: 30 * 1000,  // 30 seconds default
      },
      mutations: {
        // Conservative retry for mutations to prevent duplicate transactions
        retry: (failureCount: number, error: unknown) => {
          const errorObj = error as Record<string, unknown>;
          if (errorObj && 'status' in errorObj && typeof errorObj.status === 'number') {
            // Don't retry client errors or conflicts
            if (errorObj.status >= 400 && errorObj.status < 500) {
              return false;
            }
          }
          // Only retry once for server errors
          return failureCount < 1;
        },

        // Network mode for mutations
        networkMode: 'online' as const,
      },
    },
  };
}

/**
 * Factory function to create a new QueryClient instance
 * Each request gets its own isolated cache (important for SSR)
 * Call this in server components for per-request isolation
 */
export function createQueryClient() {
  return new QueryClient(createQueryConfig());
}

/**
 * Create a server-side QueryClient for initial data loading
 * Use in server components for prefetching before rendering
 */
export function createServerQueryClient() {
  const client = createQueryClient();

  // Set per-data-type defaults for optimal caching

  // Reference data - aggressive caching
  client.setQueryDefaults(['wealth-pillar', 'reference'], {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,     // 1 hour
  });

  // User data
  client.setQueryDefaults(['wealth-pillar', 'users'], {
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
  });

  // Category data
  client.setQueryDefaults(['wealth-pillar', 'reference', 'categories'], {
    staleTime: 30 * 60 * 1000,  // 30 minutes
    gcTime: 60 * 60 * 1000,     // 1 hour
  });

  // Account data - moderate volatility
  client.setQueryDefaults(['wealth-pillar', 'accounts'], {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 15 * 60 * 1000,     // 15 minutes
  });

  // Transaction data - use optimistic updates for freshness
  client.setQueryDefaults(['wealth-pillar', 'transactions'], {
    staleTime: 3 * 60 * 1000,   // 3 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes
  });

  // Budget data
  client.setQueryDefaults(['wealth-pillar', 'budgets'], {
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 15 * 60 * 1000,     // 15 minutes
  });

  // Financial aggregations
  client.setQueryDefaults(['wealth-pillar', 'financial'], {
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes
  });

  // Dashboard composite queries
  client.setQueryDefaults(['wealth-pillar', 'dashboard'], {
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 10 * 60 * 1000,     // 10 minutes
  });

  // Investment data
  client.setQueryDefaults(['wealth-pillar', 'investments'], {
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,     // 30 minutes
  });

  return client;
}

/**
 * Get cache time configuration for a data type
 * Use this for dynamic configuration based on data nature
 */
export function getCacheConfig(dataType: keyof typeof CACHE_PRESETS) {
  return CACHE_PRESETS[dataType];
}

/**
 * Preset cache configurations for different data types
 */
export const CACHE_PRESETS = {
  reference: { staleTime: 15 * 60 * 1000, gcTime: 60 * 60 * 1000 },
  users: { staleTime: 10 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  categories: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },
  transactions: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },
  accounts: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  budgets: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  budgetPeriods: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  financial: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  dashboard: { staleTime: 2 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  budgetAnalysis: { staleTime: 30 * 1000, gcTime: 3 * 60 * 1000 },
  financialSummary: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  accountBalances: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  spendingTrends: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  recurringSeries: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  recurringStats: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  recurringDashboard: { staleTime: 1 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  investments: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  portfolioData: { staleTime: 5 * 60 * 1000, gcTime: 5 * 60 * 1000 },
  upcomingTransactions: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
} as const;
