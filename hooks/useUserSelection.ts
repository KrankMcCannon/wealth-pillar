'use client';

import { userService } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { User } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

// UI Preferences with intelligent caching
const UI_PREFERENCES_KEY = 'ui_preferences';
const USER_CACHE_KEY = 'user_cache';

interface UIPreferences {
  selectedViewUserId: string;
  lastViewedUserId?: string;
  cacheTimestamp?: number;
}

interface UserCacheEntry {
  userId: string;
  timestamp: number;
  hasData: boolean;
}

/**
 * User selection hook with intelligent caching
 * Implements cache-first strategy to eliminate redundant loads
 */
export const useUserSelection = () => {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  // Local state with cache awareness
  const [selectedViewUserId, setSelectedViewUserId] = useState<string>('all');
  const [userCache, setUserCache] = useState<UserCacheEntry[]>([]);

  // Users query with intelligent prefetching
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.users(),
    queryFn: async () => {
      if (!isAuthenticated || !authUser) return [];

      // Check if data is already in React Query cache
      const cachedData = queryClient.getQueryData(queryKeys.users());
      if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
        return cachedData as User[];
      }

      // Fetch based on role with queries
      if (authUser.role === 'superadmin') {
        return await userService.getAll();
      }

      if (authUser.role === 'admin') {
        const allUsers = await userService.getAll();
        return allUsers.filter(user =>
          user.group_id === authUser.group_id || user.id === authUser.id
        );
      }

      // Member sees only themselves
      return [authUser].filter(Boolean) as User[];
    },
    enabled: isAuthenticated && !!authUser,
    staleTime: 10 * 60 * 1000, // Increased stale time for users
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Current user computation (memoized)
  const currentUser = useMemo(() => {
    if (!authUser || !allUsers.length) return null;
    return allUsers.find(user =>
      user.clerk_id === authUser.clerk_id || user.id === authUser.id
    ) || null;
  }, [authUser, allUsers]);

  // Viewable users (admin-only feature)
  const viewableUsers = useMemo((): User[] => {
    if (!allUsers.length || !currentUser) return [];
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
    return isAdmin ? allUsers : [];
  }, [allUsers, currentUser]);

  // Current viewing user
  const viewingUser = useMemo((): User | null => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    if (!isAdmin) return currentUser;
    if (selectedViewUserId === 'all') return null;

    return allUsers.find(user => user.id === selectedViewUserId) || null;
  }, [selectedViewUserId, allUsers, currentUser]);

  // Load preferences and cache data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Load UI preferences
      const savedPreferences = localStorage.getItem(UI_PREFERENCES_KEY);
      if (savedPreferences) {
        const prefs = JSON.parse(savedPreferences) as UIPreferences;
        // Only restore if not too old (24 hours)
        if (!prefs.cacheTimestamp || Date.now() - prefs.cacheTimestamp < 24 * 60 * 60 * 1000) {
          setSelectedViewUserId(prefs.selectedViewUserId || 'all');
        }
      }

      // Load user cache data
      const savedCache = localStorage.getItem(USER_CACHE_KEY);
      if (savedCache) {
        const cache = JSON.parse(savedCache) as UserCacheEntry[];
        // Filter out stale entries (older than 1 hour)
        const validCache = cache.filter(entry =>
          Date.now() - entry.timestamp < 60 * 60 * 1000
        );
        setUserCache(validCache);
      }
    } catch (error) {
      console.warn('Error loading user preferences:', error);
    }
  }, []);

  // Save preferences with timestamp
  const saveUIPreferences = useCallback((prefs: Partial<UIPreferences>) => {
    try {
      const savedPrefs = localStorage.getItem(UI_PREFERENCES_KEY);
      const currentPrefs = savedPrefs ? JSON.parse(savedPrefs) : {};

      const newPrefs = {
        ...currentPrefs,
        ...prefs,
        cacheTimestamp: Date.now()
      };

      localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(newPrefs));
    } catch (error) {
      console.warn('Error saving UI preferences:', error);
    }
  }, []);

  // Update user cache entry
  const updateUserCache = useCallback((userId: string, hasData: boolean) => {
    setUserCache(prev => {
      const filtered = prev.filter(entry => entry.userId !== userId);
      const newEntry: UserCacheEntry = {
        userId,
        timestamp: Date.now(),
        hasData,
      };

      const updated = [...filtered, newEntry];

      // Persist to localStorage
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.warn('Error saving user cache:', error);
      }

      return updated;
    });
  }, []);

  // User switch with intelligent cache management
  const updateViewUserId = useCallback((userId: string) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (!isAdmin) return;

    // Check if we have cached data for this user
    const cacheEntry = userCache.find(entry => entry.userId === userId);
    const hasCachedData = cacheEntry && cacheEntry.hasData &&
      (Date.now() - cacheEntry.timestamp < 30 * 60 * 1000); // 30 min cache

    // If switching from 'all' to specific user or vice versa, we might need to prefetch
    if (!hasCachedData && userId !== 'all') {
      // Prefetch data for this user
      queryClient.prefetchQuery({
        queryKey: queryKeys.accountsByUser(userId),
        queryFn: () => import('@/lib/api-client').then(({ accountService }) =>
          accountService.getByUserId(userId)
        ),
        staleTime: 2 * 60 * 1000,
      });

      queryClient.prefetchQuery({
        queryKey: queryKeys.budgetsByUser(userId),
        queryFn: () => import('@/lib/api-client').then(({ budgetService }) =>
          budgetService.getByUserId(userId)
        ),
        staleTime: 2 * 60 * 1000,
      });
    }

    setSelectedViewUserId(userId);
    saveUIPreferences({ selectedViewUserId: userId });

    // Update cache entry
    updateUserCache(userId, true);
  }, [currentUser, userCache, queryClient, saveUIPreferences, updateUserCache]);

  // Prefetch data for likely next selections
  const prefetchNextUser = useCallback(() => {
    if (!viewableUsers.length || viewableUsers.length <= 1) return;

    const currentIndex = selectedViewUserId === 'all'
      ? -1
      : viewableUsers.findIndex(u => u.id === selectedViewUserId);

    const nextUser = viewableUsers[currentIndex + 1] || viewableUsers[0];

    if (nextUser) {
      // Prefetch next user's data
      queryClient.prefetchQuery({
        queryKey: queryKeys.accountsByUser(nextUser.id),
        queryFn: () => import('@/lib/api-client').then(({ accountService }) =>
          accountService.getByUserId(nextUser.id)
        ),
        staleTime: 2 * 60 * 1000,
      });
    }
  }, [viewableUsers, selectedViewUserId, queryClient]);

  // Auto-prefetch on mount
  useEffect(() => {
    if (viewableUsers.length > 1) {
      const timeoutId = setTimeout(prefetchNextUser, 1000); // Prefetch after 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [prefetchNextUser, viewableUsers.length]);

  // Statistics and utility functions
  const userStats = useMemo(() => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    return {
      totalUsers: allUsers.length,
      viewableUsers: viewableUsers.length,
      hasMultipleUsers: viewableUsers.length > 1,
      canSwitchUsers: isAdmin && viewableUsers.length > 1,
      cachedUsers: userCache.filter(entry =>
        Date.now() - entry.timestamp < 30 * 60 * 1000
      ).length,
    };
  }, [allUsers.length, viewableUsers.length, currentUser, userCache]);

  // Permission checks
  const canViewUser = useCallback((userId: string) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (!isAdmin) return false;
    return viewableUsers.some(user => user.id === userId);
  }, [currentUser, viewableUsers]);

  // Cleanup function
  const clearSelection = useCallback(() => {
    setSelectedViewUserId('all');
    setUserCache([]);
    try {
      localStorage.removeItem(UI_PREFERENCES_KEY);
      localStorage.removeItem(USER_CACHE_KEY);
    } catch (error) {
      console.warn('Error clearing cache:', error);
    }
  }, []);

  // Combined loading state
  const isLoading = authLoading || usersLoading;

  // Role checks
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  return {
    // Core user data
    currentUser,
    viewingUser,
    users: allUsers,
    viewableUsers,

    // Selection state
    selectedViewUserId,

    // Loading and auth states
    isLoading,
    isAuthenticated,
    authUser,

    // Statistics
    userStats,

    // Role checks
    isAdmin,
    isSuperAdmin,
    canViewUser,

    // Actions
    updateViewUserId,
    clearSelection,
    prefetchNextUser,

    // Utility functions
    getEffectiveUserId: () => currentUser?.id || '',
    getViewingUserId: () => viewingUser?.id || null,

    // Cache management
    updateUserCache,
  };
};

export default useUserSelection;