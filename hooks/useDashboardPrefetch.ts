'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { queryKeys } from '@/lib/query-keys';
import { User } from '@/lib/types';

/**
 * Dashboard prefetching strategies for optimal performance
 * Implements intelligent prefetching based on user behavior patterns
 */
export const useDashboardPrefetch = (currentUser: User | null, allUsers: User[] = []) => {
  const queryClient = useQueryClient();

  // Prefetch next likely user data
  const prefetchUserData = useCallback(async (userId: string) => {
    if (!userId || userId === 'all') return;

    try {
      // Import services dynamically to avoid bundle bloat
      const [{ accountService }, { budgetService }, { recurringTransactionService }] = await Promise.all([
        import('@/lib/api-client'),
        import('@/lib/api-client'),
        import('@/lib/api-client'),
      ]);

      // Prefetch user-specific data in parallel
      const prefetchPromises = [
        queryClient.prefetchQuery({
          queryKey: queryKeys.accountsByUser(userId),
          queryFn: () => accountService.getByUserId(userId),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.budgetsByUser(userId),
          queryFn: () => budgetService.getByUserId(userId),
          staleTime: 2 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.upcomingRecurringSeries(7, userId),
          queryFn: () => recurringTransactionService.getDueWithinDays(7, userId),
          staleTime: 30 * 1000,
        }),
      ];

      await Promise.allSettled(prefetchPromises);
    } catch (error) {
      console.warn('Prefetch failed:', error);
    }
  }, [queryClient]);

  // Prefetch common dashboard data
  const prefetchCommonData = useCallback(async () => {
    if (!currentUser) return;

    try {
      const [{ categoryService }, { recurringTransactionService }] = await Promise.all([
        import('@/lib/api-client'),
        import('@/lib/api-client'),
      ]);

      // Prefetch data that's commonly needed across user switches
      const commonPrefetchPromises = [
        queryClient.prefetchQuery({
          queryKey: queryKeys.categories(),
          queryFn: categoryService.getAll,
          staleTime: 10 * 60 * 1000,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.activeRecurringSeries(),
          queryFn: () => recurringTransactionService.getActive(),
          staleTime: 30 * 1000,
        }),
      ];

      await Promise.allSettled(commonPrefetchPromises);
    } catch (_error) {
      console.warn('Common data prefetch failed:', _error);
    }
  }, [queryClient, currentUser]);

  // Smart prefetch strategy based on user role and context
  const smartPrefetch = useCallback(async (_currentUserId?: string) => {
    // mark param as used (lint)
    void _currentUserId;
    if (!currentUser) return;

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';

    if (isAdmin && allUsers.length > 1) {
      // For admins, prefetch the most commonly accessed users
      const otherUsers = allUsers.filter(u => u.id !== currentUser.id);

      // Prefetch first 2 other users (most likely to be accessed)
      const prefetchUsers = otherUsers.slice(0, 2);

      for (const user of prefetchUsers) {
        // Stagger prefetch requests to avoid overwhelming the server
        setTimeout(() => prefetchUserData(user.id), Math.random() * 2000);
      }
    }

    // Always prefetch common data
    await prefetchCommonData();
  }, [currentUser, allUsers, prefetchUserData, prefetchCommonData]);

  // Prefetch on idle (when user is not actively interacting)
  const prefetchOnIdle = useCallback(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => smartPrefetch(), { timeout: 5000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => smartPrefetch(), 2000);
    }
  }, [smartPrefetch]);

  // Background prefetch for likely next selections
  const prefetchNextSelection = useCallback((selectedUserId: string) => {
    if (!currentUser || !allUsers.length) return;

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
    if (!isAdmin) return;

    // Find current index and prefetch next user
    const currentIndex = selectedUserId === 'all'
      ? -1
      : allUsers.findIndex(u => u.id === selectedUserId);

    const nextIndex = (currentIndex + 1) % (allUsers.length + 1); // +1 for 'all' option
    const nextUserId = nextIndex === 0 ? 'all' : allUsers[nextIndex - 1]?.id;

    if (nextUserId && nextUserId !== 'all') {
      // Prefetch next user with a slight delay
      setTimeout(() => prefetchUserData(nextUserId), 1000);
    }
  }, [currentUser, allUsers, prefetchUserData]);

  // Warmup cache for critical data
  const warmupCache = useCallback(async () => {
    if (!currentUser) return;

    try {
      const { transactionService } = await import('@/lib/api-client');

      // Warmup transactions (needed for balance calculations)
      queryClient.prefetchQuery({
        queryKey: queryKeys.transactions(),
        queryFn: transactionService.getAll,
        staleTime: 30 * 1000,
      });
    } catch (_error) {
      console.warn('Cache warmup failed:', _error);
    }
  }, [queryClient, currentUser]);

  // Auto-prefetch on component mount
  useEffect(() => {
    if (currentUser) {
      // Initial warmup
      warmupCache();

      // Prefetch on idle
      prefetchOnIdle();
    }
  }, [currentUser, warmupCache, prefetchOnIdle]);

  // Cleanup stale cache entries
  const cleanupStaleCache = useCallback(() => {
    const cacheKeys = queryKeys;

    // Remove stale user-specific queries (older than 5 minutes)
    Object.values(cacheKeys).forEach(keyFactory => {
      if (typeof keyFactory === 'function') {
        try {
          // This is a simplified cleanup - in a real app you'd want more sophisticated logic
          queryClient.removeQueries({
            predicate: query => {
              const queryAge = Date.now() - (query.state.dataUpdatedAt || 0);
              return queryAge > 5 * 60 * 1000; // 5 minutes
            },
          });
        } catch {
          // Ignore cleanup errors
        }
      }
    });
  }, [queryClient]);

  // Periodic cleanup
  useEffect(() => {
    const cleanupInterval = setInterval(cleanupStaleCache, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(cleanupInterval);
  }, [cleanupStaleCache]);

  return {
    prefetchUserData,
    prefetchCommonData,
    smartPrefetch,
    prefetchOnIdle,
    prefetchNextSelection,
    warmupCache,
    cleanupStaleCache,
  };
};

export default useDashboardPrefetch;
