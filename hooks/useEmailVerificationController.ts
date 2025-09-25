"use client";

import { useUser } from '@clerk/nextjs';
import { useCallback, useState } from 'react';

export type VerifyStep = 'request' | 'verify';

export function useEmailVerificationController() {
  const { isLoaded, user } = useUser();
  const [step, setStep] = useState<VerifyStep>('request');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requestCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !user) return;
    setLoading(true);
    try {
      const primary =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];
      if (!primary) throw new Error('Nessuna email associata all\'utente');
      await primary.prepareVerification({ strategy: 'email_code' });
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Errore durante l\'invio del codice';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const resend = useCallback(async () => {
    if (!isLoaded || !user) return;
    try {
      const primary =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];
      if (!primary) throw new Error('Nessuna email associata all\'utente');
      await primary.prepareVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Impossibile reinviare il codice';
      setError(msg);
    }
  }, [isLoaded, user]);

  const verifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded || !user) return;
    setLoading(true);
    try {
      const primary =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];
      if (!primary) throw new Error('Nessuna email associata all\'utente');
      await primary.attemptVerification({ code });
      setStep('request');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Codice non valido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded, user]);

  return {
    step, code, error, loading,
    setCode, setStep,
    requestCode, verifyCode, resend,
  };
}

export default useEmailVerificationController;
