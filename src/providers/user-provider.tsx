'use client';

import React, { createContext, useContext } from 'react';
import type { User } from '@/lib/types';

// ============================================================================
// Types
// ============================================================================

export interface UserContextValue {
  currentUser: User;
  groupUsers: User[];
}

interface UserProviderProps {
  children: React.ReactNode;
  currentUser: User;
  groupUsers: User[];
}

// ============================================================================
// Contexts (split so consumers can subscribe only to what they need)
// ============================================================================

const CurrentUserContext = createContext<User | null>(null);
const GroupUsersContext = createContext<User[] | null>(null);

// ============================================================================
// Component
// ============================================================================

/**
 * User Provider
 *
 * Provides user and group data via separate contexts so components can
 * subscribe only to currentUser or only to groupUsers and avoid unnecessary
 * re-renders when the other slice changes.
 */
export function UserProvider({ children, currentUser, groupUsers }: Readonly<UserProviderProps>) {
  return (
    <CurrentUserContext.Provider value={currentUser}>
      <GroupUsersContext.Provider value={groupUsers}>{children}</GroupUsersContext.Provider>
    </CurrentUserContext.Provider>
  );
}

// ============================================================================
// Hooks / Accessors
// ============================================================================

/**
 * Subscribe only to currentUser. Use when the component does not need groupUsers
 * to avoid re-renders when groupUsers reference changes.
 */
export function useCurrentUser(): User | null {
  return useContext(CurrentUserContext);
}

/**
 * Subscribe only to groupUsers. Use when the component does not need currentUser
 * to avoid re-renders when currentUser reference changes.
 */
export function useGroupUsers(): User[] | null {
  return useContext(GroupUsersContext);
}

/**
 * Access both currentUser and groupUsers. Re-renders when either changes.
 * Prefer useCurrentUser() or useGroupUsers() when you only need one slice.
 */
export function useUserContext(): UserContextValue {
  const currentUser = useContext(CurrentUserContext);
  const groupUsers = useContext(GroupUsersContext);

  if (currentUser === null || groupUsers === null) {
    throw new Error('useUserContext must be used within a UserProvider');
  }

  return { currentUser, groupUsers };
}
