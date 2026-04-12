'use client';

import { useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getAllCategoriesAction } from '@/features/categories/actions/category-actions';
import {
  completeOnboardingAction,
  deleteClerkUserAction,
  registerOrphanUserAction,
} from '@/features/onboarding/actions';
import type { OnboardingPayload } from '@/features/onboarding/types';
import type { Category } from '@/lib/types';

const COMPLETE_ONBOARDING_TIMEOUT_MS = 90_000;

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

export type OnboardingSubmitResult =
  | { ok: true }
  | { ok: false; error: string; categories: Category[]; isOrphanMessage?: boolean };

/**
 * Logica condivisa tra `/auth/sso-callback` (se usato) e `/onboarding`:
 * completa onboarding, invalida cache client e naviga alla home.
 */
export function useOnboardingSubmission(): {
  submit: (payload: OnboardingPayload) => Promise<OnboardingSubmitResult>;
} {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Auth.ssoCallback');
  const { userId } = useAuth();
  const { user } = useUser();

  const submit = useCallback(
    async (payload: OnboardingPayload): Promise<OnboardingSubmitResult> => {
      if (!userId || !user) {
        return {
          ok: false,
          error: t('errorUserNotIdentified'),
          categories: [],
        };
      }

      let result: Awaited<ReturnType<typeof completeOnboardingAction>>;
      try {
        result = await withTimeout(
          completeOnboardingAction(
            {
              user: {
                clerkId: userId,
                email: user.primaryEmailAddress?.emailAddress || '',
                name:
                  user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress || '',
              },
              group: payload.group,
              accounts: payload.accounts,
              budgets: payload.budgets,
              budgetStartDay: payload.budgetStartDay,
            },
            locale
          ),
          COMPLETE_ONBOARDING_TIMEOUT_MS
        );
      } catch (err) {
        const isTimeout = err instanceof Error && err.message === 'timeout';
        console.error('[Onboarding] completeOnboardingAction failed:', err);
        if (isTimeout) {
          const categoriesResult = await getAllCategoriesAction();
          return {
            ok: false,
            error: t('errorOperationTimeout'),
            categories: categoriesResult.data || [],
          };
        }
        const deleteResult = await deleteClerkUserAction(userId, locale);
        if (deleteResult.error) {
          await registerOrphanUserAction(userId, locale);
          const categoriesResult = await getAllCategoriesAction();
          return {
            ok: false,
            error: t('orphanSupportMessage'),
            categories: categoriesResult.data || [],
            isOrphanMessage: true,
          };
        }
        const categoriesResult = await getAllCategoriesAction();
        return {
          ok: false,
          error: t('errorUnexpected'),
          categories: categoriesResult.data || [],
        };
      }

      if (result.error) {
        if (result.errorCode !== 'already_configured') {
          const deleteResult = await deleteClerkUserAction(userId, locale);
          if (deleteResult.error) {
            await registerOrphanUserAction(userId, locale);
            const categoriesResult = await getAllCategoriesAction();
            return {
              ok: false,
              error: t('orphanSupportMessage'),
              categories: categoriesResult.data || [],
              isOrphanMessage: true,
            };
          }
        }
        const categoriesResult = await getAllCategoriesAction();
        return {
          ok: false,
          error: result.error,
          categories: categoriesResult.data || [],
        };
      }

      // Sincronizza RSC con il nuovo utente prima della navigazione client (fix refresh manuale).
      await router.refresh();
      router.replace('/home');
      return { ok: true };
    },
    [userId, user, router, t, locale]
  );

  return { submit };
}
