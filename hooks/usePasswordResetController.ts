"use client";

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type ResetStep = 'request' | 'verify' | 'reset';

export function usePasswordResetController() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<ResetStep>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1) Request reset code via email
  const requestCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
      setStep('verify');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Errore durante la richiesta del codice';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [email, isLoaded, signIn]);

  // 2) Verify code sent to email
  const verifyCode = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signIn.attemptFirstFactor({ strategy: 'reset_password_email_code', code });
      setStep('reset');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Codice non valido';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded, signIn]);

  const resendCode = useCallback(async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({ strategy: 'reset_password_email_code', identifier: email });
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Impossibile reinviare il codice';
      setError(msg);
    }
  }, [email, isLoaded, signIn]);

  // 3) Set the new password
  const submitNewPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      // Clerk supports updating password after successful reset factor verification
      // API name may differ by version; most recent SDKs support reset via signIn object
      const res = await signIn.resetPassword({ password });
      if (res?.status === 'complete' && res?.createdSessionId) {
        await setActive({ session: res.createdSessionId });
        router.push('/dashboard');
        return;
      }
      // Fallback: navigate back to sign-in
      router.push('/sign-in');
    } catch (err: unknown) {
      const msg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message ?? 'Errore durante l\'aggiornamento della password';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, password, router, setActive, signIn]);

  return {
    step, email, code, password, error, loading,
    setEmail, setCode, setPassword, setStep,
    requestCode, verifyCode, submitNewPassword,
    resendCode,
  };
}

export default usePasswordResetController;
