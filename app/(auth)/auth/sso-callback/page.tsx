"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useSignUp, useSignIn } from "@clerk/nextjs";
import { AuthCard } from "@/features/auth";
import { authStyles } from "@/features/auth/theme/auth-styles";
import OnboardingModal from "@/components/shared/onboarding-modal";
import { getAllCategoriesAction } from "@/features/categories/actions/category-actions";
import { completeOnboardingAction, checkUserExistsAction } from "@/features/onboarding/actions";
import type { Category } from "@/lib/types";
import type { OnboardingPayload } from "@/features/onboarding/types";

/**
 * Simplified SSO Callback Page
 *
 * Handles OAuth callback with a linear flow:
 * 1. Check if user exists in Supabase
 * 2. If exists → redirect to dashboard
 * 3. If new → show onboarding → create user → redirect to dashboard
 *
 * Clerk proxy handles session management automatically - no manual setActive() needed
 */

// Simplified view state (discriminated union for type safety)
type ViewState =
  | { type: 'checking' }
  | { type: 'onboarding'; categories: Category[] }
  | { type: 'submitting' }
  | { type: 'redirecting' }
  | { type: 'error'; message: string };

export default function SSOCallback() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();

  const [viewState, setViewState] = useState<ViewState>({ type: 'checking' });
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const processedUserRef = useRef<string | null>(null);
  const signUpRef = useRef(signUp);
  const signInRef = useRef(signIn);
  const setActiveRef = useRef(setActive);

  useEffect(() => {
    signUpRef.current = signUp;
    signInRef.current = signIn;
    setActiveRef.current = setActive;
  }, [signUp, signIn, setActive]);

  // Single effect - linear flow with improved UX
  useEffect(() => {
    async function processCallback() {
      // Wait for Clerk to load
      if (!isLoaded) return;

      // Handle external account transfer case (returning user)
      const signUpClient = signUpRef.current;
      const signInClient = signInRef.current;
      const setActiveClient = setActiveRef.current;

      if (!isSignedIn && signUpClient && signInClient) {
        const hasExternalAccountError =
          signUpClient.verifications?.externalAccount?.error?.code === 'external_account_exists';

        if (hasExternalAccountError) {
          const transfer = signUpClient.verifications.externalAccount;

          if (transfer && transfer.status === 'transferable') {
            try {
              console.log('[SSO] External account exists, transferring to sign-in');
              const signInAttempt = await signInClient.create({ transfer: true });

              if (
                signInAttempt.status === 'complete' &&
                signInAttempt.createdSessionId &&
                setActiveClient
              ) {
                await setActiveClient({ session: signInAttempt.createdSessionId });
                // Session activated, will trigger re-render with isSignedIn = true
                return;
              }
            } catch (error) {
              console.error('[SSO] Transfer failed:', error);
              setViewState({
                type: 'error',
                message: 'Errore durante il trasferimento account. Riprova.'
              });
              return;
            }
          }
        }
      }

      // Clerk proxy ensures user is authenticated
      // If not signed in at this point, redirect to auth page
      if (!isSignedIn || !userId) {
        router.replace('/auth?error=authentication-required');
        return;
      }

      if (processedUserRef.current === userId) {
        return;
      }
      processedUserRef.current = userId;

      try {
        // Check if user exists in Supabase
        const result = await checkUserExistsAction(userId);

        if (result.data?.exists) {
          // Existing user - redirect to dashboard immediately for smoother UX
          router.replace('/dashboard');
        } else {
          // New user - load onboarding
          const categoriesResult = await getAllCategoriesAction();
          const categories = categoriesResult.data || [];

          setViewState({ type: 'onboarding', categories });
        }
      } catch (error) {
        console.error('[SSO] Error processing callback:', error);
        setViewState({
          type: 'error',
          message: 'Errore durante la verifica. Riprova.'
        });
      }
    }

    processCallback();
  }, [isLoaded, isSignedIn, userId, router, signUp, signIn, setActive]);

  // Handle error state redirect
  useEffect(() => {
    if (viewState.type === 'error') {
      const timer = setTimeout(() => {
        router.replace(`/auth?error=${encodeURIComponent(viewState.message)}`);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [viewState, router]);

  // Onboarding completion handler
  const handleOnboardingComplete = async (payload: OnboardingPayload) => {
    if (!userId || !user) {
      setOnboardingError("Impossibile identificare l'utente. Riprova.");
      return;
    }

    setViewState({ type: 'submitting' });
    setOnboardingError(null);

    try {
      const result = await completeOnboardingAction({
        user: {
          clerkId: userId,
          email: user.primaryEmailAddress?.emailAddress || "",
          name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || "",
        },
        group: payload.group,
        accounts: payload.accounts,
        budgets: payload.budgets,
        budgetStartDay: payload.budgetStartDay,
      });

      if (result.error) {
        setOnboardingError(`${result.error}. Riprova.`);
        // Return to onboarding with error
        const categoriesResult = await getAllCategoriesAction();
        setViewState({
          type: 'onboarding',
          categories: categoriesResult.data || []
        });
        return;
      }

      // Success - redirect to dashboard immediately for smoother UX
      router.replace('/dashboard');
    } catch (error) {
      console.error("Onboarding error:", error);
      setOnboardingError("Errore imprevisto. Riprova.");

      // Return to onboarding
      const categoriesResult = await getAllCategoriesAction();
      setViewState({
        type: 'onboarding',
        categories: categoriesResult.data || []
      });
    }
  };

  // Render based on view state
  if (viewState.type === 'onboarding') {
    return (
      <OnboardingModal
        categories={viewState.categories}
        categoriesLoading={false}
        loading={false}
        error={onboardingError}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Loading states
  const loadingMessage =
    viewState.type === 'checking' ? "Verifica account in corso..." :
    viewState.type === 'submitting' ? "Configurazione account..." :
    viewState.type === 'redirecting' ? "Reindirizzamento..." :
    viewState.type === 'error' ? viewState.message :
    "Caricamento...";

  return (
    <>
      <div className={authStyles.page.bgBlobTop} />
      <div className={authStyles.page.bgBlobBottom} />
      <AuthCard
        title={viewState.type === 'error' ? "Errore" : "Verifica in corso"}
        subtitle={viewState.type === 'error' ? "Si è verificato un problema" : "Completamento autenticazione"}
      >
        <div className={authStyles.loading.container}>
          <Loader2 className={authStyles.loading.spinner} />
          <p className={authStyles.loading.text}>
            {loadingMessage}
          </p>
        </div>
      </AuthCard>
    </>
  );
}
