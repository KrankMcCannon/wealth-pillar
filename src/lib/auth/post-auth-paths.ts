import type { AppLocale } from '@/i18n/routing';

/** Percorsi post-autenticazione Clerk (localePrefix: always). */
export function authSsoCallbackPath(locale: AppLocale): string {
  return `/${locale}/auth/sso-callback`;
}

export function authOnboardingPath(locale: AppLocale): string {
  return `/${locale}/onboarding`;
}
