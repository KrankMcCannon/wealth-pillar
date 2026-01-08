"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useReducer, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useSignUp, useSignIn } from "@clerk/nextjs";
import { AuthCard } from "@/features/auth";
import OnboardingModal from "@/components/shared/onboarding-modal";
import { getAllCategoriesAction } from "@/features/categories/actions/category-actions";
import { completeOnboardingAction, deleteClerkUserAction, checkUserExistsAction } from "@/features/onboarding/actions";
import type { Category } from "@/lib/types";
import type { OnboardingPayload } from "@/features/onboarding/types";

/**
 * Unified SSO Callback Page with State Machine
 *
 * CRITICAL FIX: Checks user existence BEFORE signup completion
 * This prevents the sessionID bug for existing users
 *
 * State Machine Flow:
 * 1. IDLE → CHECKING_USER (check Clerk auth + Supabase user)
 * 2a. User EXISTS → REDIRECTING to /dashboard ✅
 * 2b. User NEW → Check if signup needs completion
 *     → COMPLETING_SIGNUP (if username missing)
 *     → LOADING_ONBOARDING → SHOWING_ONBOARDING
 *
 * Benefits:
 * - Fixes sessionID bug for existing users
 * - No race conditions (single state variable)
 * - Type-safe transitions
 * - Easier to debug
 */

// State Machine Types
type SSOCallbackState =
  | { type: 'IDLE' }
  | { type: 'CHECKING_USER' }
  | { type: 'USER_EXISTS' }
  | { type: 'USER_NEW_NEED_SIGNUP'; missingFields: string[] }
  | { type: 'COMPLETING_SIGNUP' }
  | { type: 'LOADING_ONBOARDING' }
  | { type: 'SHOWING_ONBOARDING'; categories: Category[] }
  | { type: 'COMPLETING_ONBOARDING' }
  | { type: 'REDIRECTING'; destination: string }
  | { type: 'ERROR'; error: string };

type SSOCallbackAction =
  | { type: 'START_CHECK' }
  | { type: 'USER_FOUND' }
  | { type: 'USER_NOT_FOUND' }
  | { type: 'SIGNUP_NEEDED'; missingFields: string[] }
  | { type: 'SIGNUP_NOT_NEEDED' }
  | { type: 'SIGNUP_COMPLETED' }
  | { type: 'START_LOADING_CATEGORIES' }
  | { type: 'CATEGORIES_LOADED'; categories: Category[] }
  | { type: 'ONBOARDING_SUBMITTED' }
  | { type: 'ONBOARDING_COMPLETE' }
  | { type: 'ERROR_OCCURRED'; error: string };

// State Machine Reducer
function ssoCallbackReducer(
  state: SSOCallbackState,
  action: SSOCallbackAction
): SSOCallbackState {
  switch (state.type) {
    case 'IDLE':
      if (action.type === 'START_CHECK') {
        return { type: 'CHECKING_USER' };
      }
      break;

    case 'CHECKING_USER':
      if (action.type === 'USER_FOUND') {
        return { type: 'REDIRECTING', destination: '/dashboard' };
      }
      if (action.type === 'USER_NOT_FOUND') {
        return { type: 'USER_NEW_NEED_SIGNUP', missingFields: [] };
      }
      if (action.type === 'ERROR_OCCURRED') {
        return { type: 'ERROR', error: action.error };
      }
      break;

    case 'USER_NEW_NEED_SIGNUP':
      if (action.type === 'SIGNUP_NEEDED') {
        return { type: 'COMPLETING_SIGNUP' };
      }
      if (action.type === 'SIGNUP_NOT_NEEDED') {
        return { type: 'LOADING_ONBOARDING' };
      }
      break;

    case 'COMPLETING_SIGNUP':
      if (action.type === 'SIGNUP_COMPLETED') {
        return { type: 'LOADING_ONBOARDING' };
      }
      if (action.type === 'ERROR_OCCURRED') {
        return { type: 'ERROR', error: action.error };
      }
      break;

    case 'LOADING_ONBOARDING':
      if (action.type === 'CATEGORIES_LOADED') {
        return { type: 'SHOWING_ONBOARDING', categories: action.categories };
      }
      break;

    case 'SHOWING_ONBOARDING':
      if (action.type === 'ONBOARDING_SUBMITTED') {
        return { type: 'COMPLETING_ONBOARDING' };
      }
      break;

    case 'COMPLETING_ONBOARDING':
      if (action.type === 'ONBOARDING_COMPLETE') {
        return { type: 'REDIRECTING', destination: '/dashboard' };
      }
      if (action.type === 'ERROR_OCCURRED') {
        return { type: 'SHOWING_ONBOARDING', categories: [] };
      }
      break;
  }

  return state;
}

