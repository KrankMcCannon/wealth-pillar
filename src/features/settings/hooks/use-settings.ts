'use client';

import { useState, useOptimistic, startTransition, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import type { User, UserPreferences, UserPreferencesUpdate } from '@/lib/types';
import { useRouter } from '@/i18n/routing';
import { useModalState, type SettingsModalKind } from '@/lib/navigation/url-state';

export function useSettings(
  currentUser: User,
  initialPreferences: UserPreferences,
  initialGroupName = ''
) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { openModal } = useModalState();

  const [displayUser, setOptimisticUser] = useOptimistic(
    currentUser,
    (state: User, updates: Partial<Pick<User, 'name' | 'email'>>) => ({
      ...state,
      ...updates,
    })
  );

  const [displayGroupName, setOptimisticGroupName] = useOptimistic(
    initialGroupName,
    (_state, name: string) => name
  );

  const [preferences, setOptimisticPreferences] = useOptimistic(
    initialPreferences,
    (state: UserPreferences, newPreferences: Partial<UserPreferences>) => ({
      ...state,
      ...newPreferences,
    })
  );

  const [isSigningOut, setIsSigningOut] = useState(false);

  const userInitials = displayUser?.name
    ? displayUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : clerkUser?.firstName?.charAt(0) || 'U';

  const isAdmin = displayUser?.role === 'admin' || displayUser?.role === 'superadmin';

  const openSettingsModal = useCallback(
    (kind: SettingsModalKind) => {
      openModal(`settings:${kind}`);
    },
    [openModal]
  );

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const handlePreferenceUpdate = <K extends keyof UserPreferencesUpdate>(
    key: K,
    value: UserPreferencesUpdate[K]
  ) => {
    if (!preferences) return;

    startTransition(() => {
      setOptimisticPreferences({ [key]: value } as Partial<UserPreferences>);
    });
  };

  const handleProfileUpdate = useCallback(
    (updates: Partial<Pick<User, 'name' | 'email'>>) => {
      startTransition(() => {
        setOptimisticUser(updates);
      });
    },
    [setOptimisticUser]
  );

  const handleGroupUpdate = useCallback(
    (name: string) => {
      startTransition(() => {
        setOptimisticGroupName(name);
      });
    },
    [setOptimisticGroupName]
  );

  return {
    displayUser,
    displayGroupName,
    isAdmin,
    preferences,
    isSigningOut,
    userInitials,
    openSettingsModal,
    handleSignOut,
    handlePreferenceUpdate,
    handleProfileUpdate,
    handleGroupUpdate,
  };
}
