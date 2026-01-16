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

  useEffect(() => {
    let mounted = true;

    async function processCallback() {
      if (!isLoaded) return;
      if (processedUserRef.current === userId && processedUserRef.current !== null && viewState.type !== 'error') return;

      const signUpClient = signUpRef.current;
      const signInClient = signInRef.current;
      const setActiveClient = setActiveRef.current;

      const isTransfer = signUpClient?.verifications?.externalAccount?.error?.code === 'external_account_exists';
      const transferStatus = signUpClient?.verifications?.externalAccount?.status === 'transferable';

      if (signUpClient && signInClient && isTransfer && transferStatus) {
        try {
          const signInAttempt = await signInClient.create({ transfer: true });
          if (signInAttempt.status === 'complete' && signInAttempt.createdSessionId && setActiveClient) {
            await setActiveClient({ session: signInAttempt.createdSessionId });
            return;
          }
        } catch (error) {
          console.error('[SSO] Transfer failed:', error);
          if (mounted) setViewState({ type: 'error', message: 'Errore trasferimento account.' });
          return;
        }
      }

      if (!isSignedIn || !userId) return;

      processedUserRef.current = userId;

      try {
        const result = await checkUserExistsAction(userId);
        if (!mounted) return;

        if (result.data?.exists) {
          setViewState({ type: 'redirecting' });
          router.replace('/dashboard');
        } else {
          const categoriesResult = await getAllCategoriesAction();
          if (mounted) setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
        }
      } catch (error) {
        console.error('[SSO] Error:', error);
        if (mounted) setViewState({ type: 'error', message: 'Errore verifica.' });
      }
    }

    processCallback();
    return () => { mounted = false; };
  }, [isLoaded, isSignedIn, userId, router, viewState.type]);

  // Handle error state redirect
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
        const categoriesResult = await getAllCategoriesAction();
        setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
        return;
      }

      router.replace('/dashboard');
    } catch (error) {
      console.error("Onboarding error:", error);
      setOnboardingError("Errore imprevisto. Riprova.");
      const categoriesResult = await getAllCategoriesAction();
      setViewState({ type: 'onboarding', categories: categoriesResult.data || [] });
    }
  };

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
          <p className={authStyles.loading.text}>{loadingMessage}</p>
        </div>
      </AuthCard>
    </>
  );
}
