/**
 * useSignUpState Hook
 * Manages sign-up multi-step form state and actions
 * Handles credentials, verification, and onboarding steps
 */

'use client';

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type SignUpStep = 'credentials' | 'verify' | 'onboarding';

/**
 * Sign-up form state
 */
export interface SignUpFormState {
  step: SignUpStep;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
  code: string;
  error: string | null;
  loading: boolean;
  clerkUserId: string;
  sessionId: string;
}

/**
 * Sign-up form actions
 */
export interface SignUpFormActions {
  // Setters for form fields
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
  setFirstName: (firstName: string) => void;
  setLastName: (lastName: string) => void;
  setUsername: (username: string) => void;
  setCode: (code: string) => void;
  setStep: (step: SignUpStep) => void;
  setError: (error: string | null) => void;

  // Step actions
  submitCredentials: (e: React.FormEvent) => Promise<void>;
  submitVerification: (e: React.FormEvent) => Promise<void>;
  resendVerificationCode: () => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // OAuth handlers
  handleGoogleSignUp: () => Promise<void>;
  handleAppleSignUp: () => Promise<void>;
  handleGitHubSignUp: () => Promise<void>;
}

/**
 * Sign-up state and actions
 */
export interface SignUpStateReturn {
  state: SignUpFormState;
  actions: SignUpFormActions;
}

/**
 * Hook for managing sign-up form state with multi-step support
 * Returns structured { state, actions } object
 */
export function useSignUpState(): SignUpStateReturn {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  // Form state
  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clerkUserId, setClerkUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  // Submit credentials
  const submitCredentials = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        await signUp.create({
          emailAddress: email,
          password,
          username: username || email.split('@')[0],
        });

        if (firstName || lastName) {
          await signUp.update({
            unsafeMetadata: {
              firstName: firstName || '',
              lastName: lastName || '',
            },
          });
        }

        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setStep('verify');
      } catch (err: unknown) {
        const clerkError = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }> };
        const errorCode = clerkError?.errors?.[0]?.code;
        const errorMsg = clerkError?.errors?.[0]?.message;
        const longMsg = clerkError?.errors?.[0]?.longMessage;

        if (errorCode === 'captcha_invalid' || errorCode === 'captcha_unavailable' || errorMsg?.toLowerCase().includes('captcha')) {
          setError('CAPTCHA richiesto ma non disponibile. Attendi 10-15 minuti dopo aver disattivato bot protection nel Clerk Dashboard.');
        } else if (errorCode === 'form_password_pwned') {
          setError('Questa password è stata compromessa in violazioni di dati. Usa una password diversa.');
        } else if (errorCode === 'form_password_length_too_short') {
          setError('La password deve essere almeno 8 caratteri.');
        } else if (errorCode === 'form_identifier_exists') {
          setError('Questo indirizzo email è già registrato. Prova ad accedere.');
        } else {
          setError(longMsg || errorMsg || 'Errore durante la registrazione');
        }
      } finally {
        setLoading(false);
      }
    },
    [email, isLoaded, firstName, lastName, password, signUp, username]
  );

  // Submit verification
  const submitVerification = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        const attempt = await signUp.attemptEmailAddressVerification({ code });
        if (attempt.status === 'complete') {
          setClerkUserId(attempt.createdUserId || '');
          setSessionId(attempt.createdSessionId || '');
          setStep('onboarding');
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
        setError(clerkMsg ?? 'Codice di verifica non valido');
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, code, signUp]
  );

  // Resend verification code
  const resendVerificationCode = useCallback(async () => {
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setError('Codice inviato di nuovo');
      setLoading(false);
      setTimeout(() => setError(null), 3000);
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante il reinvio del codice');
      setLoading(false);
    }
  }, [isLoaded, signUp]);

  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    setError(null);
    if (!isLoaded || !sessionId) return;
    setLoading(true);
    try {
      await setActive({ session: sessionId });
      router.push('/dashboard');
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante il completamento della registrazione');
      setLoading(false);
    }
  }, [isLoaded, sessionId, setActive, router]);

  // Google OAuth for sign-up
  const handleGoogleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/sign-up/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante la registrazione con Google');
      setLoading(false);
    }
  }, [isLoaded, signUp]);

  // Apple OAuth for sign-up
  const handleAppleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_apple',
        redirectUrl: `${window.location.origin}/sign-up/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante la registrazione con Apple');
      setLoading(false);
    }
  }, [isLoaded, signUp]);

  // GitHub OAuth for sign-up
  const handleGitHubSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setLoading(true);
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_github',
        redirectUrl: `${window.location.origin}/sign-up/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/dashboard`,
      });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Errore durante la registrazione con GitHub');
      setLoading(false);
    }
  }, [isLoaded, signUp]);

  return {
    state: {
      step,
      email,
      password,
      firstName,
      lastName,
      username,
      code,
      error,
      loading,
      clerkUserId,
      sessionId,
    },
    actions: {
      setEmail,
      setPassword,
      setFirstName,
      setLastName,
      setUsername,
      setCode,
      setStep,
      setError,
      submitCredentials,
      submitVerification,
      resendVerificationCode,
      completeOnboarding,
      handleGoogleSignUp,
      handleAppleSignUp,
      handleGitHubSignUp,
    },
  };
}
