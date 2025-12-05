"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Mail, Lock, LogIn, AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useSignIn, useClerk } from "@clerk/nextjs";
import { AppleButton, AuthCard, GitHubButton, GoogleButton, PasswordInput, authStyles } from "@/features/auth";
import { Button, Input, Label } from "@/components/ui";

/**
 * Extract error message from Clerk error or generic error
 */
function getErrorMessage(err: unknown, fallback: string): string {
  // Check for Clerk-style errors with errors array
  if (err && typeof err === "object" && "errors" in err) {
    const clerkErr = err as { errors?: { message?: string }[] };
    if (Array.isArray(clerkErr.errors) && clerkErr.errors[0]?.message) {
      return clerkErr.errors[0].message;
    }
  }
  // Check for standard Error instance
  if (err instanceof Error) {
    return err.message;
  }
  return fallback;
}

export default function Page() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { signOut, session } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const hasMountedRef = useRef(false);

  useEffect(() => {
    // Clear any existing session only when first landing on sign-in page
    // This runs once on mount, not on every session change
    if (hasMountedRef.current) return;

    hasMountedRef.current = true;
    if (session) {
      void signOut();
    }
  }, [session, signOut]);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "oauth-failed") {
      setError("Autenticazione social fallita. Riprova.");
    }
  }, [searchParams]);

  // Handle email/password sign-in
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else if (result.status === "needs_second_factor") {
        // Account has 2FA enabled, prepare email_code verification
        await (signIn.prepareSecondFactor as (config: { strategy: string }) => Promise<unknown>)({
          strategy: "email_code",
        });
        setNeedsSecondFactor(true);
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError(getErrorMessage(err, "Email o password non corretti"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle second factor verification
  const handleSecondFactorVerification = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await (signIn.attemptSecondFactor as (config: { strategy: string; code: string }) => Promise<{ status: string; createdSessionId: string }>)({
        strategy: "email_code",
        code: verificationCode,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Verification error:", err);
      setError(getErrorMessage(err, "Codice di verifica non corretto"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth sign-in
  const handleOAuthSignIn = async (provider: "oauth_google" | "oauth_apple" | "oauth_github") => {
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: "/sign-in/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      console.error("OAuth error:", err);
      setError(getErrorMessage(err, "Errore durante l'autenticazione social"));
    }
  };

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />

      <div className={authStyles.page.container}>
        <AuthCard
          title={needsSecondFactor ? "Verifica la tua identità" : "Accedi al tuo account"}
          subtitle={needsSecondFactor ? "Inserisci il codice di verifica" : "Gestisci le tue finanze"}
        >
        {error && (
          <div className={authStyles.error.container}>
            <AlertCircle className={authStyles.error.icon} />
            <span className={authStyles.error.text}>{error}</span>
          </div>
        )}

        {needsSecondFactor ? (
          <form onSubmit={handleSecondFactorVerification} className={authStyles.form.container}>
            <div className={authStyles.form.fieldGroup}>
              <Label htmlFor="code" className={authStyles.label.base}>
                Codice di verifica
              </Label>
              <div className={authStyles.input.wrapper}>
                <Lock className={authStyles.input.icon} />
                <Input
                  id="code"
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  required
                  disabled={isLoading}
                  className={authStyles.input.field}
                  maxLength={6}
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !isLoaded} className={authStyles.button.primary}>
              {isLoading ? (
                <>
                  <Loader2 className={authStyles.button.icon} />
                  Verifica in corso
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-3.5 w-3.5" />
                  Verifica
                </>
              )}
            </Button>

            <div className={authStyles.toggle.container}>
              <button
                type="button"
                onClick={() => {
                  setNeedsSecondFactor(false);
                  setVerificationCode("");
                  setError(null);
                }}
                className={authStyles.toggle.link}
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" />
                Torna indietro
              </button>
            </div>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className={authStyles.form.container}>
          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="email" className={authStyles.label.base}>
              Email
            </Label>
            <div className={authStyles.input.wrapper}>
              <Mail className={authStyles.input.icon} />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className={authStyles.input.field}
              />
            </div>
          </div>
          <div className={authStyles.form.fieldGroup}>
            <Label htmlFor="password" className={authStyles.label.base}>
              Password
            </Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              icon={<Lock className="h-3.5 w-3.5" />}
            />
          </div>

          <div className={authStyles.actions.row}>
            <label className={authStyles.checkbox.label}>
              <input type="checkbox" className={authStyles.checkbox.input} disabled={isLoading} /> Ricordami
            </label>
            <Link href="/forgot-password" className={authStyles.forgotPassword.link}>
              Password dimenticata?
            </Link>
          </div>

          <Button type="submit" disabled={isLoading || !isLoaded} className={authStyles.button.primary}>
            {isLoading ? (
              <>
                <Loader2 className={authStyles.button.icon} />
                Accesso in corso
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-3.5 w-3.5" />
                Accedi
              </>
            )}
          </Button>

          <div className={authStyles.divider.container}>
            <div className={authStyles.divider.line} />
            <span className={authStyles.divider.text}>oppure</span>
            <div className={authStyles.divider.line} />
          </div>

          <div className={authStyles.socialButtons.container}>
            <GoogleButton
              onClick={() => handleOAuthSignIn("oauth_google")}
              disabled={!isLoaded}
              className={authStyles.socialButtons.button}
            />
            <AppleButton
              onClick={() => handleOAuthSignIn("oauth_apple")}
              disabled={!isLoaded}
              className={authStyles.socialButtons.button}
            />
            <GitHubButton
              onClick={() => handleOAuthSignIn("oauth_github")}
              disabled={!isLoaded}
              className={authStyles.socialButtons.button}
            />
          </div>

          <div className={authStyles.toggle.container}>
            Non hai un account?{" "}
            <Link className={authStyles.toggle.link} href="/sign-up">
              Registrati
            </Link>
          </div>
        </form>
        )}
      </AuthCard>
      </div>
    </>
  );
}