export default function SSOCallback() {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();

  const [state, dispatch] = useReducer(ssoCallbackReducer, { type: 'IDLE' });
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Force a re-run of the check effect after async auth updates
  const [authUpdateTrigger, setAuthUpdateTrigger] = useState(0);

  // Prevent concurrent effect executions during async operations
  const processingRef = useRef(false);

  // Debug logging for state changes
  useEffect(() => {
    console.log('[SSO State]', state.type, state);
  }, [state]);

  // Effect 1: Start checking when auth is loaded
  useEffect(() => {
    if (!isLoaded) return;

    if (state.type === 'IDLE') {
      console.log('[SSO] Starting user check');
      dispatch({ type: 'START_CHECK' });
    }
  }, [isLoaded, state.type]);

  // Effect 2: Check user existence (CRITICAL FIX - happens FIRST)
  useEffect(() => {
    async function checkUser() {
      // Prevent concurrent executions
      if (processingRef.current) {
        console.log('[SSO] Already processing, skipping duplicate effect run');
        return;
      }

      if (state.type !== 'CHECKING_USER') return;

      // Ensure auth is ready
      if (!isLoaded) return;

      // Set processing flag to prevent concurrent runs
      processingRef.current = true;

      try {
        // Handle signup completion for new users
        if (!isSignedIn && signUp && signUp.status === 'missing_requirements') {
          // Check if there's an error that prevents signup from completing
          const hasExternalAccountError = signUp.verifications?.externalAccount?.error?.code === 'external_account_exists';

          if (hasExternalAccountError && signIn) {
            console.log('[SSO] External account exists, switching to sign-in flow');
            // This means the user already has a Clerk account with this Google/OAuth provider
            // Use sign-in instead of sign-up
            try {
              // Try to create a session for the existing user
              const transfer = signUp.verifications.externalAccount;
              if (transfer && transfer.status === 'transferable') {
                // Use the transferable verification to sign in
                const signInAttempt = await signIn.create({
                  transfer: true,
                });

                if (signInAttempt.status === 'complete') {
                  await setActive({ session: signInAttempt.createdSessionId! });
                  console.log('[SSO] Session activated via transfer, triggering flow refresh');
                  // Reset flag BEFORE triggering the re-run
                  processingRef.current = false;
                  setAuthUpdateTrigger(prev => prev + 1);
                  return;
                } else {
                  console.error('[SSO] Sign-in transfer incomplete:', signInAttempt.status);
                  dispatch({ type: 'ERROR_OCCURRED', error: 'Failed to complete sign-in' });
                  processingRef.current = false;
                  return;
                }
              } else {
                console.error('[SSO] External account not transferable');
                dispatch({ type: 'ERROR_OCCURRED', error: 'Cannot transfer external account' });
                processingRef.current = false;
                return;
              }
            } catch (signInError) {
              console.error('[SSO] Failed to switch to sign-in:', signInError);
              dispatch({ type: 'ERROR_OCCURRED', error: 'Account exists but sign-in failed' });
              processingRef.current = false;
              return;
            }
          }

          // Check if only username is missing (normal for new OAuth users)
          const onlyUsernameMissing =
            signUp.missingFields?.length === 1 &&
            signUp.missingFields[0] === 'username';

          if (onlyUsernameMissing) {
            console.log('[SSO] Username missing, auto-generating...');
            // Auto-generate username for new OAuth users
            try {
              const emailUsername = signUp.emailAddress?.split('@')[0] || 'user';
              const username = `${emailUsername}_${Date.now().toString().slice(-6)}`;

              const updatedSignUp = await signUp.update({ username });

              if (updatedSignUp.status === 'complete' && updatedSignUp.createdSessionId) {
                await setActive({ session: updatedSignUp.createdSessionId });
                console.log('[SSO] Signup completed, session created, triggering flow refresh');
                // Reset flag BEFORE triggering the re-run
                processingRef.current = false;
                setAuthUpdateTrigger(prev => prev + 1);
                return;
              }
            } catch (error) {
              console.error('[SSO] Failed to complete signup:', error);
              dispatch({ type: 'ERROR_OCCURRED', error: 'Failed to complete signup' });
              processingRef.current = false;
              return;
            }
          }

          // For other missing_requirements cases, just return and wait
          console.log('[SSO] Signup has missing requirements, waiting...', signUp.missingFields);
          processingRef.current = false;
          return;
        }

        if (!isSignedIn || !userId) {
          dispatch({ type: 'ERROR_OCCURRED', error: 'Authentication failed' });
          processingRef.current = false;
          return;
        }

        // CRITICAL: Check if user exists in Supabase BEFORE any signup completion
        console.log('[SSO] Checking if user exists in Supabase, clerkId:', userId);
        const result = await checkUserExistsAction(userId);
        console.log('[SSO] checkUserExistsAction result:', { data: result.data, error: result.error });

        if (result.data?.exists) {
          // Existing user - redirect to dashboard
          console.log('[SSO] User exists in Supabase, redirecting to dashboard');
          dispatch({ type: 'USER_FOUND' });
        } else {
          // New user - check if signup needs completion
          console.log('[SSO] User NOT found in Supabase, proceeding with onboarding');
          if (result.error) {
            console.log('[SSO] Error from service:', result.error);
          }
          dispatch({ type: 'USER_NOT_FOUND' });
        }
      } catch (error) {
        console.error("[SSO Debug] Error checking user:", error);
        dispatch({ type: 'ERROR_OCCURRED', error: 'Failed to verify user status' });
      } finally {
        // Always reset the processing flag
        processingRef.current = false;
      }
    }

    void checkUser();
  }, [state.type, isLoaded, isSignedIn, userId, signUp, signIn, setActive, authUpdateTrigger]);

  // Effect 3: Determine if signup needs completion (NEW USERS ONLY)
  useEffect(() => {
    if (state.type !== 'USER_NEW_NEED_SIGNUP') return;

    // Check if signup needs username completion
    if (signUp && signUp.status === "missing_requirements") {
      if (signUp.missingFields?.includes("username")) {
        dispatch({ type: 'SIGNUP_NEEDED', missingFields: signUp.missingFields });
      } else {
        // Other missing fields - unexpected, skip signup completion
        dispatch({ type: 'SIGNUP_NOT_NEEDED' });
      }
    } else {
      // No signup issues, go straight to onboarding
      dispatch({ type: 'SIGNUP_NOT_NEEDED' });
    }
  }, [state.type, signUp]);

  // Effect 4: Complete signup (auto-generate username)
  useEffect(() => {
    async function completeSignup() {
      if (state.type !== 'COMPLETING_SIGNUP') return;

      try {
        if (!signUp) {
          throw new Error("No signup object available");
        }

        // Auto-generate username from email
        const emailUsername = signUp.emailAddress?.split("@")[0] || "user";
        const username = `${emailUsername}_${Date.now().toString().slice(-6)}`;

        const updatedSignUp = await signUp.update({ username });

        if (updatedSignUp.status === "complete" && updatedSignUp.createdSessionId) {
          await setActive({ session: updatedSignUp.createdSessionId });
          dispatch({ type: 'SIGNUP_COMPLETED' });
        } else {
          throw new Error("Signup could not be completed");
        }
      } catch (error) {
        console.error("Error completing signup:", error);
        dispatch({ type: 'ERROR_OCCURRED', error: 'Failed to complete signup' });
      }
    }

    void completeSignup();
  }, [state.type, signUp, setActive]);

  // Effect 5: Load categories for onboarding
  useEffect(() => {
    async function loadCategories() {
      if (state.type !== 'LOADING_ONBOARDING') return;

      const result = await getAllCategoriesAction();

      if (!result.error && result.data) {
        dispatch({ type: 'CATEGORIES_LOADED', categories: result.data });
      } else {
        // Still show onboarding even if categories fail to load
        dispatch({ type: 'CATEGORIES_LOADED', categories: [] });
      }
    }

    void loadCategories();
  }, [state.type]);

  // Effect 6: Handle redirects
  useEffect(() => {
    if (state.type === 'REDIRECTING') {
      console.log('[SSO] Redirecting to:', state.destination);
      router.replace(state.destination);
    }
  }, [state.type, router]);

  // Effect 7: Handle errors
  useEffect(() => {
    if (state.type === 'ERROR') {
      console.log('[SSO] Error occurred, redirecting to /auth with error:', state.error);
      router.replace(`/auth?error=${encodeURIComponent(state.error)}`);
    }
  }, [state.type, router]);

  // Onboarding completion handler
  const handleOnboardingComplete = useCallback(async (payload: OnboardingPayload) => {
    if (!userId || !user) {
      setOnboardingError("Impossibile identificare l'utente. Prova a effettuare nuovamente l'accesso.");
      return;
    }

    dispatch({ type: 'ONBOARDING_SUBMITTED' });
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
        setOnboardingError(`${result.error}. La registrazione verrà annullata. Riprova tra poco.`);

        // Rollback: Delete Clerk user
        try {
          const deleteResult = await deleteClerkUserAction(userId);
          if (deleteResult.error) {
            console.error("Failed to delete Clerk user:", deleteResult.error);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }

        dispatch({ type: 'ERROR_OCCURRED', error: result.error });
        return;
      }

      dispatch({ type: 'ONBOARDING_COMPLETE' });
    } catch (error) {
      console.error("Unexpected onboarding error:", error);
      setOnboardingError("Errore imprevisto durante la configurazione. Riprova tra poco.");

      // Attempt cleanup
      try {
        await deleteClerkUserAction(userId);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }

      dispatch({ type: 'ERROR_OCCURRED', error: 'Onboarding failed' });
    }
  }, [userId, user]);

  // Render based on state
  if (state.type === 'SHOWING_ONBOARDING') {
    return (
      <OnboardingModal
        categories={state.categories}
        categoriesLoading={false}
        loading={false}
        error={onboardingError}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  if (state.type === 'COMPLETING_ONBOARDING') {
    return (
      <>
        <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
        <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />
        <AuthCard
          title="Completamento configurazione"
          subtitle="Un attimo di pazienza"
        >
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--color-primary))]" />
            <p className="text-sm text-gray-600 text-center">
              Stiamo configurando il tuo account...
            </p>
          </div>
        </AuthCard>
      </>
    );
  }

  // Default loading state
  return (
    <>
      <div className="pointer-events-none fixed -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-primary))]" />
      <div className="pointer-events-none fixed -bottom-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-15 bg-[hsl(var(--color-secondary))]" />
      <AuthCard
        title="Verifica in corso"
        subtitle="Completamento autenticazione"
      >
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[hsl(var(--color-primary))]" />
          <p className="text-sm text-gray-600 text-center">
            {state.type === 'CHECKING_USER' && "Stiamo verificando il tuo account..."}
            {state.type === 'COMPLETING_SIGNUP' && "Completamento registrazione..."}
            {state.type === 'LOADING_ONBOARDING' && "Caricamento configurazione..."}
            {state.type === 'REDIRECTING' && "Reindirizzamento..."}
            {state.type === 'IDLE' && "Inizializzazione..."}
            {!['CHECKING_USER', 'COMPLETING_SIGNUP', 'LOADING_ONBOARDING', 'REDIRECTING', 'IDLE'].includes(state.type) && "Stiamo completando il tuo accesso..."}
          </p>
        </div>
      </AuthCard>
    </>
  );
}
