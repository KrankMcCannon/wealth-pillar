import { useEffect, useReducer, useRef, useCallback } from 'react';
import { useAuth, useSignUp, useSignIn } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { checkUserExistsAction } from '@/features/onboarding/actions';
import type { SignUpResource, SignInResource, SetActive } from '@clerk/shared/types';
import type { AppLocale } from '@/i18n/routing';
import { useRouter } from '@/i18n/routing';

// ============================================================================
// TYPES
// ============================================================================

export type SSOCallbackViewState =
  | { type: 'checking' }
  | { type: 'redirecting' }
  | { type: 'error'; message: string };

type PhaseAction =
  | { type: 'reset' }
  | { type: 'set_redirecting' }
  | { type: 'set_error'; message: string };

function phaseReducer(_state: SSOCallbackViewState, action: PhaseAction): SSOCallbackViewState {
  switch (action.type) {
    case 'reset':
      return { type: 'checking' };
    case 'set_redirecting':
      return { type: 'redirecting' };
    case 'set_error':
      return { type: 'error', message: action.message };
    default:
      return { type: 'checking' };
  }
}

export interface UseSSOCallbackReturn {
  viewState: SSOCallbackViewState;
  retry: () => void;
}

// ============================================================================
// HELPERS
// ============================================================================

const CLERK_LOAD_TIMEOUT_MS = 5000;
const SESSION_WAIT_TIMEOUT_MS = 12000;
const CHECK_USER_EXISTS_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new Error('timeout'));
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}

async function handleTransferFlow(
  signUp: SignUpResource | undefined | null,
  signIn: SignInResource | undefined | null,
  setActive: SetActive | undefined | null
): Promise<{ success: boolean; handled: boolean; error?: unknown }> {
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
 * Post-OAuth: verifica sessione Clerk, utente in DB, poi redirect a home o `/onboarding`.
 *
 * - `AbortController`: in React Strict Mode l’effetto viene smontato; la richiesta annullata
 *   non deve navigare. Niente `processedUserRef` che può bloccare la seconda esecuzione.
 * - Navigazione con `location.assign`: evita `router.replace` + `await refresh()` che in dev
 *   possono non completare; full reload allinea RSC dopo login.
 */
export function useSSOCallback(): UseSSOCallbackReturn {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations('Auth.ssoCallback');
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { signUp, setActive } = useSignUp();
  const { signIn } = useSignIn();

  const [viewState, dispatch] = useReducer(phaseReducer, { type: 'checking' });

  const signUpRef = useRef(signUp);
  const signInRef = useRef(signIn);
  const setActiveRef = useRef(setActive);

  useEffect(() => {
    signUpRef.current = signUp;
    signInRef.current = signIn;
    setActiveRef.current = setActive;
  }, [signUp, signIn, setActive]);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    async function processCallback() {
      if (!isLoaded) return;

      const transferResult = await handleTransferFlow(
        signUpRef.current,
        signInRef.current,
        setActiveRef.current
      );

      if (transferResult.handled) {
        if (!transferResult.success && !signal.aborted) {
          dispatch({ type: 'set_error', message: t('errorTransferFailed') });
        }
        return;
      }

      if (!isSignedIn || !userId) return;

      try {
        let result: Awaited<ReturnType<typeof checkUserExistsAction>>;
        try {
          result = await withTimeout(
            checkUserExistsAction(userId, locale),
            CHECK_USER_EXISTS_TIMEOUT_MS
          );
        } catch (err) {
          const isTimeout = err instanceof Error && err.message === 'timeout';
          if (isTimeout) {
            if (!signal.aborted) {
              dispatch({ type: 'set_error', message: t('errorOperationTimeout') });
            }
            return;
          }
          throw err;
        }

        if (signal.aborted) return;

        if (result.error || !result.data) {
          dispatch({
            type: 'set_error',
            message: result.error || t('errorVerifyUserFailed'),
          });
          return;
        }

        if (result.data.exists) {
          dispatch({ type: 'set_redirecting' });
          if (signal.aborted) return;
          window.location.assign(`/${locale}/home`);
          return;
        }

        if (signal.aborted) return;
        window.location.assign(`/${locale}/onboarding`);
      } catch (error) {
        console.error('[SSO] Error:', error);
        if (!signal.aborted) {
          dispatch({ type: 'set_error', message: t('errorVerifyGeneric') });
        }
      }
    }

    processCallback().catch((err) => console.error('[SSO] processCallback:', err));

    return () => {
      ac.abort();
    };
  }, [isLoaded, isSignedIn, userId, locale, t]);

  /** Clerk non carica oppure sessione assente troppo a lungo → redirect login. */
  useEffect(() => {
    if (viewState.type === 'error') return;
    if (isSignedIn && isLoaded) return;

    const delay = !isLoaded ? CLERK_LOAD_TIMEOUT_MS : SESSION_WAIT_TIMEOUT_MS;
    const timer = setTimeout(() => {
      router.replace('/sign-in?error=timeout');
    }, delay);

    return () => clearTimeout(timer);
  }, [viewState.type, isLoaded, isSignedIn, router]);

  const retry = useCallback(() => {
    dispatch({ type: 'reset' });
  }, []);

  return {
    viewState,
    retry,
  };
}
