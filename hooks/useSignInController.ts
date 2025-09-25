"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';

export function useSignInController() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [isLoaded, email, password, router, setActive, signIn]);

  // OAuth helpers
  const oauth = {
    google: async () => {
      if (!isLoaded) return;
      try {
        await signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sign-in', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante il login con Google');
      }
    },
    apple: async () => {
      if (!isLoaded) return;
      try {
        await signIn.authenticateWithRedirect({ strategy: 'oauth_apple', redirectUrl: '/sign-in', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante il login con Apple');
      }
    },
    github: async () => {
      if (!isLoaded) return;
      try {
        await signIn.authenticateWithRedirect({ strategy: 'oauth_github', redirectUrl: '/sign-in', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante il login con GitHub');
      }
    },
  };

  return {
    // state
    email, password, error, loading,
    // setters
    setEmail, setPassword,
    // actions
    handleSubmit,
    oauth,
  };
}

export default useSignInController;
