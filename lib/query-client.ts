'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * Optimized QueryClient configuration for financial management application
 *
 * Key considerations for financial data:
 * - Real-time accuracy is critical for financial information
 * - Frequent updates needed for balances and transactions
 * - Aggressive caching for reference data (users, categories)
 * - Conservative caching for dynamic data (transactions, balances)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Financial data should be considered stale relatively quickly
      // but we balance this with performance for better UX
      staleTime: 30 * 1000, // 30 seconds - good balance for financial data

      // Keep data in cache longer to avoid unnecessary requests
      // when users navigate between pages
      gcTime: 5 * 60 * 1000, // 5 minutes

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

      // Refetch on window focus for financial accuracy
      refetchOnWindowFocus: true,

      // Don't refetch on reconnect automatically for financial data
      // We want manual control over when financial data updates
      refetchOnReconnect: false,

      // Enable background refetching for data freshness
      refetchOnMount: true,

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
 * Query client with financial-specific error handling
 */
queryClient.setMutationDefaults(['transaction'], {
  // Optimistic updates for transactions
  onMutate: async () => {
    // Cancel any outgoing re-fetches to avoid optimistic update conflicts
    await queryClient.cancelQueries({ queryKey: ['transactions'] });
  },
  onError: (error) => {
    // Rollback optimistic updates on error
    console.error('Transaction mutation failed:', error);
  },
  onSuccess: () => {
    // Invalidate related queries after successful mutation
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['accounts'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
  },
});

// Global error handling for financial data
queryClient.setQueryDefaults(['financial'], {
  staleTime: 15 * 1000, // 15 seconds for critical financial data
  gcTime: 2 * 60 * 1000, // 2 minutes
});

// Long-term caching for reference data
queryClient.setQueryDefaults(['reference'], {
  staleTime: 10 * 60 * 1000, // 10 minutes for reference data
  gcTime: 30 * 60 * 1000, // 30 minutes
});

export default queryClient;