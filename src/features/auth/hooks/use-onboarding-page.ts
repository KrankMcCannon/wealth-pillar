'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import { checkUserExistsAction } from '@/features/onboarding/actions';
import type { Category } from '@/lib/types';
import type { OnboardingPayload } from '@/features/onboarding/types';
import { useOnboardingSubmission } from './use-onboarding-submission';

const CLERK_LOAD_TIMEOUT_MS = 5000;
const SESSION_WAIT_TIMEOUT_MS = 12000;

export type OnboardingPagePhase =
  | { type: 'loading' }
  | { type: 'ready'; categories: Category[] }
  | { type: 'error'; message: string }
  | { type: 'submitting' };

export function useOnboardingPage(): {
  phase: OnboardingPagePhase;
  handleComplete: (payload: OnboardingPayload) => Promise<void>;
} {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth.ssoCallback');
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { submit } = useOnboardingSubmission();

  const [phase, setPhase] = useState<OnboardingPagePhase>({ type: 'loading' });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !userId) return;

    let cancelled = false;

    (async () => {
      try {
        const result = await checkUserExistsAction(userId, locale);
        if (cancelled) return;

        if (result.error || !result.data) {
          setPhase({
            type: 'error',
            message: result.error || t('errorVerifyUserFailed'),
          });
          return;
        }

        if (result.data.exists) {
          await router.refresh();
          router.replace('/home');
          return;
        }

        const categoriesResult = await getAllCategoriesAction();
        if (cancelled) return;

        setPhase({ type: 'ready', categories: categoriesResult.data || [] });
      } catch (e) {
        console.error('[OnboardingPage] init error:', e);
        if (!cancelled) {
          setPhase({ type: 'error', message: t('errorVerifyGeneric') });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, userId, router, t, locale]);

  useEffect(() => {
    if (phase.type === 'error') return;
    if (isSignedIn && isLoaded) return;

    const delay = !isLoaded ? CLERK_LOAD_TIMEOUT_MS : SESSION_WAIT_TIMEOUT_MS;
    const timer = setTimeout(() => {
      router.replace('/sign-in?error=timeout');
    }, delay);

    return () => clearTimeout(timer);
  }, [phase.type, isLoaded, isSignedIn, router]);

  const handleComplete = useCallback(
    async (payload: OnboardingPayload) => {
      setPhase((p) => (p.type === 'ready' ? { type: 'submitting' } : p));

      const result = await submit(payload);

      if (result.ok) {
        return;
      }

      setPhase({
        type: 'ready',
        categories: result.categories,
      });
      throw new Error(result.error);
    },
    [submit]
  );

  return {
    phase,
    handleComplete,
  };
}
