"use client";

import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

export type ResetPasswordStep = "request" | "verify" | "reset";

/**
 * Password reset form state
 */
export interface ResetPasswordFormState {
  step: ResetPasswordStep;
  email: string;
  code: string;
  password: string;
  error: string | null;
  loading: boolean;
}

/**
 * Password reset form actions
 */
export interface ResetPasswordFormActions {
  setStep: (step: ResetPasswordStep) => void;
  setEmail: (email: string) => void;
  setCode: (code: string) => void;
  setPassword: (password: string) => void;
  setError: (error: string | null) => void;
  requestCode: (e: React.FormEvent) => Promise<void>;
  verifyCode: (e: React.FormEvent) => Promise<void>;
  submitNewPassword: (e: React.FormEvent) => Promise<void>;
  resendCode: () => Promise<void>;
}

/**
 * Return type for usePasswordResetState hook
 */
export interface ResetPasswordStateReturn {
  state: ResetPasswordFormState;
  actions: ResetPasswordFormActions;
}

/**
 * usePasswordResetState
 * Manages password reset flow state and actions
 *
 * Pattern: { state, actions }
 * Usage:
 * ```ts
 * const { state, actions } = usePasswordResetState();
 * ```
 */
export function usePasswordResetState(): ResetPasswordStateReturn {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();

  const [step, setStep] = useState<ResetPasswordStep>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1) Request reset code via email
  const requestCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        await signIn.create({
          strategy: "reset_password_email_code",
          identifier: email,
        });
        setStep("verify");
      } catch (err: unknown) {
        const msg =
          (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
            ?.message ?? "Errore durante la richiesta del codice";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [email, isLoaded, signIn]
  );

  // 2) Verify code sent to email
  const verifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        await signIn.attemptFirstFactor({
          strategy: "reset_password_email_code",
          code,
        });
        setStep("reset");
      } catch (err: unknown) {
        const msg =
          (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
            ?.message ?? "Codice non valido";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [code, isLoaded, signIn]
  );

  // Resend code
  const resendCode = useCallback(async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setError(null);
    } catch (err: unknown) {
      const msg =
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? "Impossibile reinviare il codice";
      setError(msg);
    }
  }, [email, isLoaded, signIn]);

  // 3) Set the new password
  const submitNewPassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (!isLoaded) return;
      setLoading(true);
      try {
        const res = await signIn.resetPassword({ password });
        if (res?.status === "complete" && res?.createdSessionId) {
          await setActive({ session: res.createdSessionId });
          router.push("/dashboard");
          return;
        }
        router.push("/sign-in");
      } catch (err: unknown) {
        const msg =
          (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
            ?.message ?? "Errore durante l'aggiornamento della password";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    [isLoaded, password, router, setActive, signIn]
  );

  return {
    state: {
      step,
      email,
      code,
      password,
      error,
      loading,
    },
    actions: {
      setStep,
      setEmail,
      setCode,
      setPassword,
      setError,
      requestCode,
      verifyCode,
      submitNewPassword,
      resendCode,
    },
  };
}

export default usePasswordResetState;
