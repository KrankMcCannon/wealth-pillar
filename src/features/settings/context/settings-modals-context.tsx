'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { User, UserPreferences, UserPreferencesUpdate } from '@/lib/types';

export interface SettingsModalsContextValue {
  currentUser: User;
  preferences: UserPreferences | null;
  isAdmin: boolean;
  groupName: string;
  onPreferenceUpdate: <K extends keyof UserPreferencesUpdate>(
    key: K,
    value: UserPreferencesUpdate[K]
  ) => void;
  onProfileUpdate: (updates: Partial<Pick<User, 'name' | 'email'>>) => void;
  onGroupUpdate: (name: string) => void;
}

const SettingsModalsContext = createContext<SettingsModalsContextValue | null>(null);

export function SettingsModalsProvider({
  value,
  children,
}: Readonly<{
  value: SettingsModalsContextValue;
  children: ReactNode;
}>) {
  return <SettingsModalsContext.Provider value={value}>{children}</SettingsModalsContext.Provider>;
}

export function useSettingsModalsContext(): SettingsModalsContextValue {
  const ctx = useContext(SettingsModalsContext);
  if (!ctx) {
    throw new Error('useSettingsModalsContext must be used within SettingsModalsProvider');
  }
  return ctx;
}

export function useSettingsModalsContextOptional(): SettingsModalsContextValue | null {
  return useContext(SettingsModalsContext);
}
