"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';

interface UserFilterContextValue {
  selectedGroupFilter: string;
  setSelectedGroupFilter: (filter: string) => void;
  selectedUserId: string | undefined;
}

const UserFilterContext = createContext<UserFilterContextValue | null>(null);

const STORAGE_KEY = 'wealth-pillar-user-filter';

export function UserFilterProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default to "all"
  const [selectedGroupFilter, setSelectedGroupFilterState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY) || 'all';
    }
    return 'all';
  });

  // Persist to localStorage on change
  const setSelectedGroupFilter = (filter: string) => {
    setSelectedGroupFilterState(filter);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, filter);
    }
  };

  // Compute selectedUserId (undefined for "all", user_id otherwise)
  const selectedUserId = useMemo(
    () => (selectedGroupFilter === 'all' ? undefined : selectedGroupFilter),
    [selectedGroupFilter]
  );

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ selectedGroupFilter, setSelectedGroupFilter, selectedUserId }),
    [selectedGroupFilter, selectedUserId]
  );

  return (
    <UserFilterContext.Provider value={contextValue}>
      {children}
    </UserFilterContext.Provider>
  );
}

export function useUserFilterContext() {
  const context = useContext(UserFilterContext);
  if (!context) {
    throw new Error('useUserFilterContext must be used within UserFilterProvider');
  }
  return context;
}
