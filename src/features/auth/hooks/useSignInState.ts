/**
 * useSignInState Hook
 * Manages sign-in form state and actions
 * Separates UI state from Clerk authentication logic
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';

/**
 * Sign-in form state
 */
export interface SignInFormState {
  email: string;
  password: string;
  error: string | null;
  loading: boolean;
}

/**
 * Sign-in form actions
 */
export interface SignInFormActions {
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleGoogleSignIn: () => Promise<void>;
  handleAppleSignIn: () => Promise<void>;
  handleGitHubSignIn: () => Promise<void>;
}

/**
 * Sign-in state and actions
 */
export interface SignInStateReturn {
  state: SignInFormState;
  actions: SignInFormActions;
}

/**
 * Hook for managing sign-in form state and actions
 * Returns structured { state, actions } object
 */
export function useSignInState(): SignInStateReturn {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle email/password sign-in
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        const res = await signIn.create({ identifier: email, password });
        if (res.status === 'complete') {
          await setActive({ session: res.createdSessionId });
          router.push('/dashboard');
          return;
        }
        setError('Autenticazione aggiuntiva richiesta. Completa i passaggi su Clerk.');
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Credenziali non valide');
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, email, password, router, setActive, signIn]
  );

  // Handle Google OAuth
  const handleGoogleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante il login con Google');
      setLoading(false);
    }
  }, [isLoaded, signIn]);

  // Handle Apple OAuth
  const handleAppleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: `${window.location.origin}/sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante il login con Apple');
      setLoading(false);
    }
  }, [isLoaded, signIn]);

  // Handle GitHub OAuth
  const handleGitHubSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: `${window.location.origin}/sign-in/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante il login con GitHub');
      setLoading(false);
    }
  }, [isLoaded, signIn]);

  return {
    state: {
      email,
      password,
      error,
      loading,
    },
    actions: {
      setEmail,
      setPassword,
      setError,
      handleSubmit,
      handleGoogleSignIn,
      handleAppleSignIn,
      handleGitHubSignIn,
    },
  };
}
