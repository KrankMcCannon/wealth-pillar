"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';

export type SignUpStep = 'credentials' | 'verify';

export function useSignUpController() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submitCredentials = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName || undefined,
        lastName: lastName || undefined,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  }, [email, isLoaded, firstName, lastName, password, signUp]);

  const submitVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        router.push('/dashboard');
        return;
      }
      setError('Verifica incompleta. Riprova o richiedi un nuovo codice.');
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Codice non valido');
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded, router, setActive, signUp]);

  const resendVerificationCode = useCallback(async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Impossibile reinviare il codice');
    }
  }, [isLoaded, signUp]);

  // OAuth helpers
  const oauth = {
    google: async () => {
      if (!isLoaded) return;
      try {
        await signUp.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: '/sign-up', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante la registrazione con Google');
      }
    },
    apple: async () => {
      if (!isLoaded) return;
      try {
        await signUp.authenticateWithRedirect({ strategy: 'oauth_apple', redirectUrl: '/sign-up', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante la registrazione con Apple');
      }
    },
    github: async () => {
      if (!isLoaded) return;
      try {
        await signUp.authenticateWithRedirect({ strategy: 'oauth_github', redirectUrl: '/sign-up', redirectUrlComplete: '/dashboard' });
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Errore durante la registrazione con GitHub');
      }
    },
  };

  return {
    // state
    step, email, password, firstName, lastName, code, error, loading,
    // setters
    setEmail, setPassword, setFirstName, setLastName, setCode, setStep,
    // actions
    submitCredentials, submitVerification,
    resendVerificationCode,
    oauth,
  };
}

export default useSignUpController;
