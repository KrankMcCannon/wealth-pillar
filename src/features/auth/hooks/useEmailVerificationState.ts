"use client";

import { useUser } from "@clerk/nextjs";
import { useCallback, useState } from "react";

export type VerificationStep = "request" | "verify";

/**
 * Email verification form state
 */
export interface EmailVerificationFormState {
  step: VerificationStep;
  code: string;
  error: string | null;
  loading: boolean;
}

/**
 * Email verification form actions
 */
export interface EmailVerificationFormActions {
  setStep: (step: VerificationStep) => void;
  setCode: (code: string) => void;
  setError: (error: string | null) => void;
  requestCode: (e: React.FormEvent) => Promise<void>;
  verifyCode: (e: React.FormEvent) => Promise<void>;
  resend: () => Promise<void>;
}

/**
 * Return type for useEmailVerificationState hook
 */
export interface EmailVerificationStateReturn {
  state: EmailVerificationFormState;
  actions: EmailVerificationFormActions;
}

/**
 * useEmailVerificationState
 * Manages email verification flow state and actions
 *
 * Pattern: { state, actions }
 * Usage:
 * ```ts
 * const { state, actions } = useEmailVerificationState();
 * ```
 */
export function useEmailVerificationState(): EmailVerificationStateReturn {
  const { isLoaded, user } = useUser();
  const [step, setStep] = useState<VerificationStep>("request");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Request verification code via email
  const requestCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded || !user) return;
      setLoading(true);
      try {
        const primary =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
          user.emailAddresses[0];
        if (!primary)
          throw new Error("Nessuna email associata all'utente");
        await primary.prepareVerification({ strategy: "email_code" });
        setStep("verify");
      } catch (err: unknown) {
        const msg =
          (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
            ?.message ?? "Errore durante l'invio del codice";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, user]
  );

  // Resend code
  const resend = useCallback(async () => {
    if (!isLoaded || !user) return;
    try {
      const primary =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
        user.emailAddresses[0];
      if (!primary)
        throw new Error("Nessuna email associata all'utente");
      await primary.prepareVerification({ strategy: "email_code" });
      setError(null);
    } catch (err: unknown) {
      const msg =
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? "Impossibile reinviare il codice";
      setError(msg);
    }
  }, [isLoaded, user]);

  // Verify code
  const verifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded || !user) return;
      setLoading(true);
      try {
        const primary =
          user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId) ??
          user.emailAddresses[0];
        if (!primary)
          throw new Error("Nessuna email associata all'utente");
        await primary.attemptVerification({ code });
        setStep("request");
      } catch (err: unknown) {
        const msg =
          (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
            ?.message ?? "Codice non valido";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [code, isLoaded, user]
  );

  return {
    state: {
      step,
      code,
      error,
      loading,
    },
    actions: {
      setStep,
      setCode,
      setError,
      requestCode,
      verifyCode,
      resend,
    },
  };
}

export default useEmailVerificationState;
