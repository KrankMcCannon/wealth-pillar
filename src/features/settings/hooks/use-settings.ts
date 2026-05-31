'use client';

import { useState, useOptimistic, startTransition, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import type { User, UserPreferences, UserPreferencesUpdate } from '@/lib/types';
import { useRouter } from '@/i18n/routing';
import { useModalState, type SettingsModalKind } from '@/lib/navigation/url-state';

export function useSettings(currentUser: User, initialPreferences: UserPreferences) {
  const router = useRouter();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { openModal } = useModalState();

  const [preferences, setOptimisticPreferences] = useOptimistic(
    initialPreferences,
    (state: UserPreferences, newPreferences: Partial<UserPreferences>) => ({
      ...state,
      ...newPreferences,
    })
  );

  const [isSigningOut, setIsSigningOut] = useState(false);

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : clerkUser?.firstName?.charAt(0) || 'U';

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

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

  return {
    isAdmin,
    preferences,
    isSigningOut,
    userInitials,
    openSettingsModal,
    handleSignOut,
    handlePreferenceUpdate,
  };
}
