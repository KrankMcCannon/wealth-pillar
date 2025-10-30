/**
 * useSettingsState Hook
 * Manages UI state for settings feature
 * Handles sign-out flow and navigation actions
 */

'use client';

import { useAuth } from '@/src/features/auth';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

/**
 * Settings UI state structure
 */
export interface SettingsState {
  isSigningOut: boolean;
}

/**
 * Settings action handlers
 */
export interface SettingsActions {
  handleBackClick: () => void;
  handleSignOut: () => Promise<void>;
}

/**
 * Settings state and actions
 */
export interface SettingsStateReturn {
  state: SettingsState;
  actions: SettingsActions;
}

/**
 * Hook for managing settings UI state
 * Returns structured { state, actions } object
 */
export function useSettingsState(): SettingsStateReturn {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleBackClick = useCallback(() => {
    router.push('/dashboard');
  }, [router]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      // Wait for Clerk to complete sign-out before redirecting
      await signOut();
      // Add small delay to ensure Clerk's session is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      // Navigate to sign-in page
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  }, [signOut]);

  return {
    state: {
      isSigningOut,
    },
    actions: {
      handleBackClick,
      handleSignOut,
    },
  };
}
