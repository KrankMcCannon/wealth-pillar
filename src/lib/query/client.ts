'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient configuration for financial management application
 *
 * Performance optimizations:
 * - Reduced aggressive refetching to minimize unnecessary API calls
 * - Smart cache invalidation strategy using optimistic updates
 * - Longer cache times for reference data (users, categories)
 * - Strategic refetching only when data is truly stale
 *
 * Key considerations for financial data:
 * - Real-time accuracy is critical for financial information
 * - Optimistic updates provide instant UI feedback
 * - Reference data cached aggressively (rarely changes)
 * - Transaction data uses smart cache updates instead of broad invalidations
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Optimized stale time - data stays fresh longer to reduce refetches
      staleTime: 2 * 60 * 1000, // 2 minutes - balanced for financial data

      // Extended cache time to avoid redundant network requests
      gcTime: 10 * 60 * 1000, // 10 minutes - keep data available

      // Retry configuration for financial data reliability
      retry: (failureCount, error) => {
        // Don't retry on client errors (4xx)
        if (error && 'status' in error && typeof error.status === 'number') {
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // OPTIMIZATION: Disable automatic refetch on window focus
      // Use manual refetch or optimistic updates for data freshness
      refetchOnWindowFocus: false,

      // Don't refetch on reconnect - rely on cache and manual refresh
      refetchOnReconnect: false,

      // OPTIMIZATION: Don't refetch on mount by default
      // Specific data types can override via setQueryDefaults if needed
      // This reduces unnecessary API calls when returning to cached pages
      refetchOnMount: false,

      // Structure errors in a consistent format
      throwOnError: false,

      // Network mode configuration
      networkMode: 'online',
    },
    mutations: {
      // Financial mutations should be retried carefully
      retry: (failureCount, error) => {
        // Never retry mutations that might have succeeded
        // to avoid duplicate financial transactions
        if (error && 'status' in error && typeof error.status === 'number') {
          // Don't retry client errors or conflicts
          if (error.status >= 400 && error.status < 500) {
            return false;
          }
        }
        // Only retry once for server errors
        return failureCount < 1;
      },

      // Longer timeout for financial operations
      networkMode: 'online',
    },
  },
});

/**
 * OPTIMIZED: Query defaults for different data types
 * Uses hierarchical caching strategy based on data volatility
 */

// Reference data (users, categories) - rarely changes
queryClient.setQueryDefaults(['wealth-pillar', 'reference'], {
  staleTime: 15 * 60 * 1000, // 15 minutes - reference data is stable
  gcTime: 60 * 60 * 1000, // 1 hour - keep in cache longer
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// User data - changes infrequently
queryClient.setQueryDefaults(['wealth-pillar', 'users'], {
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Category data - rarely changes
queryClient.setQueryDefaults(['wealth-pillar', 'reference', 'categories'], {
  staleTime: 30 * 60 * 1000, // 30 minutes
  gcTime: 60 * 60 * 1000, // 1 hour
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Account data - moderate volatility
queryClient.setQueryDefaults(['wealth-pillar', 'accounts'], {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000, // 15 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Transaction data - higher volatility, but use optimistic updates
queryClient.setQueryDefaults(['wealth-pillar', 'transactions'], {
  staleTime: 3 * 60 * 1000, // 3 minutes - optimistic updates keep it fresh
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Budget data - moderate volatility
queryClient.setQueryDefaults(['wealth-pillar', 'budgets'], {
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 15 * 60 * 1000, // 15 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Financial aggregations - computed data, moderate staleness acceptable
queryClient.setQueryDefaults(['wealth-pillar', 'financial'], {
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Dashboard data - composite queries
queryClient.setQueryDefaults(['wealth-pillar', 'dashboard'], {
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

// Investment data - less frequent updates
queryClient.setQueryDefaults(['wealth-pillar', 'investments'], {
  staleTime: 10 * 60 * 1000, // 10 minutes
  gcTime: 30 * 60 * 1000, // 30 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: false,
});

export default queryClient;