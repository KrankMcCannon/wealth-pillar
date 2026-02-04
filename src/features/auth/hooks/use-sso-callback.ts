import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useSignUp, useSignIn } from '@clerk/nextjs';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import { completeOnboardingAction, checkUserExistsAction } from '@/features/onboarding/actions';
import type { Category } from '@/lib/types';
import type { OnboardingPayload } from '@/features/onboarding/types';
import type { SignUpResource, SignInResource, SetActive } from '@clerk/types';

// ============================================================================
// TYPES
// ============================================================================

export type ViewState =
  | { type: 'checking' }
  | { type: 'onboarding'; categories: Category[] }
  | { type: 'submitting' }
  | { type: 'redirecting' }
  | { type: 'error'; message: string };

export interface UseSSOCallbackReturn {
  viewState: ViewState;
  onboardingError: string | null;
  handleOnboardingComplete: (payload: OnboardingPayload) => Promise<void>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Handles the account transfer flow when a user tries to sign up with an email
 * that already exists in another account (e.g., merging accounts).
 */
async function handleTransferFlow(
  signUp: SignUpResource | undefined | null,
  signIn: SignInResource | undefined | null,
  setActive: SetActive | undefined | null
): Promise<{ success: boolean; handled: boolean; error?: unknown }> {
  // Check if there is an external account conflict that is transferable
  const isTransfer =
    signUp?.verifications?.externalAccount?.error?.code === 'external_account_exists';
  const transferStatus = signUp?.verifications?.externalAccount?.status === 'transferable';

  if (signUp && signIn && isTransfer && transferStatus && setActive) {
    try {
      const signInAttempt = await signIn.create({ transfer: true });
      if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId) {
        await setActive({ session: signInAttempt.createdSessionId });
        return { success: true, handled: true };
      }
    } catch (error) {
      console.error('[SSO] Transfer failed:', error);
      return { success: false, handled: true, error };
    }
  }

  return { success: false, handled: false };
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Custom hook to handle the SSO callback process.
 *
 * Manages the state machine for:
 * 1. Verifying if the user exists in our database.
 * 2. Handling account transfers (merging).
 * 3. Redirecting existing users to dashboard.
 * 4. Initiating onboarding for new users.
 * 5. Handling errors and timeouts.
 *
 * @returns {UseSSOCallbackReturn} State and handlers for the SSO callback view.
 */
export function useSSOCallback(): UseSSOCallbackReturn {
  const router = useRouter();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();

  const [viewState, setViewState] = useState<ViewState>({ type: 'checking' });
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Refs to tracking processing state and external functions to avoid effect dependency loops
  const processedUserRef = useRef<string | null>(null);
  const signUpRef = useRef(signUp);
  const signInRef = useRef(signIn);
  const setActiveRef = useRef(setActive);

  // Sync refs with latest props
  useEffect(() => {
    signUpRef.current = signUp;
    signInRef.current = signIn;
    setActiveRef.current = setActive;
  }, [signUp, signIn, setActive]);

  /**
   * Main processing effect.
   * Handles user verification and routing logic.
   */
  useEffect(() => {
    let mounted = true;

    async function processCallback() {
      if (!isLoaded) return;

      // Prevent redundant processing for the same user unless we are in an error state
      if (
        processedUserRef.current === userId &&
        processedUserRef.current !== null &&
        viewState.type !== 'error'
      ) {
        return;
      }

      // 1. Attempt Transfer Flow
      const transferResult = await handleTransferFlow(
        signUpRef.current,
        signInRef.current,
        setActiveRef.current
      );

      if (transferResult.handled) {
        if (!transferResult.success && mounted) {
          setViewState({ type: 'error', message: 'Errore trasferimento account.' });
        }
        return;
      }

      // 2. Validate Authentication
      if (!isSignedIn || !userId) return;

      processedUserRef.current = userId;

      // 3. Check User Existence & Onboarding Status
      try {
        const result = await checkUserExistsAction(userId);
        if (!mounted) return;

        // Handle database errors
        if (result.error || !result.data) {
          setViewState({ type: 'error', message: result.error || 'Errore verifica utente.' });
          return;
        }

        // Logic branching: Existing User -> Dashboard | New User -> Onboarding
        if (result.data.exists) {
          setViewState({ type: 'redirecting' });
          router.replace('/dashboard');
        } else {
          const categoriesResult = await getAllCategoriesAction();
          if (mounted) {
            setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
          }
        }
      } catch (error) {
        console.error('[SSO] Error:', error);
        if (mounted) {
          setViewState({ type: 'error', message: 'Errore verifica.' });
        }
      }
    }

    processCallback();

    return () => {
      mounted = false;
    };
  }, [isLoaded, isSignedIn, userId, router, viewState.type]);

  /**
   * Error & Timeout Handling Effect.
   * Redirects to auth page with error message after delay.
   */
  useEffect(() => {
    if (viewState.type === 'error' || (!isLoaded && !isSignedIn)) {
      const timer = setTimeout(() => {
        if (viewState.type === 'error') {
          router.replace(`/auth?error=${encodeURIComponent(viewState.message)}`);
        } else if (isLoaded && !isSignedIn) {
          router.replace('/auth?error=timeout');
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [viewState, isLoaded, isSignedIn, router]);

  /**
   * Submits the onboarding form payload.
   */
  const handleOnboardingComplete = useCallback(
    async (payload: OnboardingPayload): Promise<void> => {
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
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || '',
          },
          group: payload.group,
          accounts: payload.accounts,
          budgets: payload.budgets,
          budgetStartDay: payload.budgetStartDay,
        });

        if (result.error) {
          setOnboardingError(`${result.error}. Riprova.`);
          // Reload categories in case of retry needed state reset
          const categoriesResult = await getAllCategoriesAction();
          setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
          return;
        }

        router.replace('/dashboard');
      } catch (error) {
        console.error('Onboarding error:', error);
        setOnboardingError('Errore imprevisto. Riprova.');
        const categoriesResult = await getAllCategoriesAction();
        setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
      }
    },
    [userId, user, router]
  );

  return {
    viewState,
    onboardingError,
    handleOnboardingComplete,
  };
}
