"use client";

import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';

export type SignUpStep = 'credentials' | 'verify' | 'onboarding';

export function useSignUpController() {
  const router = useRouter();
  const { isLoaded, signUp, setActive } = useSignUp();

  const [step, setStep] = useState<SignUpStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Onboarding data
  const [clerkUserId, setClerkUserId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const submitCredentials = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      // Create user with username (required in Clerk config)
      await signUp.create({
        emailAddress: email,
        password,
        username: username || email.split('@')[0], // Use email prefix as fallback
      });

      // Update user metadata with name after creation if provided
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
      // Detailed error logging for debugging
      console.error('Sign-up error details:', err);
      console.error('Error object:', JSON.stringify(err, null, 2));

      const clerkError = err as { errors?: Array<{ code?: string; message?: string; longMessage?: string }> };
      const errorCode = clerkError?.errors?.[0]?.code;
      const errorMsg = clerkError?.errors?.[0]?.message;
      const longMsg = clerkError?.errors?.[0]?.longMessage;

      // Log all error details to console for debugging
      console.log('Error code:', errorCode);
      console.log('Error message:', errorMsg);
      console.log('Long message:', longMsg);

      // Handle CAPTCHA-specific errors with helpful message
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
  }, [email, isLoaded, firstName, lastName, password, signUp, username]);

  const submitVerification = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;
    setLoading(true);
    try {
      const attempt = await signUp.attemptEmailAddressVerification({ code });
      if (attempt.status === 'complete') {

        // Store Clerk user data for onboarding
        setClerkUserId(attempt.createdUserId || '');
        setSessionId(attempt.createdSessionId || '');

        // Move to onboarding step instead of creating user immediately
        setStep('onboarding');
        setLoading(false);
        return;
      }
      setError('Verifica incompleta. Riprova o richiedi un nuovo codice.');
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Codice non valido');
    } finally {
      setLoading(false);
    }
  }, [code, isLoaded, signUp]);

  const resendVerificationCode = useCallback(async () => {
    if (!isLoaded) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
    } catch (err: unknown) {
      const clerkMsg = (err as { errors?: Array<{ message?: string }> })?.errors?.[0]?.message;
      setError(clerkMsg ?? 'Impossibile reinviare il codice');
    }
  }, [isLoaded, signUp]);

  const completeOnboarding = useCallback(async (onboardingData: { groupName: string; accountName: string; initialBalance: number }) => {
    setError(null);
    setLoading(true);
    try {
      if (!signUp) {
        setError('Session non valida. Riprova.');
        setLoading(false);
        return;
      }

      // Prepare user data
      const userEmail = signUp.emailAddress || email;
      const userMetadata = signUp.unsafeMetadata as { firstName?: string; lastName?: string } | undefined;
      const userName = userMetadata?.firstName && userMetadata?.lastName
        ? `${userMetadata.firstName} ${userMetadata.lastName}`
        : userMetadata?.firstName || userMetadata?.lastName || username || email.split('@')[0];

      console.log('Creating user with onboarding data in Supabase via API...');

      // FIRST activate the session so the API can authenticate the request
      if (sessionId && setActive) {
        console.log('Activating session before API call...');
        await setActive({ session: sessionId });
      }

      // Create user with group and account information
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: clerkUserId,
          email: userEmail || '',
          name: userName,
          avatar: '',
          group_name: onboardingData.groupName,
          account_name: onboardingData.accountName,
          initial_balance: onboardingData.initialBalance,
        }),
      });

      if (response.ok) {
        const result = await response.json() as { data: unknown; success: boolean };
        console.log('User and onboarding data created successfully:', result.data);

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Try to parse JSON error, but handle HTML responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json() as { error?: { message?: string } };
          setError(errorData.error?.message || 'Errore durante la configurazione del profilo');
        } else {
          const text = await response.text();
          console.error('Non-JSON response from API:', text.substring(0, 200));
          setError('Errore del server. Riprova.');
        }
      }
    } catch (apiError) {
      console.error('Error completing onboarding:', apiError);
      setError('Errore di rete. Riprova.');
    } finally {
      setLoading(false);
    }
  }, [clerkUserId, email, router, sessionId, setActive, signUp, username]);

  // FIXED: OAuth helpers using proper embedded flow
  // Uses window.location for OAuth to stay within app layout
  const oauth = {
    google: async () => {
      if (!isLoaded) return;
      setLoading(true);
      try {
        // Use authenticateWithRedirect with proper callback URL
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
    },
    apple: async () => {
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
    },
    github: async () => {
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
    },
  };

  return {
    // state
    step, email, password, firstName, lastName, username, code, error, loading,
    // setters
    setEmail, setPassword, setFirstName, setLastName, setUsername, setCode, setStep,
    // actions
    submitCredentials, submitVerification,
    resendVerificationCode,
    completeOnboarding,
    oauth,
  };
}

export default useSignUpController;
