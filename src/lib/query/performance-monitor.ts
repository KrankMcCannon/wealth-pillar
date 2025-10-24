/**
 * Performance Monitoring Utility for TanStack Query
 *
 * Provides insights into query performance and cache efficiency
 * Helps identify unnecessary refetches and cache misses
 */

import type { QueryClient } from '@tanstack/react-query';

/**
 * Query performance metrics
 */
export interface QueryPerformanceMetrics {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  cacheHits: number;
  cacheMisses: number;
  invalidations: number;
}

/**
 * Get current performance metrics from QueryClient
 */
export const getQueryPerformanceMetrics = (queryClient: QueryClient): QueryPerformanceMetrics => {
  const queryCache = queryClient.getQueryCache();
  const queries = queryCache.getAll();

  const activeQueries = queries.filter(q => q.state.fetchStatus === 'fetching').length;
  const staleQueries = queries.filter(q => q.isStale()).length;

  return {
    totalQueries: queries.length,
    activeQueries,
    staleQueries,
    cacheHits: 0, // Tracked via observers
    cacheMisses: 0, // Tracked via observers
    invalidations: 0, // Tracked via observers
  };
};

/**
 * Log query performance summary (development only)
 */
export const logQueryPerformance = (queryClient: QueryClient) => {
  if (process.env.NODE_ENV !== 'development') return;

  const metrics = getQueryPerformanceMetrics(queryClient);

  console.group('TanStack Query Performance');
  console.log('Total Queries in Cache:', metrics.totalQueries);
  console.log('Active Queries (Fetching):', metrics.activeQueries);
  console.log('Stale Queries:', metrics.staleQueries);
  console.log('Fresh Queries:', metrics.totalQueries - metrics.staleQueries);
  console.groupEnd();
};

/**
 * Performance observer for tracking cache efficiency
 * Use in development to identify optimization opportunities
 */
export class QueryPerformanceObserver {
  private metrics: QueryPerformanceMetrics = {
    totalQueries: 0,
    activeQueries: 0,
    staleQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    invalidations: 0,
  };

  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;

    if (process.env.NODE_ENV === 'development') {
      this.setupObservers();
    }
  }

  private setupObservers() {
    // Observer for query cache events
    const unsubscribe = this.queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'added') {
        this.metrics.cacheMisses++;
      }

      if (event?.type === 'updated' && event.query.state.fetchStatus === 'fetching') {
        // Query is being refetched
        if (event.query.state.data) {
          this.metrics.cacheHits++;
        }
      }

      if (event?.type === 'observerResultsUpdated') {
        const query = event.query;
        if (query.isStale()) {
          this.metrics.invalidations++;
        }
      }
    });

    // Log metrics periodically in development
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.logMetrics();
      }, 30000); // Every 30 seconds
    }

    return unsubscribe;
  }

  private logMetrics() {
    const currentMetrics = getQueryPerformanceMetrics(this.queryClient);

    console.group('Query Performance Stats (Last 30s)');
    console.log('Cache Hits:', this.metrics.cacheHits);
    console.log('Cache Misses:', this.metrics.cacheMisses);
    console.log('Invalidations:', this.metrics.invalidations);
    console.log('Current Active Queries:', currentMetrics.activeQueries);
    console.log('Current Stale Queries:', currentMetrics.staleQueries);

    // Calculate efficiency
    const totalAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalAccess > 0) {
      const efficiency = ((this.metrics.cacheHits / totalAccess) * 100).toFixed(2);
      console.log(`Cache Efficiency: ${efficiency}%`);
    }

    console.groupEnd();

    // Reset counters
    this.metrics.cacheHits = 0;
    this.metrics.cacheMisses = 0;
    this.metrics.invalidations = 0;
  }

  public getMetrics() {
    return { ...this.metrics };
  }
}

/**
 * Hook to monitor query performance (development only)
 */
export const useQueryPerformanceMonitor = (queryClient: QueryClient) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return new QueryPerformanceObserver(queryClient);
};

/**
 * Get all queries grouped by state
 */
export const getQueriesByState = (queryClient: QueryClient) => {
  const queries = queryClient.getQueryCache().getAll();

  return {
    fetching: queries.filter(q => q.state.fetchStatus === 'fetching'),
    stale: queries.filter(q => q.isStale()),
    fresh: queries.filter(q => !q.isStale()),
    inactive: queries.filter(q => q.getObserversCount() === 0),
  };
};

/**
 * Find queries that are refetching frequently
 * Useful for identifying optimization opportunities
 */
export const findFrequentRefetchers = (queryClient: QueryClient) => {
  const queries = queryClient.getQueryCache().getAll();

  return queries
    .map(q => ({
      queryKey: q.queryKey,
      fetchCount: q.state.dataUpdateCount,
      errorCount: q.state.errorUpdateCount,
      lastFetch: q.state.dataUpdatedAt,
    }))
    .filter(q => q.fetchCount > 5) // Fetched more than 5 times
    .sort((a, b) => b.fetchCount - a.fetchCount);
};
