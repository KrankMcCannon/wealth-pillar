'use client';

import { User } from '@/lib/types';
import { useCallback, useEffect, useState } from 'react';
import { useUsers } from './use-query-hooks';

const USER_SELECTION_KEY = 'selectedUserId';
const GROUP_FILTER_KEY = 'selectedGroupFilter';

/**
 * Centralized user selection hook with localStorage persistence
 *
 * Features:
 * - Automatic persistence in localStorage
 * - Fallback to first user if saved selection not found
 * - Group filter management for admin users
 * - Synchronization across all pages
 */
export const useUserSelection = () => {
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user selection from localStorage
  useEffect(() => {
    if (users.length > 0 && !isInitialized) {
      const savedUserId = localStorage.getItem(USER_SELECTION_KEY);
      const savedGroupFilter = localStorage.getItem(GROUP_FILTER_KEY) || 'all';

      if (savedUserId) {
        const savedUser = users.find(user => user.id === savedUserId);
        if (savedUser) {
          setCurrentUser(savedUser);
        } else {
          // Fallback to first user if saved user not found
          setCurrentUser(users[0]);
          localStorage.setItem(USER_SELECTION_KEY, users[0].id);
        }
      } else {
        // No saved selection, use first user
        setCurrentUser(users[0]);
        localStorage.setItem(USER_SELECTION_KEY, users[0].id);
      }

      setSelectedGroupFilter(savedGroupFilter);
      setIsInitialized(true);
    }
  }, [users, isInitialized]);

  // Update current user and persist to localStorage
  const updateCurrentUser = useCallback((user: User) => {
    setCurrentUser(user);
    localStorage.setItem(USER_SELECTION_KEY, user.id);
  }, []);

  // Update group filter and persist to localStorage
  const updateGroupFilter = useCallback((filter: string) => {
    setSelectedGroupFilter(filter);
    localStorage.setItem(GROUP_FILTER_KEY, filter);
  }, []);

  // Clear selection (useful for logout)
  const clearSelection = useCallback(() => {
    setCurrentUser(null);
    setSelectedGroupFilter('all');
    localStorage.removeItem(USER_SELECTION_KEY);
    localStorage.removeItem(GROUP_FILTER_KEY);
    setIsInitialized(false);
  }, []);

  // Check if current user has admin privileges
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Get effective user ID for filtering (respects group filter)
  const getEffectiveUserId = useCallback(() => {
    if (selectedGroupFilter === 'all') {
      return currentUser?.id || '';
    }
    return selectedGroupFilter;
  }, [selectedGroupFilter, currentUser]);

  // Get all user IDs that should be included in current filter
  const getFilteredUserIds = useCallback(() => {
    if (selectedGroupFilter === 'all') {
      return users.map(user => user.id);
    }
    return [selectedGroupFilter];
  }, [selectedGroupFilter, users]);

  return {
    // Current state
    currentUser,
    selectedGroupFilter,
    users,
    isLoading: usersLoading || !isInitialized,
    isInitialized,
    isAdmin,

    // Actions
    updateCurrentUser,
    updateGroupFilter,
    clearSelection,

    // Utilities
    getEffectiveUserId,
    getFilteredUserIds,
  };
};

export default useUserSelection;
