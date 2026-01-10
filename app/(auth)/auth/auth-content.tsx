"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSignUp, useClerk } from "@clerk/nextjs";
import { AppleButton, AuthCard, GitHubButton, GoogleButton, authStyles } from "@/features/auth";
import { getAbsoluteUrl, isProduction } from "@/lib/utils";

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

/**
 * Auth Content Component
 * Contains OAuth authentication logic
 * Wrapped in Suspense in parent page component
 *
 * Note: Using signUp for OAuth because it handles both new and existing users automatically. signIn would fail for new users with "external_account_not_found".
 */
export default function AuthContent() {
  const { isLoaded, signUp } = useSignUp();
  const { session } = useClerk();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const redirectingRef = useRef(false);
  const urlError = useMemo(() => {
    const errorParam = searchParams.get("error");
    return errorParam === "oauth-failed"
      ? "Autenticazione non riuscita. Riprova."
      : null;
  }, [searchParams]);

  // IMPORTANT: All hooks must be called before any conditional returns
  // First effect: Handle existing session redirect
  useEffect(() => {
    // If user already has a session, send them to SSO callback immediately
    // The callback will check if they exist in Supabase and either show onboarding or redirect to dashboard
    if (isLoaded && session && !redirectingRef.current) {
      console.log('[Auth] Session already exists, redirecting to SSO callback');
      redirectingRef.current = true;
      router.replace("/auth/sso-callback");
    }
  }, [isLoaded, session, router]);

  // Second effect: Clear error parameters from URL
  useEffect(() => {
    // Clear error from URL without page reload
    if (urlError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, [urlError]);

  // CONDITIONAL RENDERING: Only after all hooks are called
  // If session exists, redirect immediately (don't show the page)
  if (isLoaded && session) {
    return (
      <AuthCard
        title="Reindirizzamento in corso..."
        subtitle="Un momento, per favore"
      >
        <div className={authStyles.loading.container}>
          <div className={`${authStyles.loading.spinner} border-b-2 border-current rounded-full`} />
        </div>
      </AuthCard>
    );
  }

  // Handle OAuth authentication (works for both new and existing users)
  const handleOAuthAuth = async (provider: "oauth_google" | "oauth_apple" | "oauth_github") => {
    if (!isLoaded || !signUp) return;

    // Clear any previous errors
    setError(null);

    try {
      // Use signUp for OAuth - it handles both new and existing users
      // The SSO callback will check user existence and determine final routing

      // Use relative URLs in development, absolute URLs in production
      // Clerk handles relative URLs better in dev, but requires absolute in production
      const callbackPath = "/auth/sso-callback";
      const callbackUrl = isProduction() ? getAbsoluteUrl(callbackPath) : callbackPath;
      console.log('[Auth] OAuth redirect URL:', callbackUrl, `(${isProduction() ? 'production' : 'development'})`);

      await signUp.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: callbackUrl,
        redirectUrlComplete: callbackUrl, // SSO callback determines final destination
      });
    } catch (err) {
      console.error("OAuth error:", err);

      // Check if error is "session_exists" - this means user is already signed in
      // Redirect them to SSO callback instead of showing an error
      if (err && typeof err === "object" && "errors" in err) {
        const clerkErr = err as { errors?: { code?: string }[] };
        const hasSessionExistsError = clerkErr.errors?.some(e => e.code === 'session_exists');

        if (hasSessionExistsError) {
          console.log('[Auth] Session already exists, redirecting to SSO callback');
          router.push('/auth/sso-callback');
          return;
        }
      }

      setError(getErrorMessage(err, "Errore durante l'autenticazione"));
    }
  };

  return (
    <AuthCard
      title="Accedi a Wealth Pillar"
      subtitle="Scegli un metodo per continuare"
    >
      {(error ?? urlError) && (
        <div className={authStyles.error.container}>
          <AlertCircle className={authStyles.error.icon} />
          <span className={authStyles.error.text}>{error ?? urlError}</span>
        </div>
      )}

      <div className={authStyles.form.container}>
        <div className={authStyles.socialButtons.container}>
          <GoogleButton
            onClick={() => handleOAuthAuth("oauth_google")}
            disabled={!isLoaded}
            className={authStyles.socialButtons.button}
          />
          <AppleButton
            onClick={() => handleOAuthAuth("oauth_apple")}
            disabled={!isLoaded}
            className={authStyles.socialButtons.button}
          />
          <GitHubButton
            onClick={() => handleOAuthAuth("oauth_github")}
            disabled={!isLoaded}
            className={authStyles.socialButtons.button}
          />
        </div>

        <div className={authStyles.toggle.container}>
          <p className={authStyles.toggle.text}>
            Continuando, accetti i nostri{" "}
            <Link href="/terms" className={authStyles.toggle.link}>
              Termini di Servizio
            </Link>{" "}
            e la{" "}
            <Link href="/privacy" className={authStyles.toggle.link}>
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthCard>
  );
}
