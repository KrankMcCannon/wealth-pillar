"use client";

import React, { createContext, useContext } from "react";
import type { User } from "@/lib/types";

// ============================================================================
// Types
// ============================================================================

interface UserContextValue {
  currentUser: User;
  groupUsers: User[];
}

interface UserProviderProps {
  children: React.ReactNode;
  currentUser: User;
  groupUsers: User[];
}

// ============================================================================
// Context
// ============================================================================

const UserContext = createContext<UserContextValue | null>(null);

// ============================================================================
// Component
// ============================================================================

/**
 * User Provider
 *
 * Provides immutable user and group data to the widget tree using React Context.
 * Using Context instead of Zustand for this data ensures it is available
 * immediately during the first render pass, preventing race conditions.
 */
export function UserProvider({
  children,
  currentUser,
  groupUsers,
}: Readonly<UserProviderProps>) {
  const value = React.useMemo(
    () => ({ currentUser, groupUsers }),
    [currentUser, groupUsers]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// ============================================================================
// Hook / Accessor
// ============================================================================

/**
 * Internal hook to access the context.
 * Use valid hooks from @/hooks/use-required-user.ts instead of this directly.
 */
export function useUserContext(): UserContextValue {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}
